import { apiError, db, handle, readJson, requireTeacher, updateTeacherProfile } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/** GET /api/me */
export function GET(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const teacher = await db().teacher.findUnique({
      where: { id: ctx.teacherId },
      select: {
        id: true, email: true, name: true, timezone: true, spokenLangs: true,
        hourlyRateUsd: true, rateTier: true, billingStatus: true, creditBalance: true,
        onboardingStage: true,
      },
    });
    if (!teacher) throw apiError('NOT_FOUND');
    return { ...teacher, hourlyRateUsd: teacher.hourlyRateUsd ? Number(teacher.hourlyRateUsd) : null };
  });
}

/**
 * PATCH /api/me
 * 시급을 바꾸면 티어가 재산정되지만 진행 중 주기의 요금은 그대로다 (05번 §8-1).
 */
export function PATCH(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const body = await readJson<Parameters<typeof updateTeacherProfile>[1]>(req);
    return updateTeacherProfile(ctx.teacherId, body);
  });
}
