import { buildDeck, imageStorageKey } from '@hangyeol/content';
import { apiError, clientIp, enforce, handle, recordAssetView, requireStudentContext, watermarkFor } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/units/:unitId/deck?student_id=
 *
 * 슬라이드를 데이터에서 만들어 내려준다. 이미지 파일을 기다리지 않는다 —
 * 언어 수업 슬라이드에 들어가는 것은 대부분 글자이고, 그건 지도안에 이미 있다.
 *
 * 04번 문서 E 의 필수 규칙은 그대로다:
 *   student_id 없으면 403 · 미인증 4차시 403 · 강사 잠금 403 · 열람 로그 전건
 * 판정은 requireStudentContext 안에서 강제된다. 이 핸들러는 다시 하지 않는다.
 */
export function GET(req: Request, { params }: { params: { unitId: string } }) {
  return handle(async () => {
    const studentId = new URL(req.url).searchParams.get('student_id');
    const ctx = await requireStudentContext(req, studentId);

    enforce('assetSign', String(ctx.teacherId));

    const unitNo = Number(params.unitId);
    const deck = buildDeck(unitNo);
    if (!deck) throw apiError('NOT_FOUND', '아직 만들어지지 않은 차시입니다');

    await recordAssetView({
      teacherId: ctx.teacherId,
      studentId: ctx.student.id,
      unitId: BigInt(unitNo),
      ip: clientIp(req),
      ua: req.headers.get('user-agent'),
    });

    return {
      unitNo: deck.unitNo,
      title: deck.title,
      goalStatement: deck.goalStatement,
      watermark: watermarkFor(ctx).line,
      slides: deck.slides.map((s) => ({
        ...s,
        // 이미지는 있으면 좋은 자리다. 없어도 슬라이드는 성립한다.
        imageKey: s.imageAssetId ? imageStorageKey(s.imageAssetId) : null,
      })),
    };
  });
}
