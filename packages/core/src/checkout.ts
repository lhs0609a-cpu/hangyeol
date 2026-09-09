import { randomUUID } from 'node:crypto';
import { bonusPctFor } from '@hangyeol/billing';
import { db } from './guard.js';
import { apiError } from './errors.js';
import { assertPaymentMatches, billingConfiguration, paymentConfiguration, tossRequest, type VerifiedPayment } from './payment-provider.js';
import { handlePgWebhook } from './payments.js';
import { reconcileTuition } from './tuition.js';

export async function createTopupOrder(teacherId: bigint, amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 10_000 || amount > 5_000_000) throw apiError('VALIDATION_FAILED', '충전 금액은 1만~500만원의 정수로 입력하세요');
  return db().paymentOrder.create({ data: { teacherId, kind: 'topup', name: '수업 도구 크레딧', amount } });
}
export async function invoiceOrder(teacherId: bigint, invoiceId: bigint) {
  const invoice = await db().invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.teacherId !== teacherId) throw apiError('NOT_FOUND');
  if (['paid', 'void'].includes(invoice.status) || invoice.chargeAmount <= 0) throw apiError('VALIDATION_FAILED', '결제할 청구서가 아닙니다');
  return db().paymentOrder.upsert({ where: { invoiceId }, update: {},
    create: { teacherId, invoiceId, kind: 'invoice', name: '월 이용료', amount: invoice.chargeAmount } });
}
export async function getCheckoutOrder(teacherId: bigint, id: string) {
  const order = await db().paymentOrder.findUnique({ where: { id } });
  if (!order || order.teacherId !== teacherId) throw apiError('NOT_FOUND');
  return order;
}
/** Persist the verified payment first. Fulfillment is independently idempotent after a crash. */
export async function reconcilePayment(payment: VerifiedPayment) {
  const prisma = db();
  const order = await prisma.paymentOrder.findUnique({ where: { id: payment.orderId } });
  if (!order) throw apiError('NOT_FOUND');
  if (order.kind === 'tuition') return reconcileTuition(payment);
  assertPaymentMatches(payment, order);
  if (payment.status !== 'DONE') {
    if (payment.status === 'CANCELED' && order.kind === 'topup' && payment.balanceAmount === 0) {
      await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${order.teacherId} FOR UPDATE`;
        const current = await tx.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
        if (current.status === 'refunded') return;
        const credited = await tx.creditTopup.findUnique({ where: { pgTid: payment.paymentKey } });
        if (current.status !== 'refunding' && credited) await tx.teacher.update({ where: { id: order.teacherId }, data: { creditBalance: { decrement: credited.grantedAmount } } });
        await tx.paymentOrder.update({ where: { id: order.id }, data: { status: 'refunded', refundedAt: new Date(), paymentKey: payment.paymentKey } });
      });
    }
    return { ok: true, status: payment.status };
  }
  const updated = await prisma.paymentOrder.updateMany({
    where: { id: order.id, status: { in: ['pending', 'paid'] }, OR: [{ paymentKey: null }, { paymentKey: payment.paymentKey }] },
    data: { status: 'paid', paymentKey: payment.paymentKey, paidAt: order.paidAt ?? new Date() },
  });
  if (!updated.count) return { ok: true, status: order.status };
  await handlePgWebhook({ pgTid: payment.paymentKey, amount: order.amount, status: 'paid',
    ...(order.kind === 'invoice' ? { kind: 'invoice' as const, invoiceId: String(order.invoiceId) }
      : { kind: 'topup' as const, teacherId: String(order.teacherId) }) });
  return { ok: true, status: 'paid' };
}
export async function confirmCheckout(teacherId: bigint, input: { orderId: string; paymentKey: string; amount: number }) {
  const order = await getCheckoutOrder(teacherId, input.orderId);
  if (input.amount !== order.amount || !Number.isSafeInteger(input.amount)) throw apiError('VALIDATION_FAILED', '결제 금액이 일치하지 않습니다');
  if (!['pending', 'paid'].includes(order.status)) throw apiError('VALIDATION_FAILED', '결제 가능한 주문이 아닙니다');
  let payment: VerifiedPayment;
  try {
    payment = await tossRequest<VerifiedPayment>('payments/confirm', {
      orderId: order.id, paymentKey: input.paymentKey, amount: order.amount,
    }, order.requestKey);
  } catch {
    // Approval may have succeeded even when the network response was lost.
    payment = await tossRequest<VerifiedPayment>(`payments/${encodeURIComponent(input.paymentKey)}`);
  }
  assertPaymentMatches(payment, order);
  if (payment.paymentKey !== input.paymentKey) throw apiError('VALIDATION_FAILED', '결제 식별자가 일치하지 않습니다');
  return reconcilePayment(payment);
}
export async function billingSetup(teacherId: bigint) {
  const mandate = await db().billingMandate.upsert({ where: { teacherId }, update: {}, create: { teacherId } });
  return { customerKey: mandate.customerKey, ...billingConfiguration() };
}
export async function acceptBillingAuth(teacherId: bigint, authKey: string, customerKey: string) {
  const mandate = await db().billingMandate.findUnique({ where: { teacherId } });
  if (!mandate || mandate.customerKey !== customerKey || !authKey || authKey.length > 300) throw apiError('VALIDATION_FAILED', '카드 등록 정보를 확인해 주세요');
  const result = await tossRequest<{ billingKey: string; customerKey: string }>('billing/authorizations/issue', { authKey, customerKey });
  if (result.customerKey !== customerKey || !result.billingKey) throw apiError('VALIDATION_FAILED', '카드 소유자가 일치하지 않습니다');
  await db().billingMandate.update({ where: { teacherId }, data: { billingKey: result.billingKey, acceptedAt: new Date() } });
  return { ok: true };
}
export async function runPaymentCollection() {
  if (!billingConfiguration().enabled) return { skipped: 'payment-not-configured' };
  const invoices = await db().invoice.findMany({ where: { status: { in: ['pending', 'grace'] }, chargeAmount: { gt: 0 }, retryCount: { lt: 3 } }, take: 20, orderBy: { id: 'asc' } });
  let collected = 0;
  for (const invoice of invoices) {
    const mandate = await db().billingMandate.findUnique({ where: { teacherId: invoice.teacherId } });
    if (!mandate?.billingKey || !mandate.acceptedAt) continue;
    const order = await invoiceOrder(invoice.teacherId, invoice.id);
    try {
      const payment = await tossRequest<VerifiedPayment>(`billing/${encodeURIComponent(mandate.billingKey)}`, {
        customerKey: mandate.customerKey, amount: order.amount, orderId: order.id, orderName: order.name,
      }, order.requestKey);
      await reconcilePayment(payment); collected++;
    } catch {
      // Keep the same order/idempotency key until the provider's outcome is known.
      try {
        const payment = await tossRequest<VerifiedPayment>(`payments/orders/${encodeURIComponent(order.id)}`, undefined, undefined, true);
        if (payment.status === 'DONE') { await reconcilePayment(payment); collected++; continue; }
        if (payment.status !== 'ABORTED') continue;
        await db().invoice.update({ where: { id: invoice.id }, data: { retryCount: { increment: 1 } } });
        await handlePgWebhook({ invoiceId: String(invoice.id), pgTid: payment.paymentKey || order.id, status: 'failed', amount: order.amount });
        await db().paymentOrder.update({ where: { id: order.id }, data: { requestKey: randomUUID() } });
      } catch { /* Unknown outcome: reconcile on next run; never issue a different order. */ }
    }
  }
  return { collected };
}
/** Refund an unused top-up. Reserve the balance before the external call, retain reservation on an unknown result. */
export async function refundTopup(teacherId: bigint, orderId: string) {
  const prisma = db();
  const order = await getCheckoutOrder(teacherId, orderId);
  if (order.kind !== 'topup' || !order.paymentKey) throw apiError('VALIDATION_FAILED', '충전 결제만 여기서 환불할 수 있습니다');
  const granted = order.amount + Math.floor(order.amount * bonusPctFor(order.amount) / 100);
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${teacherId} FOR UPDATE`;
    const current = await tx.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
    if (['refunding', 'refunded'].includes(current.status)) return;
    if (current.status !== 'paid') throw apiError('VALIDATION_FAILED', '완료된 결제가 아닙니다');
    const credited = await tx.creditTopup.findUnique({ where: { pgTid: order.paymentKey! } });
    if (!credited) throw apiError('VALIDATION_FAILED', '충전 반영을 확인 중입니다. 잠시 후 다시 시도해 주세요.');
    const reserved = await tx.teacher.updateMany({ where: { id: teacherId, creditBalance: { gte: granted } }, data: { creditBalance: { decrement: granted } } });
    if (!reserved.count) throw apiError('VALIDATION_FAILED', '사용한 크레딧이 있어 자동 전액 환불이 어렵습니다. 관리자에게 문의해 주세요.');
    await tx.paymentOrder.update({ where: { id: orderId }, data: { status: 'refunding', refundReason: '미사용 충전 전액 환불' } });
  });
  if (order.status === 'refunded') return { ok: true, status: 'refunded' };
  let payment = await tossRequest<VerifiedPayment>(`payments/${encodeURIComponent(order.paymentKey)}`);
  assertPaymentMatches(payment, order);
  if (payment.status !== 'CANCELED') payment = await tossRequest<VerifiedPayment>(`payments/${encodeURIComponent(order.paymentKey)}/cancel`, { cancelReason: '미사용 충전 전액 환불' }, order.refundKey);
  assertPaymentMatches(payment, order);
  if (payment.status !== 'CANCELED' || payment.balanceAmount !== 0) throw apiError('VALIDATION_FAILED', '환불 확인 중입니다. 같은 주문에서 다시 확인해 주세요.');
  await prisma.paymentOrder.update({ where: { id: orderId }, data: { status: 'refunded', refundedAt: new Date() } });
  return { ok: true, status: 'refunded' };
}
