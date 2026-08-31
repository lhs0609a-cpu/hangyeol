import { describe, expect, it } from 'vitest';
import { addDays, applyDiscountPct, assertKrw, cycleEnd } from '@hangyeol/shared';
import {
  belongsToCycle,
  bonusPctFor,
  canViewAssets,
  invoiceCutoff,
  isDuplicateWebhook,
  lockStudent,
  openCycle,
  planCycleClose,
  planInvoiceCreate,
  planLockEnforce,
  planPaymentRetry,
  recordRetryFailure,
  refundableAmount,
  shouldRetry,
  tierFromHourlyRate,
  unlockStudent,
  type BillingCycle,
  type InvoiceState,
} from '@hangyeol/billing';

/*
 * TC-01~14 는 05번 문서가 지정한 시나리오만 덮는다.
 * 이 파일은 그 밑에 깔린 규칙들을 따로 고정한다 — 티어 경계, 잠금 복원,
 * 자료 열람 차단, 배치 계획, 웹훅 멱등.
 * 전부 매출이나 우회 방지에 직결되는데 시나리오 테스트만으로는 안 걸린다.
 */

const T0 = new Date('2026-08-01T00:00:00Z');

const cycle = (over: Partial<BillingCycle> = {}): BillingCycle => ({
  ...openCycle({
    studentId: 1,
    teacherId: 7,
    previousCycleNo: 0,
    periodStart: T0,
    tier: 'B',
    activeStudentCount: 1,
  }),
  ...over,
});

const invoice = (over: Partial<InvoiceState> = {}): InvoiceState => ({
  status: 'pending',
  failedAt: null,
  graceUntil: null,
  retryCount: 0,
  paidAt: null,
  pgTid: null,
  ...over,
});

describe('티어 경계 — 여기가 틀리면 전 강사의 요금이 틀린다', () => {
  it.each([
    [0, 'A'],
    [14.99, 'A'],
    [15, 'B'],
    [24.99, 'B'],
    [25, 'C'],
    [39.99, 'C'],
    [40, 'D'],
    [120, 'D'],
  ])('시급 $%s → 티어 %s', (rate, tier) => {
    expect(tierFromHourlyRate(rate)).toBe(tier);
  });

  it('시급 미입력은 B 로 본다 (03번 문서)', () => {
    expect(tierFromHourlyRate(null)).toBe('B');
    expect(tierFromHourlyRate(undefined)).toBe('B');
    expect(tierFromHourlyRate(Number.NaN)).toBe('B');
  });
});

describe('금액은 정수 KRW 만 허용한다', () => {
  it('소수가 들어오면 터뜨린다', () => {
    expect(() => assertKrw(14900.5)).toThrow(/integer/);
  });

  it('음수도 막는다', () => {
    expect(() => assertKrw(-1)).toThrow(/negative/);
  });

  it('할인은 원 단위 절사다', () => {
    expect(applyDiscountPct(7_900, 20)).toBe(6_320);
    expect(applyDiscountPct(14_900, 20)).toBe(11_920);
    expect(applyDiscountPct(24_900, 20)).toBe(19_920);
    // 39,900 × 0.8 = 31,920 — 나누어떨어지지 않는 경우도 정수로 남아야 한다
    expect(Number.isInteger(applyDiscountPct(39_900, 20))).toBe(true);
  });
});

describe('주기 경계는 [start, end)', () => {
  const c = cycle();

  it('시작 시각의 수업은 이 주기 몫이다', () => {
    expect(belongsToCycle(c, c.periodStart)).toBe(true);
  });

  it('종료 시각의 수업은 다음 주기 몫이다 — 이중 계상 방지', () => {
    expect(belongsToCycle(c, c.periodEnd)).toBe(false);
    expect(belongsToCycle(c, new Date(c.periodEnd.getTime() - 1))).toBe(true);
  });
});

describe('잠금 해제 시 직전 상태로 복원한다', () => {
  it('휴면 학생이 잠금 해제로 활성이 되어버리면 안 된다', () => {
    const locked = lockStudent('dormant');
    expect(locked.status).toBe('locked');
    expect(locked.statusBeforeLock).toBe('dormant');
    expect(unlockStudent(locked.status, locked.statusBeforeLock)).toBe('dormant');
  });

  it('종료 처리된 학생도 되살아나지 않는다', () => {
    const locked = lockStudent('completed');
    expect(unlockStudent(locked.status, locked.statusBeforeLock)).toBe('completed');
  });

  it('이미 잠긴 학생을 또 잠가도 직전 상태를 덮어쓰지 않는다 (배치 재실행 안전)', () => {
    expect(lockStudent('locked').statusBeforeLock).toBeNull();
  });

  it('직전 상태를 잃어버렸으면 active 로 연다', () => {
    expect(unlockStudent('locked', null)).toBe('active');
  });

  it('잠기지 않은 학생은 건드리지 않는다', () => {
    expect(unlockStudent('dormant', 'active')).toBe('dormant');
  });
});

describe('자료 열람 차단 — 09번 문서 U1·U2 우회 차단', () => {
  it('미인증 학생은 4차시부터 막는다', () => {
    expect(canViewAssets({ studentStatus: 'pending', currentLessonNo: 3, teacherLocked: false })).toEqual({
      allowed: true,
      reason: null,
    });
    expect(canViewAssets({ studentStatus: 'pending', currentLessonNo: 4, teacherLocked: false })).toEqual({
      allowed: false,
      reason: 'STUDENT_NOT_VERIFIED',
    });
  });

  it('강사 미납 잠금이 미인증보다 먼저 걸린다', () => {
    expect(canViewAssets({ studentStatus: 'pending', currentLessonNo: 9, teacherLocked: true }).reason).toBe(
      'TEACHER_LOCKED',
    );
  });

  it('인증된 학생은 차시와 무관하게 열린다', () => {
    expect(canViewAssets({ studentStatus: 'active', currentLessonNo: 40, teacherLocked: false }).allowed).toBe(true);
  });
});

describe('결제 재시도 — 유예 안에서만, 3회까지', () => {
  const failedAt = new Date('2026-09-01T00:00:00Z');
  const graced = invoice({ status: 'grace', failedAt, graceUntil: addDays(failedAt, 3) });

  it('유예 중이면 재시도한다', () => {
    expect(shouldRetry(graced, addDays(failedAt, 1))).toBe(true);
  });

  it('유예가 끝나면 재시도하지 않는다 — 잠금 배치가 받는다', () => {
    expect(shouldRetry(graced, addDays(failedAt, 3))).toBe(false);
  });

  it('3회를 채우면 멈춘다', () => {
    let inv = graced;
    for (let i = 0; i < 3; i += 1) inv = recordRetryFailure(inv);
    expect(inv.retryCount).toBe(3);
    expect(shouldRetry(inv, addDays(failedAt, 1))).toBe(false);
  });

  it('이미 결제된 인보이스는 긁지 않는다', () => {
    expect(shouldRetry(invoice({ status: 'paid' }), failedAt)).toBe(false);
  });
});

describe('PG 웹훅 멱등 — 같은 pg_tid 재수신은 무시', () => {
  it('같은 tid 로 이미 결제 완료면 중복이다', () => {
    expect(isDuplicateWebhook(invoice({ status: 'paid', pgTid: 'tid_1' }), 'tid_1')).toBe(true);
  });

  it('다른 tid 는 중복이 아니다', () => {
    expect(isDuplicateWebhook(invoice({ status: 'paid', pgTid: 'tid_1' }), 'tid_2')).toBe(false);
  });

  it('아직 결제 안 된 건은 중복이 아니다', () => {
    expect(isDuplicateWebhook(invoice({ status: 'grace', pgTid: 'tid_1' }), 'tid_1')).toBe(false);
  });
});

describe('크레딧 보너스와 환불', () => {
  it.each([
    [99_999, 0],
    [100_000, 10],
    [299_999, 10],
    [300_000, 15],
    [499_999, 15],
    [500_000, 20],
    [1_000_000, 20],
  ])('%s원 충전 → 보너스 %s%%', (paid, pct) => {
    expect(bonusPctFor(paid)).toBe(pct);
  });

  it('환불은 보너스분을 빼고 원금만 돌려준다', () => {
    // 50만 충전 → 60만 적립. 한 푼도 안 썼으면 원금 50만이 환불 대상.
    expect(refundableAmount({ remainingBalance: 600_000, bonusPct: 20 })).toBe(500_000);
    // 30만 남았으면 그 중 원금 몫만
    expect(refundableAmount({ remainingBalance: 300_000, bonusPct: 20 })).toBe(250_000);
  });

  it('보너스가 없으면 잔액 전부가 원금이다', () => {
    expect(refundableAmount({ remainingBalance: 50_000, bonusPct: 0 })).toBe(50_000);
  });
});

describe('배치 계획 — cycle-close', () => {
  it('만료된 주기만 닫고, 아직 안 끝난 주기는 건드리지 않는다', () => {
    const expired = cycle({ studentId: 1 });
    const running = cycle({ studentId: 2, periodStart: new Date('2026-09-20T00:00:00Z') });
    running.periodEnd = cycleEnd(running.periodStart);

    const plans = planCycleClose({
      now: new Date('2026-09-01T00:00:00Z'),
      openCycles: [expired, running],
      countsFor: () => ({ lessonCount: 2, activityCount: 3, currentLessonNo: 9 }),
      teacherContext: () => ({ tier: 'B', activeStudentCount: 2 }),
    });

    expect(plans).toHaveLength(2);
    expect(plans[0]?.closed).toHaveLength(1);
    expect(plans[0]?.studentStatus).toBe('active');
    // 아직 기간이 남은 주기는 닫히지 않는다
    expect(plans[1]?.closed).toHaveLength(0);
  });

  it('휴면으로 닫히면 알림 플래그가 선다', () => {
    const plans = planCycleClose({
      now: new Date('2026-09-01T00:00:00Z'),
      openCycles: [cycle()],
      countsFor: () => ({ lessonCount: 0, activityCount: 0, currentLessonNo: 9 }),
      teacherContext: () => ({ tier: 'B', activeStudentCount: 1 }),
    });

    expect(plans[0]?.studentStatus).toBe('dormant');
    expect(plans[0]?.notifyDormant).toBe(true);
    expect(plans[0]?.nextOpenCycle).toBeNull();
  });
});

describe('배치 계획 — invoice-create', () => {
  const closedAt = new Date('2026-08-20T00:00:00Z');
  const now = new Date('2026-09-01T00:00:00+09:00');

  it('청구할 게 없는 강사는 인보이스를 만들지 않는다 (05번 §5 SKIP)', () => {
    const plans = planInvoiceCreate({
      now,
      teachers: [
        { teacherId: 7, creditBalance: 0, cycles: [cycle({ status: 'billable', closedAt })] },
        { teacherId: 8, creditBalance: 0, cycles: [cycle({ status: 'waived_dormant', amount: 0, closedAt })] },
        { teacherId: 9, creditBalance: 0, cycles: [] },
      ],
    });

    expect(plans.map((p) => p.teacherId)).toEqual([7]);
  });

  it('경계는 그 달 1일 00:00 KST 다', () => {
    expect(invoiceCutoff(now).toISOString()).toBe('2026-08-31T15:00:00.000Z');
  });
});

describe('배치 계획 — payment-retry · lock-enforce', () => {
  const failedAt = new Date('2026-09-01T00:00:00Z');
  const graced = { ...invoice({ status: 'grace', failedAt, graceUntil: addDays(failedAt, 3) }), id: 1, teacherId: 7 };

  it('재시도 대상만 골라낸다', () => {
    const paid = { ...invoice({ status: 'paid' }), id: 2, teacherId: 8 };
    expect(planPaymentRetry([graced, paid], addDays(failedAt, 1))).toEqual([1]);
  });

  it('유예가 안 끝났으면 아무것도 잠그지 않는다', () => {
    expect(planLockEnforce([graced], addDays(failedAt, 2))).toEqual([]);
  });

  it('유예가 끝난 것만 잠근다', () => {
    const plans = planLockEnforce([graced], addDays(failedAt, 3));
    expect(plans).toHaveLength(1);
    expect(plans[0]?.invoice.status).toBe('locked');
    expect(plans[0]?.lockStudents).toBe(true);
  });

  it('이미 잠긴 건을 다시 돌려도 새로 쓸 게 없다 (멱등)', () => {
    const locked = { ...invoice({ status: 'locked' }), id: 1, teacherId: 7 };
    expect(planLockEnforce([locked], addDays(failedAt, 9))).toEqual([]);
  });
});
