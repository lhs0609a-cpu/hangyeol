import { CONTENT_STATUS } from '@hangyeol/content';
import { addDays } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';

/*
 * 학생 학습 활동 기록 — HVPT · 4·3·2 · 다청.
 *
 * 이 셋의 공통점: 매 호출이 student_activity 를 남긴다는 것이다.
 * 그 기록이 과금 활성판정 (B) 조건의 유일한 근거다.
 * 여기서 기록을 빠뜨리면 실제로 학습한 학생이 휴면 처리된다.
 */

export interface HvptAttemptResult {
  correct: boolean;
  answer: string;
  session: { attempts: number; correct: number };
}

export async function recordHvptAttempt(params: {
  studentId: bigint;
  tokenId: bigint;
  chosen: string;
  responseMs: number | null;
}): Promise<HvptAttemptResult> {
  const prisma = db();

  const token = await prisma.hvptToken.findUnique({
    where: { id: params.tokenId },
    select: { id: true, token: true, contrastId: true },
  });
  if (!token) throw apiError('NOT_FOUND');

  const correct = token.token === params.chosen;

  // 세션은 대립쌍 단위로 열어 둔다. 없으면 만든다.
  let session = await prisma.hvptSession.findFirst({
    where: { studentId: params.studentId, contrastId: token.contrastId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  });

  if (!session) {
    session = await prisma.hvptSession.create({
      data: { studentId: params.studentId, contrastId: token.contrastId },
    });
  }

  const [, updated] = await prisma.$transaction([
    prisma.hvptAttempt.create({
      data: {
        sessionId: session.id,
        tokenId: token.id,
        chosen: params.chosen,
        isCorrect: correct,
        responseMs: params.responseMs,
      },
    }),
    prisma.hvptSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 }, correct: { increment: correct ? 1 : 0 } },
    }),
    prisma.studentActivity.create({ data: { studentId: params.studentId, kind: 'hvpt' } }),
  ]);

  return {
    correct,
    answer: token.token,
    session: { attempts: updated.attempts, correct: updated.correct },
  };
}

export async function recordFluencyRound(
  studentId: bigint,
  round: 1 | 2 | 3,
  topicId: number | null,
  now = new Date(),
) {
  const prisma = db();

  let session = await prisma.fluencySession.findFirst({
    where: { studentId, r3DoneAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) {
    session = await prisma.fluencySession.create({
      data: { studentId, topicId: topicId === null ? null : BigInt(topicId) },
    });
  }

  const field = ({ 1: 'r1DoneAt', 2: 'r2DoneAt', 3: 'r3DoneAt' } as const)[round];

  await prisma.$transaction([
    prisma.fluencySession.update({ where: { id: session.id }, data: { [field]: now } }),
    prisma.studentActivity.create({ data: { studentId, kind: 'fluency' } }),
  ]);

  return { round, done: true };
}

export async function recordListening(
  studentId: bigint,
  audioId: bigint,
  playedSec: number,
  completed: boolean,
  now = new Date(),
) {
  const prisma = db();

  await prisma.$transaction([
    prisma.listeningLog.create({
      data: { studentId, audioId, playedSec, completedAt: completed ? now : null },
    }),
    prisma.studentActivity.create({ data: { studentId, kind: 'listen' } }),
  ]);

  return { ok: true };
}

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
