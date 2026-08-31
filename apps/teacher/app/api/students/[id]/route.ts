import { completeStudent, db, handle, lastReport, requireOwnStudent } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/** GET /api/students/:id — 04번 문서 C. */
export function GET(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { student } = await requireOwnStudent(req, params.id);

    const [vocabCount, cycle, report] = await Promise.all([
      db().vocabCard.count({ where: { studentId: student.id } }),
      db().billingCycle.findFirst({
        where: { studentId: student.id, status: 'open' },
        orderBy: { cycleNo: 'desc' },
        select: { cycleNo: true, periodEnd: true, amount: true },
      }),
      lastReport(student.id),
    ]);

    return {
      id: String(student.id),
      name: student.name,
      nameKo: student.nameKo,
      flag: student.countryCode,
      status: student.status,
      verifiedAt: student.verifiedAt,
      levelCode: student.levelCode,
      currentLessonNo: student.currentLessonNo,
      vocabCount,
      lastReport: report,
      billing: cycle
        ? { cycleNo: cycle.cycleNo, periodEnd: cycle.periodEnd, amount: cycle.amount }
        : null,
    };
  });
}

/** POST 로 종료 처리 (04번 문서의 /students/:id/complete 대응). */
export function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = await requireOwnStudent(req, params.id);
    return completeStudent(ctx.teacherId, ctx.student.id);
  });
}
