import { adjustedNextUnit, latestAdjustment } from './adaptive-learning.js';
import {
  openCycle,
  shouldOpenCycleOnLesson,
  tierFromHourlyRate,
  type BillingCycle,
} from '@hangyeol/billing';
import { addDays, type RateTier, type StudentStatus } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';
import { linkScheduleToLesson } from './schedule.js';
import { allocationFor } from './strands.js';
import { unitByNo } from '@hangyeol/content';
import { nextUnitNo } from './lesson-progress.js';
import { reserveTuition, completeTuition } from './tuition.js';

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
    // Serialize starts for this student, including retries and separate browser tabs.
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${params.teacherId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM students WHERE id = ${params.studentId} FOR UPDATE`;
    const student = await tx.student.findUnique({
      where: { id: params.studentId },
      select: { id: true, teacherId: true, status: true, currentLessonNo: true, levelCode: true, firstLessonAt: true },
    });
    if (!student || student.teacherId !== params.teacherId) throw apiError('NOT_FOUND');

    const teacher = await tx.teacher.findUnique({
      where: { id: params.teacherId },
      select: { hourlyRateUsd: true, rateTier: true, billingStatus: true },
    });
    if (!teacher) throw apiError('NOT_FOUND');
    if (teacher.billingStatus === 'locked') throw apiError('TEACHER_LOCKED');

    const previous = await tx.lesson.findFirst({
      where: { studentId: student.id }, orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
    if (previous && !previous.reportSubmittedAt) {
      return { lessonId: previous.id, lessonNo: previous.lessonNo, unitId: previous.unitId,
        billing: { cycleOpened: false, amount: null, cycleNo: null } };
    }
    if (student.currentLessonNo === 0 && !await tx.levelTest.findFirst({ where: { studentId: student.id }, select: { id: true } })) {
      throw apiError('VALIDATION_FAILED', '첫 수업 전에 학생 학습 노트의 수준 진단을 완료해 주세요. Complete the placement test before the first lesson.');
    }
    const adjustment = await latestAdjustment(tx, student.id);
    const lessonNo = adjustedNextUnit(nextUnitNo(student.currentLessonNo, previous?.outcome, student.levelCode), previous, adjustment);
    const draft = unitByNo(lessonNo);
    if (!draft) throw apiError('VALIDATION_FAILED', '현재 공개된 과정을 마쳤습니다. 복습할 단원을 교수 플랜에서 확인하세요.');
    const unit = await tx.curriculumUnit.upsert({
      where: { unitNo: lessonNo }, update: {},
      create: { unitNo: lessonNo, levelCode: draft.levelCode, title: draft.title,
        goalStatement: draft.goalStatement, targetForms: draft.targetForms,
        targetVocab: draft.targetVocab, recycleFrom: draft.recycleFrom },
    });
    if (params.unitId && params.unitId !== unit.id) throw apiError('VALIDATION_FAILED', '현재 학습 단원과 일치하지 않습니다');
    const sessionNo = await tx.lesson.count({ where: { studentId: student.id } }) + 1;

    const openCycleRow = await tx.billingCycle.findFirst({
      where: { studentId: student.id, status: 'open' },
      orderBy: { cycleNo: 'desc' },
    });

    const mustOpen = shouldOpenCycleOnLesson({
      studentStatus: student.status as StudentStatus,
      lessonNo: sessionNo,
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
        unitId: unit.id,
        startedAt: now,
        billingCycleId: cycleRowId,
        // 지도안 배분을 지금 박아 둔다. 나중에 지도안이 바뀌어도
        // 이 수업의 Four Strands 집계는 그때의 배분으로 계산돼야 한다.
        planAllocation: allocationFor(lessonNo),
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

    await reserveTuition(tx, student.id, params.teacherId, lesson.id);
    // 예약이 있으면 연결한다. 그래야 오늘 목록에서 사라진다.
    await linkScheduleToLesson({
      teacherId: params.teacherId,
      studentId: student.id,
      lessonId: lesson.id,
      now,
    }, tx);

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
  independentPerformance?: boolean;
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
  if (!['pass', 'repeat'].includes(input.outcome)) throw apiError('VALIDATION_FAILED');
  if (input.expressions.length < 1 || input.expressions.length > MAX_EXPRESSIONS) {
    throw apiError('REPORT_LIMIT', `표현은 1~${MAX_EXPRESSIONS}개여야 합니다`);
  }
  if (input.errors.length > MAX_ERRORS) {
    throw apiError('REPORT_LIMIT', `오답은 최대 ${MAX_ERRORS}개입니다`);
  }

  const prisma = db();
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM lessons WHERE id = ${input.lessonId} FOR UPDATE`;
    const lesson = await tx.lesson.findUnique({
      where: { id: input.lessonId },
      select: { id: true, teacherId: true, studentId: true, lessonNo: true, reportSubmittedAt: true },
    });
    if (!lesson || lesson.teacherId !== input.teacherId) throw apiError('NOT_FOUND');
    if (lesson.reportSubmittedAt) return { ok: true as const, vocabCreated: 0, srsScheduled: [], externalApiCalls: 0 as const };
    await completeTuition(tx, input.teacherId, lesson.id, now);
    const adjustment=await latestAdjustment(tx,lesson.studentId);
    if(input.outcome==='pass' && adjustment?.mode==='supplement' && adjustment.targetUnitNo===lesson.lessonNo && String(lesson.id)!==adjustment.anchorLessonId && input.independentPerformance!==true)throw apiError('VALIDATION_FAILED','보충 학습 후 도움 없이 수행했는지 확인해야 원래 진도로 돌아갑니다.');

    if(input.independentPerformance===true)await tx.studentActivity.create({data:{studentId:lesson.studentId,kind:'learning_performance',meta:{lessonId:String(lesson.id),teacherId:String(input.teacherId),independentPerformance:true,outcome:input.outcome}}});
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
