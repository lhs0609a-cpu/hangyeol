import { createTopupOrder, invoiceOrder, db, handle, readJson, requireTeacher, paymentConfiguration, billingSetup } from '@hangyeol/core';
export const dynamic = 'force-dynamic';
export function GET(req: Request) { return handle(async () => {
  const { teacherId } = await requireTeacher(req);
  const [orders, invoices, mandate] = await Promise.all([
    db().paymentOrder.findMany({ where: { teacherId }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, name: true, amount: true, status: true, kind: true, createdAt: true } }),
    db().invoice.findMany({ where: { teacherId, status: { in: ['pending', 'grace', 'locked'] } }, select: { id: true, chargeAmount: true, billingMonth: true } }),
    db().billingMandate.findUnique({ where: { teacherId }, select: { acceptedAt: true } }),
  ]);
  return { orders, invoices, cardRegistered: Boolean(mandate?.acceptedAt), ...paymentConfiguration() };
}); }
export function POST(req: Request) { return handle(async () => {
  const { teacherId } = await requireTeacher(req);
  const body = await readJson<{ kind: string; amount?: number; invoiceId?: string }>(req);
  if (body.kind === 'card') return billingSetup(teacherId);
  const order = body.kind === 'invoice' && /^\d+$/.test(body.invoiceId ?? '')
    ? await invoiceOrder(teacherId, BigInt(body.invoiceId!)) : await createTopupOrder(teacherId, Number(body.amount));
  return { orderId: order.id };
}); }
