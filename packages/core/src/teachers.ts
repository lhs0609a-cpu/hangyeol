import { quoteCyclePrice, TIER_PRICE, tierFromHourlyRate } from '@hangyeol/billing';
import type { RateTier } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';

/**
 * 강사 프로필 — 02번 문서 A-02·A-03.
 *
 * 시급은 단순한 프로필 항목이 아니라 요금 티어의 산정 근거다.
 * 그래서 변경 응답에 "언제부터 적용되는지"를 반드시 함께 돌려준다.
 */

export interface RateChangeResult {
  hourlyRateUsd: number | null;
  rateTier: RateTier;
  currentCyclePrice: number | null;
  nextCyclePrice: number;
  note: string;
}

export async function updateTeacherProfile(
  teacherId: bigint,
  patch: { name?: string; timezone?: string; spokenLangs?: string[]; hourlyRateUsd?: number },
): Promise<RateChangeResult> {
  const prisma = db();

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { hourlyRateUsd: true, rateTier: true },
  });
  if (!teacher) throw apiError('NOT_FOUND');

  const rate = patch.hourlyRateUsd ?? (teacher.hourlyRateUsd ? Number(teacher.hourlyRateUsd) : null);
  const nextTier = tierFromHourlyRate(rate);

  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      ...(patch.name === undefined ? {} : { name: patch.name }),
      ...(patch.timezone === undefined ? {} : { timezone: patch.timezone }),
      ...(patch.spokenLangs === undefined ? {} : { spokenLangs: patch.spokenLangs }),
      ...(patch.hourlyRateUsd === undefined ? {} : { hourlyRateUsd: patch.hourlyRateUsd, rateTier: nextTier }),
    },
  });

  // 진행 중 주기는 개시 시점 요금이 박혀 있다. 여기서 건드리면 과금 분쟁이 된다.
  const running = await prisma.billingCycle.findFirst({
    where: { teacherId, status: 'open' },
    orderBy: { periodStart: 'desc' },
    select: { amount: true },
  });

  const activeCount = await prisma.student.count({ where: { teacherId, status: 'active' } });

  return {
    hourlyRateUsd: rate,
    rateTier: nextTier,
    currentCyclePrice: running?.amount ?? null,
    nextCyclePrice: quoteCyclePrice(nextTier, activeCount).amount,
    note: '요금 변경은 다음 28일 주기부터 적용됩니다',
  };
}

/** 04번 문서 G — 티어 표. 화면(T-05)에서 현재 행을 하이라이트하는 데 쓴다. */
export function pricingTable(currentTier: RateTier, activeStudentCount: number) {
  return {
    currentTier,
    volumeDiscountPct: quoteCyclePrice(currentTier, activeStudentCount).discountPct,
    tiers: (Object.keys(TIER_PRICE) as RateTier[]).map((tier) => ({
      tier,
      baseAmount: TIER_PRICE[tier],
      current: tier === currentTier,
    })),
  };
}
