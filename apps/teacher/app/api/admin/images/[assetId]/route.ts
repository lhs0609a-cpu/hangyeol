import { IMAGE_ASSETS, imageStorageKey } from '@hangyeol/content';
import { apiError, db, handle, isStorageConfigured, putObject, requireAdmin } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** 업로드 상한. 슬라이드 한 장이 이걸 넘을 이유가 없다. */
const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED = ['image/webp', 'image/png', 'image/jpeg'];

/**
 * POST /api/admin/images/:assetId
 *
 * 생성한 이미지를 올린다. 올리는 순간 그 자리에 들어간다 —
 * 코드를 고칠 필요가 없다. storageKey 가 자산 id 에서 결정되기 때문이다.
 */
export function POST(req: Request, { params }: { params: { assetId: string } }) {
  return handle(async () => {
    await requireAdmin(req);

    const asset = IMAGE_ASSETS.find((a) => a.id === params.assetId);
    if (!asset) throw apiError('NOT_FOUND', '등록되지 않은 이미지 자산입니다');

    if (!isStorageConfigured()) {
      throw apiError('INTERNAL', '자산 스토리지(R2)가 연결되지 않았습니다');
    }

    const type = req.headers.get('content-type') ?? '';
    if (!ALLOWED.includes(type)) {
      throw apiError('VALIDATION_FAILED', `이미지 형식은 ${ALLOWED.join(' · ')} 만 됩니다`);
    }

    const body = Buffer.from(await req.arrayBuffer());
    if (body.byteLength === 0) throw apiError('VALIDATION_FAILED', '빈 파일입니다');
    if (body.byteLength > MAX_BYTES) {
      throw apiError('VALIDATION_FAILED', `파일이 너무 큽니다 (최대 ${MAX_BYTES / 1024 / 1024}MB)`);
    }

    const storageKey = imageStorageKey(asset.id);
    await putObject(storageKey, body, type);

    // 차시 슬라이드면 curriculum_assets 에 등록해 뷰어가 찾을 수 있게 한다.
    if (asset.unitNo !== undefined) {
      const unit = await db().curriculumUnit.findUnique({ where: { unitNo: asset.unitNo } });
      if (unit) {
        await db().curriculumAsset.upsert({
          where: { unitId_l1Code_kind: { unitId: unit.id, l1Code: 'xx', kind: 'slide' } },
          create: { unitId: unit.id, l1Code: 'xx', kind: 'slide', storageKey, pageCount: 1 },
          update: { storageKey },
        });
      }
    }

    return { ok: true, assetId: asset.id, storageKey, bytes: body.byteLength };
  });
}
