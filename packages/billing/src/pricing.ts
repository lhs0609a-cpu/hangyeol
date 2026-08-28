import { applyDiscountPct, type Krw, type RateTier } from '@hangyeol/shared';

/** 05번 문서 §4 요금표. 이 숫자가 곧 매출이다. */
export const TIER_PRICE: Readonly<Record<RateTier, Krw>> = Object.freeze({
  A: 7_900,
  B: 14_900,
  C: 24_900,
  D: 39_900,
});

/** 시급 미입력 시 기본 티어. */
export const DEFAULT_TIER: RateTier = 'B';

/** 볼륨 할인 기준: 주기 개시 시점 active 학생 수 ≥ 11 → 20% 차감. */
export const VOLUME_DISCOUNT_THRESHOLD = 11;
export const VOLUME_DISCOUNT_PCT = 20;

/**
 * 시급(USD) → 티어.
 * A < 15 ≤ B < 25 ≤ C < 40 ≤ D
 * null/undefined 는 B 로 본다 (03번 문서: "시급 미입력 시 기본 B").
 */
export function tierFromHourlyRate(hourlyRateUsd: number | null | undefined): RateTier {
  if (hourlyRateUsd == null || Number.isNaN(hourlyRateUsd)) return DEFAULT_TIER;
  if (hourlyRateUsd < 15) return 'A';
  if (hourlyRateUsd < 25) return 'B';
  if (hourlyRateUsd < 40) return 'C';
  return 'D';
}

/** 주기 개시 시점의 active 학생 수로 할인율을 정한다. 진행 중 주기에는 소급하지 않는다. */
export function volumeDiscountPct(activeStudentCount: number): number {
  return activeStudentCount >= VOLUME_DISCOUNT_THRESHOLD ? VOLUME_DISCOUNT_PCT : 0;
}

export interface PriceQuote {
  tier: RateTier;
  baseAmount: Krw;
  discountPct: number;
  amount: Krw;
}

/** 주기 개시 시점에 한 번 계산하고, 그 값을 주기에 박아둔다. */
export function quoteCyclePrice(tier: RateTier, activeStudentCount: number): PriceQuote {
  const baseAmount = TIER_PRICE[tier];
  const discountPct = volumeDiscountPct(activeStudentCount);
  return {
    tier,
    baseAmount,
    discountPct,
    amount: applyDiscountPct(baseAmount, discountPct),
  };
}
