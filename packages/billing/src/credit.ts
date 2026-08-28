import { assertKrw, addDays, type Krw } from '@hangyeol/shared';

/**
 * 크레딧 선충전 — 05번 문서 §7.
 * 목적은 이자 수익이 아니라 락인이다.
 */

export interface BonusTier {
  minPaid: Krw;
  bonusPct: number;
}

/** 큰 금액부터 검사한다. */
export const CREDIT_BONUS_TIERS: readonly BonusTier[] = Object.freeze([
  { minPaid: 500_000, bonusPct: 20 },
  { minPaid: 300_000, bonusPct: 15 },
  { minPaid: 100_000, bonusPct: 10 },
]);

/** 크레딧 유효기간 24개월. */
export const CREDIT_VALID_DAYS = 730;

export function bonusPctFor(paidAmount: Krw): number {
  assertKrw(paidAmount, 'paidAmount');
  for (const tier of CREDIT_BONUS_TIERS) {
    if (paidAmount >= tier.minPaid) return tier.bonusPct;
  }
  return 0;
}

export interface TopupResult {
  paidAmount: Krw;
  bonusPct: number;
  grantedAmount: Krw;
  balanceAfter: Krw;
  expiresAt: Date;
}

export function applyTopup(params: {
  paidAmount: Krw;
  currentBalance: Krw;
  now: Date;
}): TopupResult {
  const bonusPct = bonusPctFor(params.paidAmount);
  const grantedAmount = params.paidAmount + Math.floor((params.paidAmount * bonusPct) / 100);
  return {
    paidAmount: params.paidAmount,
    bonusPct,
    grantedAmount,
    balanceAfter: params.currentBalance + grantedAmount,
    expiresAt: addDays(params.now, CREDIT_VALID_DAYS),
  };
}

/**
 * 환불 가능액 — 보너스분을 제외한 미사용 원금만.
 * 잔액을 (원금:보너스) 비율로 나눠 원금 몫만 돌려준다.
 */
export function refundableAmount(params: {
  remainingBalance: Krw;
  bonusPct: number;
}): Krw {
  const { remainingBalance, bonusPct } = params;
  assertKrw(remainingBalance, 'remainingBalance');
  return Math.floor((remainingBalance * 100) / (100 + bonusPct));
}
