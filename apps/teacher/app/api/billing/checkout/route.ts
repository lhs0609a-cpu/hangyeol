import { acceptBillingAuth, confirmCheckout, getCheckoutOrder, handle, readJson, refundTopup, requireTeacher, paymentConfiguration } from '@hangyeol/core';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export function GET(req: Request) { return handle(async () => {
  const { teacherId } = await requireTeacher(req);
  const order = await getCheckoutOrder(teacherId, new URL(req.url).searchParams.get('id') ?? '');
  return { id: order.id, name: order.name, amount: order.amount, status: order.status, ...paymentConfiguration() };
}); }
export function POST(req: Request) { return handle(async () => {
  const { teacherId } = await requireTeacher(req);
  const body = await readJson<{ action: string; orderId: string; paymentKey: string; amount: number; authKey: string; customerKey: string }>(req);
  if (body.action === 'card') return acceptBillingAuth(teacherId, body.authKey, body.customerKey);
  if (body.action === 'refund') return refundTopup(teacherId, body.orderId);
  return confirmCheckout(teacherId, { orderId: body.orderId, paymentKey: body.paymentKey, amount: body.amount });
}); }
