import {
  buildInvoice,
  planCycleClose,
  planInvoiceCreate,
  planLockEnforce,
  quoteCyclePrice,
  tierFromHourlyRate,
  type BillingCycle,
} from '@hangyeol/billing';
import { billingMonthKey, type RateTier } from '@hangyeol/shared';
import { db } from './guard.js';

/**
 * 과금 엔진(순수 함수)과 DB 를 잇는 얇은 층.
 *
 * 판정은 전부 packages/billing 이 한다. 여기서는 읽어오고 써넣기만 한다.
 * 이 경계가 무너지면 05번 문서의 TC 14개가 아무것도 보장하지 못한다.
 */

function toDomainCycle(row: {
  id: bigint;
  studentId: bigint;
  teacherId: bigint;
  cycleNo: number;
  periodStart: Date;
  periodEnd: Date;
  tier: string;
  baseAmount: number;
  discountPct: number;
  amount: number;
  lessonCount: number;
  activityCount: number;
  status: string;
  closedAt: Date | null;
}): BillingCycle & { id: number } {
  return {
    id: Number(row.id),
    studentId: Number(row.studentId),
    teacherId: Number(row.teacherId),
    cycleNo: row.cycleNo,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    tier: row.tier as RateTier,
    baseAmount: row.baseAmount,
    discountPct: row.discountPct,
    amount: row.amount,
    lessonCount: row.lessonCount,
    activityCount: row.activityCount,
    status: row.status as BillingCycle['status'],
    closedAt: row.closedAt,
  };
}

export interface BillingSummary {
  billingMonth: string;
  total: number;
  creditBalance: number;
  chargeAmount: number;
  activeCount: number;
  lines: { studentId: string; nameKo: string; amount: number; note: string }[];
  waived: { studentId: string; nameKo: string; reason: string }[];
  tier: RateTier;
  nextCyclePrice: number;
}

/**
 * 청구 요약 — 04번 문서 G, 화면은 07번 T-05.
 * 휴면 학생을 목록에서 숨기지 않는다. 0원으로 명시하는 것이 신뢰를 만든다.
 */
export async function billingSummary(teacherId: bigint, now = new Date()): Promise<BillingSummary> {
  const prisma = db();

  const [teacher, cycles, activeCount] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { creditBalance: true, rateTier: true, hourlyRateUsd: true },
    }),
    prisma.billingCycle.findMany({
      where: { teacherId, status: { in: ['billable', 'waived_dormant'] } },
      include: { student: { select: { nameKo: true, name: true } } },
    }),
    prisma.student.count({ where: { teacherId, status: 'active' } }),
  ]);

  const domain = cycles.map((c) => toDomainCycle(c));
  const result = buildInvoice({
    teacherId: Number(teacherId),
    now,
    cycles: domain,
    creditBalance: teacher?.creditBalance ?? 0,
  });

  const nameOf = (studentId: number) => {
    const row = cycles.find((c) => Number(c.studentId) === studentId);
    return row?.student.nameKo ?? row?.student.name ?? '';
  };

  const tier = (teacher?.rateTier ??
    tierFromHourlyRate(teacher?.hourlyRateUsd ? Number(teacher.hourlyRateUsd) : null)) as RateTier;

  return {
    billingMonth: result.invoice?.billingMonth ?? billingMonthKey(now),
    total: result.invoice?.totalAmount ?? 0,
    creditBalance: teacher?.creditBalance ?? 0,
    chargeAmount: result.invoice?.chargeAmount ?? 0,
    activeCount,
    lines: result.lines.map((l) => ({
      studentId: String(l.studentId),
      nameKo: nameOf(l.studentId),
      amount: l.amount,
      note: '',
    })),
    waived: result.waived.map((w) => ({
      studentId: String(w.studentId),
      nameKo: nameOf(w.studentId),
      reason: w.reason,
    })),
    tier,
    nextCyclePrice: quoteCyclePrice(tier, activeCount).amount,
  };
}

/** cycle-close 배치 (매일 KST 03:00). 판정은 순수 함수가 하고 여기서는 반영만 한다. */
export async function runCycleClose(now = new Date()) {
  const prisma = db();

  const openCycles = await prisma.billingCycle.findMany({
    where: { status: 'open', periodEnd: { lte: now } },
    orderBy: { cycleNo: 'asc' },
  });
  if (openCycles.length === 0) return { closed: 0, dormant: 0 };

  const students = await prisma.student.findMany({
    where: { id: { in: openCycles.map((c) => c.studentId) } },
    select: { id: true, currentLessonNo: true, teacherId: true },
  });
  const lessonNoOf = new Map(students.map((s) => [Number(s.id), s.currentLessonNo]));

  const teachers = await prisma.teacher.findMany({
    where: { id: { in: [...new Set(openCycles.map((c) => c.teacherId))] } },
    select: { id: true, rateTier: true, hourlyRateUsd: true },
  });
  const activeCounts = new Map<number, number>();
  for (const t of teachers) {
    activeCounts.set(
      Number(t.id),
      await prisma.student.count({ where: { teacherId: t.id, status: 'active' } }),
    );
  }

  // 구간별 집계를 미리 읽어두고, 순수 함수에는 조회 함수만 넘긴다.
  const counts = new Map<string, { lessonCount: number; activityCount: number }>();
  for (const c of openCycles) {
    const [lessonCount, activityCount] = await Promise.all([
      prisma.lesson.count({
        where: { studentId: c.studentId, startedAt: { gte: c.periodStart, lt: c.periodEnd } },
      }),
      prisma.studentActivity.count({
        where: { studentId: c.studentId, occurredAt: { gte: c.periodStart, lt: c.periodEnd } },
      }),
    ]);
    counts.set(`${c.studentId}:${c.periodStart.toISOString()}`, { lessonCount, activityCount });
  }

  const plans = planCycleClose({
    now,
    openCycles: openCycles.map(toDomainCycle),
    countsFor: (studentId, periodStart) => {
      const hit = counts.get(`${studentId}:${periodStart.toISOString()}`) ?? {
        lessonCount: 0,
        activityCount: 0,
      };
      return { ...hit, currentLessonNo: lessonNoOf.get(studentId) ?? 0 };
    },
    teacherContext: (teacherId) => {
      const t = teachers.find((x) => Number(x.id) === teacherId);
      const tier = (t?.rateTier ??
        tierFromHourlyRate(t?.hourlyRateUsd ? Number(t.hourlyRateUsd) : null)) as RateTier;
      return { tier, activeStudentCount: activeCounts.get(teacherId) ?? 0 };
    },
  });

  let closed = 0;
  let dormant = 0;

  for (const plan of plans) {
    for (const c of plan.closed) {
      await prisma.billingCycle.updateMany({
        // closedAt IS NULL 조건으로 재실행 시 중복 갱신을 막는다 (10번 문서 §6).
        where: { studentId: BigInt(c.studentId), cycleNo: c.cycleNo, closedAt: null },
        data: {
          status: c.status,
          amount: c.amount,
          lessonCount: c.lessonCount,
          activityCount: c.activityCount,
          closedAt: c.closedAt,
        },
      });
      closed += 1;
    }

    if (plan.nextOpenCycle) {
      const n = plan.nextOpenCycle;
      await prisma.billingCycle.upsert({
        where: { studentId_cycleNo: { studentId: BigInt(n.studentId), cycleNo: n.cycleNo } },
        create: {
          studentId: BigInt(n.studentId),
          teacherId: BigInt(n.teacherId),
          cycleNo: n.cycleNo,
          periodStart: n.periodStart,
          periodEnd: n.periodEnd,
          tier: n.tier,
          baseAmount: n.baseAmount,
          discountPct: n.discountPct,
          amount: n.amount,
          status: 'open',
        },
        update: {},
      });
    }

    await prisma.student.update({
      where: { id: BigInt(plan.studentId) },
      data: { status: plan.studentStatus },
    });

    if (plan.notifyDormant) {
      dormant += 1;
      await prisma.notification.create({
        data: {
          targetType: 'teacher',
          targetId: BigInt(openCycles.find((c) => Number(c.studentId) === plan.studentId)!.teacherId),
          kind: 'cycle_billed',
          scheduledAt: now,
          channel: 'email',
          payload: { studentId: plan.studentId, dormant: true },
        },
      });
    }
  }

  return { closed, dormant };
}

/**
 * invoice-create 배치 (매월 1일 KST 00:00).
 *
 * 크론은 UTC 로 돈다. "매월 1일 KST" 를 크론 표현식으로 쓰면
 * `0 15 1 * *` 가 되는데 그건 KST 로 2일 00:00 이다. 전월 마지막 날을
 * 크론으로 지정할 방법도 없다. 그래서 매일 UTC 15:00(= KST 00:00)에 부르고
 * 1일이 아니면 여기서 그냥 돌아간다.
 */
export async function runInvoiceCreate(now = new Date()) {
  const kstDay = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDate();
  if (kstDay !== 1) return { created: 0, skipped: 'KST 기준 1일이 아님' as const };

  const prisma = db();

  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      creditBalance: true,
      billingCycles: { where: { status: 'billable' } },
    },
  });

  const plans = planInvoiceCreate({
    now,
    teachers: teachers.map((t) => ({
      teacherId: Number(t.id),
      creditBalance: t.creditBalance,
      cycles: t.billingCycles.map(toDomainCycle),
    })),
  });

  let created = 0;

  for (const plan of plans) {
    if (!plan.invoice) continue;

    const existing = await prisma.invoice.findUnique({
      where: {
        teacherId_billingMonth: {
          teacherId: BigInt(plan.teacherId),
          billingMonth: new Date(plan.invoice.billingMonth),
        },
      },
    });
    // (teacher_id, billing_month) 유니크가 중복 청구를 막는 유일한 방벽이다.
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          teacherId: BigInt(plan.teacherId),
          billingMonth: new Date(plan.invoice!.billingMonth),
          totalAmount: plan.invoice!.totalAmount,
          creditApplied: plan.invoice!.creditApplied,
          chargeAmount: plan.invoice!.chargeAmount,
          status: plan.invoice!.status,
        },
      });

      await tx.invoiceLine.createMany({
        data: plan.lines.map((l) => ({
          invoiceId: invoice.id,
          billingCycleId: BigInt(l.billingCycleId!),
          studentId: BigInt(l.studentId),
          amount: l.amount,
        })),
      });

      await tx.billingCycle.updateMany({
        where: { id: { in: plan.invoicedCycleIds.filter((x): x is number => x !== null).map(BigInt) } },
        data: { status: plan.cycleStatusAfter },
      });

      await tx.teacher.update({
        where: { id: BigInt(plan.teacherId) },
        data: { creditBalance: plan.creditBalanceAfter },
      });
    });

    created += 1;
  }

  return { created };
}

/** lock-enforce 배치 (매일 KST 04:00). */
export async function runLockEnforce(now = new Date()) {
  const prisma = db();

  const invoices = await prisma.invoice.findMany({ where: { status: 'grace' } });

  const plans = planLockEnforce(
    invoices.map((i) => ({
      id: Number(i.id),
      teacherId: Number(i.teacherId),
      status: i.status as never,
      failedAt: i.failedAt,
      graceUntil: i.graceUntil,
      retryCount: i.retryCount,
      paidAt: i.paidAt,
      pgTid: i.pgTid,
    })),
    now,
  );

  for (const plan of plans) {
    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id: BigInt(plan.invoiceId) }, data: { status: 'locked' } });
      await tx.teacher.update({
        where: { id: BigInt(plan.teacherId) },
        data: { billingStatus: 'locked' },
      });

      // 복원을 위해 직전 상태를 보존한 뒤 잠근다.
      await tx.$executeRaw`
        UPDATE students
        SET status_before_lock = status, status = 'locked'
        WHERE teacher_id = ${BigInt(plan.teacherId)} AND status <> 'locked'
      `;
    });
  }

  return { locked: plans.length };
}
