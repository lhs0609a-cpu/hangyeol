import { CACHE_TTL_SEC, cacheKey, composite } from '@hangyeol/watermark';
import {
  apiError,
  db,
  getObject,
  handle,
  isStorageConfigured,
  json,
  requireStudentContext,
  verifyAssetUrl,
  watermarkFor,
} from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/assets/render?t=&s=&u=&p=&exp=&sig=
 *
 * 서명 URL 의 착지점. 여기가 자료 잠금의 마지막 관문이다.
 *
 *   1. 서명이 유효하고 만료되지 않았는가
 *   2. 지금 요청한 강사가 서명에 박힌 그 강사이고, 학생 컨텍스트가 여전히 유효한가
 *   3. 원본을 읽어 워터마크를 서버에서 합성한다
 *
 * 2번이 없으면 강사 A 가 발급받은 URL 을 강사 B 가 쓸 수 있다.
 * 3번이 CSS 오버레이가 아닌 이유는 그것이 개발자도구로 지워지기 때문이다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const binding = verifyAssetUrl(url.searchParams);

    const ctx = await requireStudentContext(req, binding.studentId);
    if (String(ctx.teacherId) !== binding.teacherId) {
      throw apiError('STUDENT_REQUIRED', '이 자료에 대한 권한이 없습니다');
    }

    const asset = await db().curriculumAsset.findFirst({
      where: { unitId: BigInt(binding.unitId), kind: 'slide' },
      orderBy: { l1Code: ctx.student.l1Code === 'xx' ? 'asc' : 'desc' },
      select: { storageKey: true, id: true },
    });

    if (!asset) throw apiError('NOT_FOUND', '이 차시의 슬라이드가 아직 제작되지 않았습니다');

    if (!isStorageConfigured()) {
      // 스토리지가 없으면 합성할 원본이 없다. 가짜 이미지를 만들어 내보내지 않는다.
      return json(
        {
          error: {
            code: 'NOT_FOUND',
            message: '자산 스토리지(R2)가 연결되지 않았습니다',
            detail: { storageKey: asset.storageKey, page: binding.page },
          },
        },
        { status: 404 },
      );
    }

    // 페이지별 원본 키. 빌드 배치가 이 규칙으로 이미지 시퀀스를 올린다.
    const sourceKey = `${asset.storageKey}/${String(binding.page).padStart(3, '0')}.webp`;
    const source = await getObject(sourceKey);
    if (!source) throw apiError('NOT_FOUND', '슬라이드 페이지를 찾지 못했습니다');

    const watermark = watermarkFor(ctx);
    const image = await composite({ source, line: watermark.line });

    return new Response(new Uint8Array(image), {
      headers: {
        'content-type': 'image/webp',
        // 같은 (unit, page, student, 날짜) 조합은 하루 동안 같은 이미지다.
        // 매 요청 합성하면 CPU 가 터진다 (10번 문서 §5).
        'cache-control': `private, max-age=${CACHE_TTL_SEC}`,
        'x-cache-key': cacheKey({
          unitId: binding.unitId,
          page: binding.page,
          studentId: binding.studentId,
        }),
        // 브라우저가 이미지를 내려받기 대상으로 다루지 않게 한다.
        'content-disposition': 'inline',
        'x-content-type-options': 'nosniff',
      },
    });
  });
}
