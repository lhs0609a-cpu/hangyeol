import { handle, apiError, tossRequest, reconcilePayment, type VerifiedPayment, enforce, clientIp } from '@hangyeol/core';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export function POST(req: Request) { return handle(async () => {
  enforce('assetSign', `pg:${clientIp(req)}`);
  const body = await req.json();
  const key = body?.data?.paymentKey;
  if (typeof key !== 'string' || !key || key.length > 300) throw apiError('VALIDATION_FAILED');
  // Webhook status and amount are untrusted. Query the authenticated provider API.
  let payment: VerifiedPayment;
  try { payment = await tossRequest<VerifiedPayment>(`payments/${encodeURIComponent(key)}`); }
  catch { payment = await tossRequest<VerifiedPayment>(`payments/${encodeURIComponent(key)}`, undefined, undefined, true); }
  return reconcilePayment(payment);
}); }
