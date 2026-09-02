import {
  clientIp,
  enforce,
  handle,
  recordAssetView,
  requireStudentContext,
  slidesForUnit,
} from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/**
 * GET /api/units/:unitId/slides?student_id=
 *
 * 04번 문서 E 필수 규칙:
 *   · student_id 없으면 403 STUDENT_REQUIRED
 *   · pending & lesson_no >= 4 → 403 STUDENT_NOT_VERIFIED
 *   · billing_status='locked' → 403 TEACHER_LOCKED
 *   · TTL 300초 서명 URL, 정적 경로 노출 금지
 *   · watermark 객체 필수 포함
 *
 * 앞의 세 줄은 requireStudentContext 안에서 강제된다.
 * 이 핸들러가 판정을 다시 하지 않는 것이 중요하다 — 빠뜨릴 수 없게 하려는 것이다.
 */
export function GET(req: Request, { params }: { params: { unitId: string } }) {
  return handle(async () => {
    const url = new URL(req.url);
    const studentId = url.searchParams.get('student_id');

    const ctx = await requireStudentContext(req, studentId);

    // 04번 §K — 120회 / 분 / 강사. 자료를 긁어가는 속도를 제한한다.
    enforce('assetSign', String(ctx.teacherId));

    const unitId = BigInt(params.unitId);

    const slides = await slidesForUnit(ctx, unitId);

    // 열람 로그는 전건 남긴다. "열람은 있으나 학생활동 0" 지표의 원천이다.
    await recordAssetView({
      teacherId: ctx.teacherId,
      studentId: ctx.student.id,
      unitId,
      ip: clientIp(req),
      ua: req.headers.get('user-agent'),
    });

    return slides;
  });
}
