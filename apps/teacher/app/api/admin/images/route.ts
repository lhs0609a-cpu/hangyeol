import { fullPrompt, IMAGE_ASSETS, imageStorageKey } from '@hangyeol/content';
import { db, handle, isStorageConfigured, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/images
 *
 * 만들어야 할 이미지 전체와 각각의 생성 프롬프트, 그리고 업로드 여부.
 * 프롬프트를 코드에서 만들어 내려주는 이유는 지도안이 바뀌면 프롬프트도
 * 따라 바뀌어야 하기 때문이다. 두 곳에 적으면 반드시 어긋난다.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireTeacher(req);

    const uploaded = new Set(
      (await db().curriculumAsset.findMany({ select: { storageKey: true } })).map((a) => a.storageKey),
    );

    const unit = new URL(req.url).searchParams.get('unit');
    const scope = unit ? IMAGE_ASSETS.filter((a) => String(a.unitNo) === unit) : IMAGE_ASSETS;

    return {
      storageConfigured: isStorageConfigured(),
      total: IMAGE_ASSETS.length,
      uploadedCount: IMAGE_ASSETS.filter((a) => uploaded.has(imageStorageKey(a.id))).length,
      items: scope.map((a) => ({
        id: a.id,
        slot: a.slot,
        usedAt: a.usedAt,
        aspect: a.aspect,
        unitNo: a.unitNo ?? null,
        storageKey: imageStorageKey(a.id),
        uploaded: uploaded.has(imageStorageKey(a.id)),
        prompt: fullPrompt(a),
      })),
    };
  });
}
