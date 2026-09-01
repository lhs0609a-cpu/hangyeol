import { handle, masteryPlan, requireTeacher, teachingPlan } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/students/:id/plan
 *
 * "이 학생에게 지금 무엇을 해야 하는가" — 교재만 주면 강사는 여전히 판단해야 한다.
 * 그 판단을 대신 해 준다. 근거는 전부 우리가 이미 가진 데이터이고,
 * 외부 API 를 부르지 않는다.
 */
export function GET(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const studentId = BigInt(params.id);
    const [teaching, mastery] = await Promise.all([
      teachingPlan(ctx.teacherId, studentId),
      masteryPlan(ctx.teacherId, studentId),
    ]);
    return { teaching, mastery };
  });
}
