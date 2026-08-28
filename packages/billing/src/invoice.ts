import {
  billingMonthKey,
  kstMonthStartUtc,
  sum,
  type InvoiceStatus,
  type Krw,
} from '@hangyeol/shared';
import type { BillingCycle } from './cycle.js';

/**
 * 월 1회 합산 청구 — 05번 문서 §5.
 *
 * 학생 10명이면 주기 시작일이 10개 다 다르다.
 * 그대로 청구하면 카드가 한 달에 10번 찍힌다. 그래서 강사 단위로 합산한다.
 */

export interface InvoiceLine {
  billingCycleId: number | null;
  studentId: number;
  amount: Krw;
}

export interface WaivedLine {
  studentId: number;
  reason: string;
}

export interface Invoice {
  teacherId: number;
  /** 'YYYY-MM-01' (KST 기준). (teacher_id, billing_month) 유니크로 중복 청구를 막는다. */
  billingMonth: string;
  totalAmount: Krw;
  creditApplied: Krw;
  chargeAmount: Krw;
  status: InvoiceStatus;
}

export interface BuildInvoiceInput {
  teacherId: number;
  /** 배치 실행 시각 (매월 1일 KST 00:00). */
  now: Date;
  /** 이 강사의 주기 전부. 필터링은 여기서 한다. */
  cycles: readonly (BillingCycle & { id?: number })[];
  creditBalance: Krw;
}

export interface BuildInvoiceResult {
  invoice: Invoice | null;
  lines: InvoiceLine[];
  /** 청구되지 않은 휴면 학생. 화면에 0원으로 표시해야 분쟁이 안 생긴다. */
  waived: WaivedLine[];
  creditBalanceAfter: Krw;
  /** 청구에 포함된 주기가 옮겨갈 상태. 전액 크레딧 차감이면 곧바로 paid. */
  cycleStatusAfter: 'invoiced' | 'paid';
  invoicedCycleIds: (number | null)[];
}

/**
 * 이번 달 청구 대상 주기.
 * status='billable' 이고, 이번 달 1일 00:00 KST 이전에 닫힌 것만.
 */
export function selectBillableCycles<T extends BillingCycle>(
  cycles: readonly T[],
  now: Date,
): T[] {
  const cutoff = kstMonthStartUtc(now).getTime();
  return cycles.filter(
    (c) => c.status === 'billable' && c.closedAt !== null && c.closedAt.getTime() < cutoff,
  );
}

/** 같은 기간에 휴면 처리된 주기. 청구는 0원이지만 명세서에는 남긴다. */
export function selectWaivedCycles<T extends BillingCycle>(
  cycles: readonly T[],
  now: Date,
): T[] {
  const cutoff = kstMonthStartUtc(now).getTime();
  return cycles.filter(
    (c) => c.status === 'waived_dormant' && c.closedAt !== null && c.closedAt.getTime() < cutoff,
  );
}

export function buildInvoice(input: BuildInvoiceInput): BuildInvoiceResult {
  const billable = selectBillableCycles(input.cycles, input.now);
  const waived = selectWaivedCycles(input.cycles, input.now).map((c) => ({
    studentId: c.studentId,
    reason: '28일간 수업 없음 · 휴면',
  }));

  if (billable.length === 0) {
    return {
      invoice: null,
      lines: [],
      waived,
      creditBalanceAfter: input.creditBalance,
      cycleStatusAfter: 'invoiced',
      invoicedCycleIds: [],
    };
  }

  const lines: InvoiceLine[] = billable.map((c) => ({
    billingCycleId: c.id ?? null,
    studentId: c.studentId,
    amount: c.amount,
  }));

  const totalAmount = sum(lines.map((l) => l.amount));
  const creditApplied = Math.min(input.creditBalance, totalAmount);
  const chargeAmount = totalAmount - creditApplied;
  const fullyCovered = chargeAmount === 0;

  return {
    invoice: {
      teacherId: input.teacherId,
      billingMonth: billingMonthKey(input.now),
      totalAmount,
      creditApplied,
      chargeAmount,
      status: fullyCovered ? 'paid' : 'pending',
    },
    lines,
    waived,
    creditBalanceAfter: input.creditBalance - creditApplied,
    cycleStatusAfter: fullyCovered ? 'paid' : 'invoiced',
    invoicedCycleIds: billable.map((c) => c.id ?? null),
  };
}
