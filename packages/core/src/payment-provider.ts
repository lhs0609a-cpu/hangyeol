import { apiError } from './errors.js';

export interface VerifiedPayment {
  paymentKey: string; orderId: string; status: string; totalAmount: number;
  currency: string; balanceAmount: number;
}
export function paymentConfiguration() {
  const secret = process.env.TOSS_SECRET_KEY ?? '';
  const clientKey = process.env.TOSS_CLIENT_KEY ?? '';
  const configured = /^(test|live)_(sk|gsk)_/.test(secret) && /^(test|live)_(ck|gck)_/.test(clientKey)
    && secret.split('_')[0] === clientKey.split('_')[0];
  return { enabled: configured && (!secret.startsWith('live_') || process.env.PAYMENTS_LIVE_ENABLED === 'true'),
    testMode: !secret.startsWith('live_'), clientKey };
}
export function billingConfiguration() {
  const secret = process.env.TOSS_BILLING_SECRET_KEY ?? '';
  const clientKey = process.env.TOSS_BILLING_CLIENT_KEY ?? '';
  return { enabled: /^(test|live)_sk_/.test(secret) && /^(test|live)_ck_/.test(clientKey)
    && secret.split('_')[0] === clientKey.split('_')[0]
    && (!secret.startsWith('live_') || process.env.PAYMENTS_LIVE_ENABLED === 'true'),
    testMode: !secret.startsWith('live_'), clientKey };
}
export async function tossRequest<T>(path: string, body?: unknown, idempotencyKey?: string, billingAccount = false): Promise<T> {
  const billing = billingAccount || path.startsWith('billing/');
  if (!(billing ? billingConfiguration() : paymentConfiguration()).enabled) throw apiError('VALIDATION_FAILED', '결제 준비 중입니다. 담당 강사에게 문의해 주세요.');
  const response = await fetch(`https://api.tosspayments.com/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${billing ? process.env.TOSS_BILLING_SECRET_KEY : process.env.TOSS_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(65_000),
  });
  if (!response.ok) {
    // Never log keys, provider bodies, or masked card details.
    throw apiError('VALIDATION_FAILED', '결제 상태를 확인하지 못했습니다. 같은 주문에서 다시 시도해 주세요.');
  }
  return await response.json() as T;
}
export function assertPaymentMatches(payment: VerifiedPayment, order: { id: string; amount: number }) {
  if (payment.orderId !== order.id || payment.totalAmount !== order.amount || payment.currency !== 'KRW'
    || !payment.paymentKey || !['DONE', 'CANCELED', 'PARTIAL_CANCELED'].includes(payment.status)) {
    throw apiError('VALIDATION_FAILED', '주문과 결제 내역이 일치하지 않습니다');
  }
}
