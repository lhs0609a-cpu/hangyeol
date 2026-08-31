import {
  openCycle,
  shouldOpenCycleOnLesson,
  tierFromHourlyRate,
  type BillingCycle,
} from '@hangyeol/billing';
import { addDays, type RateTier, type StudentStatus } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';

/**
 * 수업 진행 — 02번 문서 C-03·C-07·C-08.
 *
 * 이 파일의 startLesson 이 매출의 시작점이다.
 * 2차시에 들어서는 순간 과금 주기가 열리고, 그 시점의 티어와 할인율이 고정된다.
 */

export const MAX_EXPRESSIONS = 5;
export const MAX_ERRORS = 3;

/** 리포트 저장 시 예약하는 복습 알림 시점 (03번 문서 §5 고정 체크포인트). */
export const SRS_CHECKPOINTS_DAYS = [1, 3, 7, 21, 60];

export interface StartLessonResult {
  lessonId: bigint;
  lessonNo: number;
  unitId: bigint | null;
  billing: { cycleOpened: boolean; amount: number | null; cycleNo: number | null };
}

/**
 * 수업 시작.
 *
 * 트랜잭션으로 묶는 이유: 차시 증가와 주기 개시가 갈라지면
 * 2차시인데 주기가 없거나, 주기만 두 번 열리는 상태가 만들어진다.
 * 둘 다 곧바로 과금 분쟁이 된다.
 */
export async function startLesson(params: {
  teacherId: bigint;
  studentId: bigint;
  unitId?: bigint | null;
  now?: Date;
}): Promise<StartLessonResult> {
  const prisma = db();
  const now = params.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { id: params.studentId },
      select: { id: true, teacherId: true, status: true, currentLessonNo: true, firstLessonAt: true },
    });
    if (!student || student.teacherId !== params.teacherId) throw apiError('NOT_FOUND');

    const teacher = await tx.teacher.findUnique({
      where: { id: params.teacherId },
      select: { hourlyRateUsd: true, rateTier: true, billingStatus: true },
    });
    if (!teacher) throw apiError('NOT_FOUND');
    if (teacher.billingStatus === 'locked') throw apiError('TEACHER_LOCKED');

    const lessonNo = student.currentLessonNo + 1;

    const openCycleRow = await tx.billingCycle.findFirst({
      where: { studentId: student.id, status: 'open' },
      orderBy: { cycleNo: 'desc' },
    });

    const mustOpen = shouldOpenCycleOnLesson({
      studentStatus: student.status as StudentStatus,
      lessonNo,
      hasOpenCycle: Boolean(openCycleRow),
    });

    let cycle: BillingCycle | null = null;
    let cycleRowId = openCycleRow?.id ?? null;

    if (mustOpen) {
      const [maxCycle, activeCount] = await Promise.all([
        tx.billingCycle.aggregate({ where: { studentId: student.id }, _max: { cycleNo: true } }),
        tx.student.count({ where: { teacherId: params.teacherId, status: 'active' } }),
      ]);

      const tier = (teacher.rateTier ??
        tierFromHourlyRate(teacher.hourlyRateUsd ? Number(teacher.hourlyRateUsd) : null)) as RateTier;

      cycle = openCycle({
        studentId: Number(student.id),
        teacherId: Number(params.teacherId),
        previousCycleNo: maxCycle._max.cycleNo ?? 0,
        // dormant 재개든 2차시 진입이든 그 수업 시각부터 연다.
        periodStart: now,
        tier,
        activeStudentCount: activeCount,
      });

      const created = await tx.billingCycle.create({
        data: {
          studentId: student.id,
          teacherId: params.teacherId,
          cycleNo: cycle.cycleNo,
          periodStart: cycle.periodStart,
          periodEnd: cycle.periodEnd,
          tier: cycle.tier,
          baseAmount: cycle.baseAmount,
          discountPct: cycle.discountPct,
          amount: cycle.amount,
          status: 'open',
        },
        select: { id: true },
      });
      cycleRowId = created.id;
    }

    const lesson = await tx.lesson.create({
      data: {
        studentId: student.id,
        teacherId: params.teacherId,
        lessonNo,
        unitId: params.unitId ?? null,
        startedAt: now,
        billingCycleId: cycleRowId,
      },
      select: { id: true, lessonNo: true, unitId: true },
    });

    await tx.student.update({
      where: { id: student.id },
      data: {
        currentLessonNo: lessonNo,
        lastLessonAt: now,
        firstLessonAt: student.firstLessonAt ?? now,
        // 휴면 학생이 수업을 재개하면 그 자리에서 활성으로 돌린다.
        ...(student.status === 'dormant' ? { status: 'active' } : {}),
      },
    });

    return {
      lessonId: lesson.id,
      lessonNo: lesson.lessonNo,
      unitId: lesson.unitId,
      billing: {
        cycleOpened: mustOpen,
        amount: cycle?.amount ?? null,
        cycleNo: cycle?.cycleNo ?? null,
      },
    };
  });
}

export interface SubmitReportInput {
  teacherId: bigint;
  lessonId: bigint;
  expressions: string[];
  errors: string[];
  outcome: 'pass' | 'repeat';
  now?: Date;
}

export interface SubmitReportResult {
  ok: true;
  vocabCreated: number;
  srsScheduled: string[];
  externalApiCalls: 0;
}

/**
 * 3분 리포트 — STT 를 대체하는 장치.
 *
 * 07번 문서 T-03 수용기준: 저장 시 외부 API 호출이 0건이어야 한다.
 * 이 함수는 네트워크를 전혀 건드리지 않는다. 그게 요구사항이다.
 */
export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  if (input.expressions.length < 1 || input.expressions.length > MAX_EXPRESSIONS) {
    throw apiError('REPORT_LIMIT', `표현은 1~${MAX_EXPRESSIONS}개여야 합니다`);
  }
  if (input.errors.length > MAX_ERRORS) {
    throw apiError('REPORT_LIMIT', `오답은 최대 ${MAX_ERRORS}개입니다`);
  }

  const prisma = db();
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.findUnique({
      where: { id: input.lessonId },
      select: { id: true, teacherId: true, studentId: true },
    });
    if (!lesson || lesson.teacherId !== input.teacherId) throw apiError('NOT_FOUND');

    await tx.lessonReportItem.deleteMany({ where: { lessonId: lesson.id } });

    await tx.lessonReportItem.createMany({
      data: [
        ...input.expressions.map((body, ord) => ({ lessonId: lesson.id, kind: 'expression', body, ord })),
        ...input.errors.map((body, ord) => ({ lessonId: lesson.id, kind: 'error', body, ord })),
      ],
    });

    // 표현이 그대로 SRS 카드가 되고, 다음 수업의 복습 슬라이드가 된다.
    // 이 연결이 강사가 리포트를 성실히 쓰는 유일한 동기다.
    await tx.vocabCard.createMany({
      data: input.expressions.map((term) => ({
        studentId: lesson.studentId,
        sourceLessonId: lesson.id,
        term,
        dueAt: addDays(now, 1),
      })),
    });

    await tx.lesson.update({
      where: { id: lesson.id },
      data: { outcome: input.outcome, endedAt: now, reportSubmittedAt: now },
    });

    await tx.notification.createMany({
      data: SRS_CHECKPOINTS_DAYS.map((d) => ({
        targetType: 'student',
        targetId: lesson.studentId,
        kind: 'srs_due',
        scheduledAt: addDays(now, d),
        channel: 'email',
      })),
    });

    return {
      ok: true as const,
      vocabCreated: input.expressions.length,
      srsScheduled: SRS_CHECKPOINTS_DAYS.map((d) => addDays(now, d).toISOString().slice(0, 10)),
      externalApiCalls: 0 as const,
    };
  });
}

/** 직전 리포트 — 다음 수업의 복습 슬라이드 원천 (02번 C-05). */
export async function lastReport(studentId: bigint) {
  const lesson = await db().lesson.findFirst({
    where: { studentId, reportSubmittedAt: { not: null } },
    orderBy: { startedAt: 'desc' },
    select: { id: true, startedAt: true, reportItems: { orderBy: { ord: 'asc' } } },
  });
  if (!lesson) return null;

  return {
    date: lesson.startedAt.toISOString().slice(0, 10),
    expressions: lesson.reportItems.filter((i) => i.kind === 'expression').map((i) => i.body),
    errors: lesson.reportItems.filter((i) => i.kind === 'error').map((i) => i.body),
  };
}
