import { handle, requireTeacher, todayLessons } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/lessons/today — 07번 문서 T-01 의 출발 패널 원천.
 *
 * 예약(lesson_schedules)에서 온다. 15분 이내면 imminent 가 켜지고
 * 프론트가 출발 패널로 전환한다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    return todayLessons(ctx.teacherId);
  });
}
