import { kstMonthStartUtc } from '@hangyeol/shared';
import type { BillingCycle } from './cycle.js';
import { closeCycleChain, type PeriodCounts } from './cycle.js';
import { buildInvoice, type BuildInvoiceResult } from './invoice.js';
import { enforceLock, shouldRetry, type InvoiceState } from './payment.js';

/**
 * 배치 작업의 순수 계획 단계 — 10번 문서 §6.
 *
 * 여기서 하는 일은 "무엇을 쓸지" 를 결정하는 것뿐이다.
 * 실제 DB 쓰기는 apps/api 의 워커가 이 결과를 그대로 적용한다.
 * 판정 로직을 DB 코드와 섞지 않아야 배치 지연·재실행 시나리오를 테스트할 수 있다.
 */

// ── cycle-close (매일 KST 03:00) ──────────────────────────────

export interface CycleCloseInput {
  now: Date;
  /** status='open' AND period_end <= now 인 주기들. 학생별로 하나씩. */
  openCycles: readonly BillingCycle[];
  /** 학생별 주기 구간 집계. 배치가 밀렸으면 여러 구간을 물어보게 된다. */
  countsFor: (studentId: number, periodStart: Date, periodEnd: Date) => PeriodCounts;
  /** 다음 주기 개시에 쓸 강사 현재값. */
  teacherContext: (teacherId: number) => { tier: BillingCycle['tier']; activeStudentCount: number };
}

export interface CycleClosePlan {
  studentId: number;
  closed: BillingCycle[];
  nextOpenCycle: BillingCycle | null;
  studentStatus: 'active' | 'dormant';
  notifyDormant: boolean;
}

export function planCycleClose(input: CycleCloseInput): CycleClosePlan[] {
  return input.openCycles.map((cycle) => {
    const ctx = input.teacherContext(cycle.teacherId);
    const { closed, openCycle, studentStatus } = closeCycleChain(
      cycle,
      { now: input.now, teacherTier: ctx.tier, activeStudentCount: ctx.activeStudentCount },
      (start, end) => input.countsFor(cycle.studentId, start, end),
    );

    return {
      studentId: cycle.studentId,
      closed,
      nextOpenCycle: openCycle,
      studentStatus,
      // 마지막 주기가 휴면으로 닫혔을 때만 알린다.
      notifyDormant: studentStatus === 'dormant',
    };
  });
}

// ── invoice-create (매월 1일 KST 00:00) ───────────────────────

export interface InvoiceCreateInput {
  now: Date;
  teachers: readonly {
    teacherId: number;
    creditBalance: number;
    cycles: readonly (BillingCycle & { id?: number })[];
  }[];
}

export interface InvoiceCreatePlan extends BuildInvoiceResult {
  teacherId: number;
}

export function planInvoiceCreate(input: InvoiceCreateInput): InvoiceCreatePlan[] {
  return input.teachers
    .map((t) => ({
      teacherId: t.teacherId,
      ...buildInvoice({
        teacherId: t.teacherId,
        now: input.now,
        cycles: t.cycles,
        creditBalance: t.creditBalance,
      }),
    }))
    // 청구할 게 없는 강사는 인보이스를 만들지 않는다 (05번 문서 §5 "SKIP").
    .filter((plan) => plan.invoice !== null);
}

/** 이번 배치가 커버하는 경계. 로그·감사에 그대로 남긴다. */
export function invoiceCutoff(now: Date): Date {
  return kstMonthStartUtc(now);
}

// ── payment-retry (매일 KST 10:00) ────────────────────────────

export function planPaymentRetry(
  invoices: readonly (InvoiceState & { id: number })[],
  now: Date,
): number[] {
  return invoices.filter((inv) => shouldRetry(inv, now)).map((inv) => inv.id);
}

// ── lock-enforce (매일 KST 04:00) ─────────────────────────────

export interface LockPlan {
  invoiceId: number;
  teacherId: number;
  invoice: InvoiceState;
  lockStudents: boolean;
}

export function planLockEnforce(
  invoices: readonly (InvoiceState & { id: number; teacherId: number })[],
  now: Date,
): LockPlan[] {
  return invoices
    .map((inv) => {
      const result = enforceLock(inv, now);
      return {
        invoiceId: inv.id,
        teacherId: inv.teacherId,
        invoice: result.invoice,
        lockStudents: result.lockStudents,
      };
    })
    // 상태가 실제로 바뀐 것만 쓴다. 재실행해도 같은 결과가 되도록.
    .filter((plan) => plan.lockStudents);
}
