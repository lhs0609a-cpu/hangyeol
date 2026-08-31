import { db, handle, lastReport, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/**
 * GET /api/lessons/today — 07번 문서 T-01 의 출발 패널 원천.
 *
 * 예약 시스템이 아직 없으므로 "다음에 가르칠 학생"을 최근 활동 순으로 낸다.
 * 예약이 붙으면 scheduled_at 기준으로 바뀐다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);

    const students = await db().student.findMany({
      where: { teacherId: ctx.teacherId, status: { in: ['active', 'pending'] } },
      orderBy: [{ lastLessonAt: 'asc' }],
      take: 5,
      select: {
        id: true, name: true, nameKo: true, countryCode: true, l1Code: true,
        levelCode: true, currentLessonNo: true, status: true,
      },
    });

    const items = await Promise.all(
      students.map(async (s) => ({
        studentId: String(s.id),
        name: s.name,
        nameKo: s.nameKo ?? s.name,
        flag: s.countryCode,
        l1Code: s.l1Code,
        levelCode: s.levelCode,
        nextLessonNo: s.currentLessonNo + 1,
        status: s.status,
        prev: await lastReport(s.id),
      })),
    );

    return { items };
  });
}
