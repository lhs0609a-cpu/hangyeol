import {
  cycleEnd,
  isWithin,
  type CycleStatus,
  type Krw,
  type RateTier,
  type StudentStatus,
} from '@hangyeol/shared';
import { quoteCyclePrice } from './pricing.js';

/**
 * 주기(cycle) 생명주기 — 05번 문서 §3.
 * 전부 순수 함수다. DB 도 시계도 건드리지 않는다.
 */

export interface BillingCycle {
  studentId: number;
  teacherId: number;
  cycleNo: number;
  periodStart: Date;
  periodEnd: Date;
  tier: RateTier;
  baseAmount: Krw;
  discountPct: number;
  amount: Krw;
  lessonCount: number;
  activityCount: number;
  status: CycleStatus;
  closedAt: Date | null;
}

/** 첫 과금 지점. 등록도 1차시도 무료, 2차시 진입에서 주기가 열린다. */
export const FIRST_BILLABLE_LESSON_NO = 2;

/** 학습노트 적응 유예: 3차시까지는 학생활동 없이도 활성으로 인정한다. */
export const ACTIVITY_GRACE_LESSON_NO = 3;

export interface OpenCycleInput {
  studentId: number;
  teacherId: number;
  /** 직전 주기 번호. 첫 주기면 0. completed 후 재등록이면 기존 최대값을 그대로 넘긴다. */
  previousCycleNo: number;
  /**
   * 주기 시작 시각.
   * · 2차시 진입 / dormant 재개 → 그 수업 시각
   * · 활성 주기의 연속 개시  → 직전 주기의 periodEnd  (now() 금지)
   */
  periodStart: Date;
  /** 개시 시점 강사 티어. 이 값이 주기에 고정된다. */
  tier: RateTier;
  /** 개시 시점 강사의 active 학생 수. 할인율 판정용. */
  activeStudentCount: number;
}

export function openCycle(input: OpenCycleInput): BillingCycle {
  const quote = quoteCyclePrice(input.tier, input.activeStudentCount);
  return {
    studentId: input.studentId,
    teacherId: input.teacherId,
    cycleNo: input.previousCycleNo + 1,
    periodStart: input.periodStart,
    periodEnd: cycleEnd(input.periodStart),
    tier: quote.tier,
    baseAmount: quote.baseAmount,
    discountPct: quote.discountPct,
    amount: quote.amount,
    lessonCount: 0,
    activityCount: 0,
    status: 'open',
    closedAt: null,
  };
}

/**
 * 수업 시작 시 주기를 열어야 하는가.
 * 05번 문서 §3.1 — 2차시 진입 순간, 또는 dormant 학생의 수업 재개.
 */
export function shouldOpenCycleOnLesson(params: {
  studentStatus: StudentStatus;
  /** 이번 수업을 포함한 차시 번호. 즉 lesson 생성 후의 current_lesson_no. */
  lessonNo: number;
  hasOpenCycle: boolean;
}): boolean {
  if (params.hasOpenCycle) return false;
  if (params.studentStatus === 'dormant') return true;
  return params.lessonNo >= FIRST_BILLABLE_LESSON_NO;
}

export interface ActivityJudgementInput {
  /** 주기 구간 [periodStart, periodEnd) 안의 lessons 수. */
  lessonCount: number;
  /** 같은 구간 안의 student_activity 수. */
  activityCount: number;
  /** 판정 시점 학생의 current_lesson_no. */
  currentLessonNo: number;
}

/**
 * 활성 판정 — 05번 문서 §3.2.
 *   활성 = (A) 수업 ≥ 1  AND  (B) 학생활동 ≥ 1
 *   단, current_lesson_no ≤ 3 인 동안은 (A) 만으로 인정.
 */
export function isCycleActive(input: ActivityJudgementInput): boolean {
  const hasLesson = input.lessonCount >= 1;
  if (!hasLesson) return false;
  if (input.currentLessonNo <= ACTIVITY_GRACE_LESSON_NO) return true;
  return input.activityCount >= 1;
}

export interface CloseCycleContext {
  /** 배치 실행 시각. closedAt 에만 쓰이고, 판정에는 절대 쓰이지 않는다. */
  now: Date;
  counts: { lessonCount: number; activityCount: number };
  currentLessonNo: number;
  /** 다음 주기 개시에 쓸 값 — 개시 시점 기준이므로 종료 시점의 현재값을 넘긴다. */
  teacherTier: RateTier;
  activeStudentCount: number;
}

export interface CloseCycleResult {
  closed: BillingCycle;
  studentStatus: Extract<StudentStatus, 'active' | 'dormant'>;
  /** 활성이면 직전 periodEnd 에 이어서 새 주기를 연다. 휴면이면 null. */
  nextCycle: BillingCycle | null;
  /** 휴면 전환 시 강사에게 보낼 알림 여부. */
  notifyDormant: boolean;
}

/**
 * 주기 종료 처리 — 05번 문서 §3.3.
 *
 * 멱등: 이미 닫힌 주기를 다시 넣으면 그대로 되돌려준다(재실행 안전).
 * 소급: 판정은 periodEnd 기준이고 now 에 의존하지 않는다 → 배치가 늦어도 결과가 같다.
 */
export function closeCycle(cycle: BillingCycle, ctx: CloseCycleContext): CloseCycleResult {
  if (cycle.status !== 'open' || cycle.closedAt !== null) {
    return { closed: cycle, studentStatus: 'active', nextCycle: null, notifyDormant: false };
  }

  const active = isCycleActive({
    lessonCount: ctx.counts.lessonCount,
    activityCount: ctx.counts.activityCount,
    currentLessonNo: ctx.currentLessonNo,
  });

  const closed: BillingCycle = {
    ...cycle,
    lessonCount: ctx.counts.lessonCount,
    activityCount: ctx.counts.activityCount,
    closedAt: ctx.now,
    status: active ? 'billable' : 'waived_dormant',
    amount: active ? cycle.amount : 0,
  };

  if (!active) {
    return { closed, studentStatus: 'dormant', nextCycle: null, notifyDormant: true };
  }

  const nextCycle = openCycle({
    studentId: cycle.studentId,
    teacherId: cycle.teacherId,
    previousCycleNo: cycle.cycleNo,
    // 연속성이 핵심. now() 를 쓰면 배치 지연만큼 주기가 밀려 연간 청구 횟수가 줄어든다.
    periodStart: cycle.periodEnd,
    tier: ctx.teacherTier,
    activeStudentCount: ctx.activeStudentCount,
  });

  return { closed, studentStatus: 'active', nextCycle, notifyDormant: false };
}

export interface PeriodCounts {
  lessonCount: number;
  activityCount: number;
  currentLessonNo: number;
}

/**
 * 배치가 지연되어 주기가 2개 이상 밀렸을 때를 위한 연쇄 종료.
 * periodEnd <= now 인 동안 계속 닫는다. TC-14.
 */
export function closeCycleChain(
  cycle: BillingCycle,
  ctx: Omit<CloseCycleContext, 'counts' | 'currentLessonNo'>,
  countsFor: (periodStart: Date, periodEnd: Date) => PeriodCounts,
): { closed: BillingCycle[]; openCycle: BillingCycle | null; studentStatus: 'active' | 'dormant' } {
  const closed: BillingCycle[] = [];
  let current: BillingCycle | null = cycle;
  let studentStatus: 'active' | 'dormant' = 'active';

  while (current && current.status === 'open' && current.periodEnd.getTime() <= ctx.now.getTime()) {
    const counts = countsFor(current.periodStart, current.periodEnd);
    const result: CloseCycleResult = closeCycle(current, {
      now: ctx.now,
      counts: { lessonCount: counts.lessonCount, activityCount: counts.activityCount },
      currentLessonNo: counts.currentLessonNo,
      teacherTier: ctx.teacherTier,
      activeStudentCount: ctx.activeStudentCount,
    });
    closed.push(result.closed);
    studentStatus = result.studentStatus;
    current = result.nextCycle;
  }

  return { closed, openCycle: current, studentStatus };
}

/** 어떤 수업/활동이 이 주기에 속하는가. 경계는 [start, end). */
export function belongsToCycle(cycle: BillingCycle, at: Date): boolean {
  return isWithin(at, cycle.periodStart, cycle.periodEnd);
}
