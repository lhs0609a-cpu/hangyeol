import { describe, expect, it } from 'vitest';
import { addDays, CYCLE_MS, MS_PER_DAY } from '@hangyeol/shared';
import {
  applyTopup,
  buildInvoice,
  closeCycle,
  closeCycleChain,
  enforceLock,
  isCycleActive,
  onPaymentFailure,
  onPaymentSuccess,
  openCycle,
  resolveEnrollment,
  shouldOpenCycleOnLesson,
  studentNoteAccess,
  TIER_PRICE,
  type BillingCycle,
  type InvoiceState,
} from '@hangyeol/billing';

const T0 = new Date('2026-08-01T00:00:00Z');

function makeCycle(over: Partial<BillingCycle> = {}): BillingCycle {
  return {
    ...openCycle({
      studentId: 1042,
      teacherId: 7,
      previousCycleNo: 0,
      periodStart: T0,
      tier: 'B',
      activeStudentCount: 4,
    }),
    ...over,
  };
}

const freshInvoice = (): InvoiceState => ({
  status: 'pending',
  failedAt: null,
  graceUntil: null,
  retryCount: 0,
  paidAt: null,
  pgTid: null,
});

describe('TC-01 등록 → 1차시 → 청구 0원', () => {
  it('등록 시점에 과금하지 않는다', () => {
    const decision = resolveEnrollment(null);
    expect(decision.chargedNow).toBe(0);
    expect(decision.firstChargeAtLessonNo).toBe(2);
  });

  it('1차시에는 주기가 열리지 않는다', () => {
    expect(
      shouldOpenCycleOnLesson({ studentStatus: 'pending', lessonNo: 1, hasOpenCycle: false }),
    ).toBe(false);
  });
});

describe('TC-02 2차시 진입 → cycle#1 open, amount = tier 요금', () => {
  it('2차시에서 주기가 열린다', () => {
    expect(
      shouldOpenCycleOnLesson({ studentStatus: 'pending', lessonNo: 2, hasOpenCycle: false }),
    ).toBe(true);
  });

  it('cycle_no=1, 28일, 개시 시점 티어 요금이 고정된다', () => {
    const cycle = makeCycle();
    expect(cycle.cycleNo).toBe(1);
    expect(cycle.status).toBe('open');
    expect(cycle.tier).toBe('B');
    expect(cycle.baseAmount).toBe(TIER_PRICE.B);
    expect(cycle.amount).toBe(14_900);
    expect(cycle.periodEnd.getTime() - cycle.periodStart.getTime()).toBe(CYCLE_MS);
  });

  it('주기가 이미 열려 있으면 중복 개시하지 않는다', () => {
    expect(
      shouldOpenCycleOnLesson({ studentStatus: 'active', lessonNo: 5, hasOpenCycle: true }),
    ).toBe(false);
  });
});

describe('TC-03 수업 3회 + 학생활동 2회 → billable', () => {
  it('활성으로 판정하고 다음 주기를 이어서 연다', () => {
    const cycle = makeCycle();
    const result = closeCycle(cycle, {
      now: cycle.periodEnd,
      counts: { lessonCount: 3, activityCount: 2 },
      currentLessonNo: 8,
      teacherTier: 'B',
      activeStudentCount: 4,
    });

    expect(result.closed.status).toBe('billable');
    expect(result.closed.amount).toBe(14_900);
    expect(result.studentStatus).toBe('active');
    expect(result.nextCycle?.cycleNo).toBe(2);
    expect(result.nextCycle?.periodStart.getTime()).toBe(cycle.periodEnd.getTime());
  });
});

describe('TC-04 수업 3회 + 학생활동 0회 (4차시 이상) → waived_dormant', () => {
  it('학생활동이 없으면 청구하지 않는다', () => {
    const cycle = makeCycle();
    const result = closeCycle(cycle, {
      now: cycle.periodEnd,
      counts: { lessonCount: 3, activityCount: 0 },
      currentLessonNo: 8,
      teacherTier: 'B',
      activeStudentCount: 4,
    });

    expect(result.closed.status).toBe('waived_dormant');
    expect(result.closed.amount).toBe(0);
    expect(result.nextCycle).toBeNull();
  });

  it('3차시까지는 학생활동 없이도 활성으로 인정한다 (유예)', () => {
    expect(isCycleActive({ lessonCount: 2, activityCount: 0, currentLessonNo: 3 })).toBe(true);
    expect(isCycleActive({ lessonCount: 2, activityCount: 0, currentLessonNo: 4 })).toBe(false);
  });
});

describe('TC-05 수업 0회 → waived_dormant, dormant, 새 주기 미생성', () => {
  it('휴면 처리하고 주기를 잇지 않는다', () => {
    const cycle = makeCycle();
    const result = closeCycle(cycle, {
      now: cycle.periodEnd,
      counts: { lessonCount: 0, activityCount: 5 },
      currentLessonNo: 6,
      teacherTier: 'B',
      activeStudentCount: 4,
    });

    expect(result.closed.status).toBe('waived_dormant');
    expect(result.closed.amount).toBe(0);
    expect(result.studentStatus).toBe('dormant');
    expect(result.nextCycle).toBeNull();
    expect(result.notifyDormant).toBe(true);
  });
});

describe('TC-06 dormant 학생 수업 재개 → 즉시 새 주기 개시', () => {
  it('차시 번호와 무관하게 재개 시각부터 주기를 연다', () => {
    expect(
      shouldOpenCycleOnLesson({ studentStatus: 'dormant', lessonNo: 9, hasOpenCycle: false }),
    ).toBe(true);

    const resumeAt = new Date('2026-10-05T02:00:00Z');
    const next = openCycle({
      studentId: 1042,
      teacherId: 7,
      previousCycleNo: 3,
      periodStart: resumeAt,
      tier: 'B',
      activeStudentCount: 4,
    });

    expect(next.cycleNo).toBe(4);
    expect(next.periodStart).toEqual(resumeAt);
    expect(next.amount).toBe(14_900);
  });
});

describe('TC-07 학생 4명 서로 다른 주기 → invoice 1건, line 4행', () => {
  it('강사 단위로 합산해 카드 1회로 만든다', () => {
    const closedAt = new Date('2026-08-20T00:00:00Z');
    const cycles: (BillingCycle & { id: number })[] = [1042, 1043, 1045, 1046].map((sid, i) => ({
      ...makeCycle({
        studentId: sid,
        periodStart: addDays(T0, i * 3),
        status: 'billable',
        closedAt,
      }),
      id: 100 + i,
    }));

    const result = buildInvoice({
      teacherId: 7,
      now: new Date('2026-09-01T00:00:00+09:00'),
      cycles,
      creditBalance: 0,
    });

    expect(result.invoice).not.toBeNull();
    expect(result.invoice?.billingMonth).toBe('2026-09-01');
    expect(result.lines).toHaveLength(4);
    expect(result.invoice?.totalAmount).toBe(14_900 * 4);
    expect(result.invoice?.chargeAmount).toBe(14_900 * 4);
    expect(result.invoice?.status).toBe('pending');
    expect(result.cycleStatusAfter).toBe('invoiced');
  });

  it('아직 이번 달에 닫히지 않은 주기는 다음 달로 넘긴다', () => {
    const cycles = [makeCycle({ status: 'billable', closedAt: new Date('2026-09-03T00:00:00Z') })];
    const result = buildInvoice({
      teacherId: 7,
      now: new Date('2026-09-01T00:00:00+09:00'),
      cycles,
      creditBalance: 0,
    });
    expect(result.invoice).toBeNull();
  });
});

describe('TC-08 휴면 1명 포함 → 총액 미포함, 화면에는 0원 표시', () => {
  it('waived 는 라인이 아니라 별도 목록으로 나간다', () => {
    const closedAt = new Date('2026-08-20T00:00:00Z');
    const cycles = [
      makeCycle({ studentId: 1042, status: 'billable', closedAt }),
      makeCycle({ studentId: 1044, status: 'waived_dormant', amount: 0, closedAt }),
    ];

    const result = buildInvoice({
      teacherId: 7,
      now: new Date('2026-09-01T00:00:00+09:00'),
      cycles,
      creditBalance: 0,
    });

    expect(result.lines).toHaveLength(1);
    expect(result.invoice?.totalAmount).toBe(14_900);
    expect(result.waived).toEqual([{ studentId: 1044, reason: '28일간 수업 없음 · 휴면' }]);
  });
});

describe('TC-09 결제 실패 → 3일간 잠금 없음, 3일 후 전체 학생 locked', () => {
  const failedAt = new Date('2026-09-01T00:10:00Z');

  it('D+0 에는 아무것도 잠그지 않는다', () => {
    const r = onPaymentFailure(freshInvoice(), failedAt);
    expect(r.invoice.status).toBe('grace');
    expect(r.lockStudents).toBe(false);
    expect(r.invoice.graceUntil?.getTime()).toBe(failedAt.getTime() + 3 * MS_PER_DAY);
    expect(r.teacherBillingStatus).toBe('failed');
  });

  it('D+2 까지는 유예가 유지된다', () => {
    const graced = onPaymentFailure(freshInvoice(), failedAt).invoice;
    const r = enforceLock(graced, addDays(failedAt, 2));
    expect(r.invoice.status).toBe('grace');
    expect(r.lockStudents).toBe(false);
  });

  it('D+3 에 잠근다', () => {
    const graced = onPaymentFailure(freshInvoice(), failedAt).invoice;
    const r = enforceLock(graced, addDays(failedAt, 3));
    expect(r.invoice.status).toBe('locked');
    expect(r.teacherBillingStatus).toBe('locked');
    expect(r.lockStudents).toBe(true);
  });

  it('결제 성공하면 잠금이 풀린다', () => {
    const locked: InvoiceState = { ...freshInvoice(), status: 'locked' };
    const r = onPaymentSuccess(locked, addDays(failedAt, 5), 'pg_tid_1');
    expect(r.invoice.status).toBe('paid');
    expect(r.teacherBillingStatus).toBe('ok');
    expect(r.unlockStudents).toBe(true);
    expect(r.cycleStatusAfter).toBe('paid');
  });
});

describe('TC-10 잠금 상태에서 학생 학습노트 → SRS·HVPT 정상 동작', () => {
  it('학생은 잘못이 없다. 새 차시 자료만 막는다', () => {
    const access = studentNoteAccess('locked');
    expect(access.srs).toBe(true);
    expect(access.hvpt).toBe(true);
    expect(access.listening).toBe(true);
    expect(access.newLessonAssets).toBe(false);
  });
});

describe('TC-11 크레딧 50만 충전 후 invoice 30만 → 카드 결제 0원', () => {
  it('보너스 20% 가 붙고, 청구는 크레딧으로 전액 차감된다', () => {
    const topup = applyTopup({ paidAmount: 500_000, currentBalance: 0, now: T0 });
    expect(topup.bonusPct).toBe(20);
    expect(topup.grantedAmount).toBe(600_000);

    const closedAt = new Date('2026-08-20T00:00:00Z');
    const cycles = Array.from({ length: 20 }, (_, i) =>
      makeCycle({ studentId: 2000 + i, status: 'billable', amount: 15_000, closedAt }),
    );

    const result = buildInvoice({
      teacherId: 7,
      now: new Date('2026-09-01T00:00:00+09:00'),
      cycles,
      creditBalance: topup.balanceAfter,
    });

    expect(result.invoice?.totalAmount).toBe(300_000);
    expect(result.invoice?.creditApplied).toBe(300_000);
    expect(result.invoice?.chargeAmount).toBe(0);
    expect(result.invoice?.status).toBe('paid');
    expect(result.cycleStatusAfter).toBe('paid');
    expect(result.creditBalanceAfter).toBe(300_000);
  });
});

describe('TC-12 completed 학생 동일 이메일 재등록 → 신규 과금 없음', () => {
  it('기존 레코드를 재활성하고 cycle_no 를 이어간다', () => {
    const decision = resolveEnrollment({
      id: 1042,
      status: 'completed',
      maxCycleNo: 5,
      currentLessonNo: 30,
    });

    expect(decision.action).toBe('reactivate');
    expect(decision.duplicate).toBe(true);
    expect(decision.studentId).toBe(1042);
    expect(decision.chargedNow).toBe(0);
    expect(decision.previousCycleNo).toBe(5);

    const next = openCycle({
      studentId: 1042,
      teacherId: 7,
      previousCycleNo: decision.previousCycleNo,
      periodStart: new Date('2026-11-01T00:00:00Z'),
      tier: 'B',
      activeStudentCount: 4,
    });
    expect(next.cycleNo).toBe(6);
  });
});

describe('TC-13 active 11명 돌파 → 다음 개시 주기부터 20% 할인', () => {
  it('진행 중 주기의 할인율은 바뀌지 않는다', () => {
    const cycle = makeCycle({ discountPct: 0, amount: 14_900 });
    const result = closeCycle(cycle, {
      now: cycle.periodEnd,
      counts: { lessonCount: 4, activityCount: 9 },
      currentLessonNo: 12,
      teacherTier: 'B',
      activeStudentCount: 11,
    });

    expect(result.closed.discountPct).toBe(0);
    expect(result.closed.amount).toBe(14_900);
    expect(result.nextCycle?.discountPct).toBe(20);
    expect(result.nextCycle?.amount).toBe(11_920);
  });

  it('10명까지는 할인이 없다', () => {
    const c = openCycle({
      studentId: 1,
      teacherId: 7,
      previousCycleNo: 0,
      periodStart: T0,
      tier: 'B',
      activeStudentCount: 10,
    });
    expect(c.discountPct).toBe(0);
    expect(c.amount).toBe(14_900);
  });
});

describe('TC-14 배치 2일 지연 → period_start 연속성 유지, 주기 밀림 없음', () => {
  it('밀린 주기를 소급해 닫고, 시작점은 직전 periodEnd 에 붙는다', () => {
    const cycle = makeCycle();
    // 주기가 2개 지나도록 배치를 굶긴다. cycle#1, #2 가 만료된 상태.
    const now = new Date(cycle.periodEnd.getTime() + CYCLE_MS + 2 * MS_PER_DAY);

    const {
      closed,
      openCycle: stillOpen,
      studentStatus,
    } = closeCycleChain(cycle, { now, teacherTier: 'B', activeStudentCount: 4 }, () => ({
      lessonCount: 4,
      activityCount: 6,
      currentLessonNo: 12,
    }));

    expect(closed).toHaveLength(2);
    expect(closed[0]?.cycleNo).toBe(1);
    expect(closed[1]?.cycleNo).toBe(2);
    expect(studentStatus).toBe('active');

    // 연속성: #2 의 시작 = #1 의 종료, #3 의 시작 = #2 의 종료
    expect(closed[1]?.periodStart.getTime()).toBe(closed[0]?.periodEnd.getTime());
    expect(stillOpen?.periodStart.getTime()).toBe(closed[1]?.periodEnd.getTime());

    // 배치가 2일 늦었어도 주기 경계는 T0 + 28n 그대로다.
    expect(stillOpen?.periodStart.getTime()).toBe(T0.getTime() + 2 * CYCLE_MS);
  });

  it('이미 닫힌 주기를 다시 닫아도 결과가 같다 (멱등)', () => {
    const cycle = makeCycle();
    const ctx = {
      now: cycle.periodEnd,
      counts: { lessonCount: 3, activityCount: 2 },
      currentLessonNo: 8,
      teacherTier: 'B' as const,
      activeStudentCount: 4,
    };
    const first = closeCycle(cycle, ctx);
    const second = closeCycle(first.closed, ctx);
    expect(second.closed).toEqual(first.closed);
    expect(second.nextCycle).toBeNull();
  });
});
