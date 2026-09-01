import { bonusPctFor } from '@hangyeol/billing';
import { handle, readJson, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/credits/topup — 충전 견적.
 *
 * 실제 적립은 PG 웹훅이 성공을 알려줄 때만 한다.
 * 여기서 바로 적립하면 결제 실패한 충전이 잔액에 남는다.
 */
export function POST(req: Request) {
  return handle(async () => {
    await requireTeacher(req);
    const { amount } = await readJson<{ amount: number }>(req);
    const bonusPct = bonusPctFor(amount);
    return {
      paidAmount: amount,
      bonusPct,
      grantedAmount: amount + Math.floor((amount * bonusPct) / 100),
      note: '결제가 완료되면 적립됩니다',
    };
  });
}
