import { CONTENT_STATUS } from '@hangyeol/content';
import { addDays } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';

/*
 * 관리자 지표.
 *
 * 학생 활동 기록은 note.ts 의 SRS 채점과 students.ts 의 노트 열람에서 남는다.
 * 그 기록이 과금 활성 판정 (B) 조건의 유일한 근거다 —
 * 학생 도구를 복습 카드 하나로 줄인 뒤에도 (B) 가 성립하는 이유가 그것이다.
 */

/**
 * 관리자 지표 — 05번 문서 §10 · 11번 문서 핵심 지표.
 *
 * "열람은 있으나 학생활동 0" 이 가장 중요하다.
 * 이 수치가 올라가면 잠금장치가 새고 있다는 뜻이다.
 */
export async function adminMetrics(now = new Date()) {
  const prisma = db();

  const [activeStudents, dormantStudents, lockedStudents, teachers, cycles, invoices] =
    await Promise.all([
      prisma.student.count({ where: { status: 'active' } }),
      prisma.student.count({ where: { status: 'dormant' } }),
      prisma.student.count({ where: { status: 'locked' } }),
      prisma.teacher.count(),
      prisma.billingCycle.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.invoice.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

  const cycleBy = Object.fromEntries(cycles.map((c) => [c.status, c._count._all]));
  const invoiceBy = Object.fromEntries(invoices.map((i) => [i.status, i._count._all]));

  const closed = (cycleBy.billable ?? 0) + (cycleBy.waived_dormant ?? 0);
  const dormantRate = closed === 0 ? 0 : Math.round(((cycleBy.waived_dormant ?? 0) / closed) * 100);

  // 우회 신호 — 열람은 있으나 30일 이상 학생활동이 0인 학생.
  const cutoff = addDays(now, -30);
  const viewedStudentIds = await prisma.assetView.findMany({
    where: { openedAt: { gte: cutoff } },
    select: { studentId: true },
    distinct: ['studentId'],
  });

  let bypassSuspects = 0;
  for (const { studentId } of viewedStudentIds) {
    const activity = await prisma.studentActivity.count({
      where: { studentId, occurredAt: { gte: cutoff } },
    });
    if (activity === 0) bypassSuspects += 1;
  }

  const creditTotal = await prisma.teacher.aggregate({ _sum: { creditBalance: true } });

  return {
    students: { active: activeStudents, dormant: dormantStudents, locked: lockedStudents },
    teachers,
    avgStudentsPerTeacher: teachers === 0 ? 0 : Math.round((activeStudents / teachers) * 10) / 10,
    cycles: cycleBy,
    invoices: invoiceBy,
    dormantRatePct: dormantRate,
    creditBalanceTotal: creditTotal._sum.creditBalance ?? 0,
    /** 이 수치가 올라가면 잠금장치가 새고 있다는 뜻이다. 경고선 10%. */
    bypassSuspects,
    /** 콘텐츠 제작 현황. 목표 대비 실제를 항상 눈에 둔다. */
    content: CONTENT_STATUS,
  };
}
