import { createHmac, timingSafeEqual } from 'node:crypto';
import { applyTopup, enforceLock, onPaymentFailure, type InvoiceState } from '@hangyeol/billing';
import { z } from 'zod';
import { apiError } from './errors.js';
import { db } from './guard.js';

export async function registerBillingKey(_params: { teacherId: bigint; pgBillingKey: string; cardLast4?: string }) {
  throw apiError('VALIDATION_FAILED', '결제 화면에서 본인 인증 후 카드를 등록해 주세요');
}
export async function topupCredits(params: { teacherId: bigint; paidAmount: number; pgTid: string; now?: Date }) {
  if (!Number.isSafeInteger(params.paidAmount) || params.paidAmount < 10_000 || params.paidAmount > 5_000_000) throw apiError('VALIDATION_FAILED', '충전 금액이 올바르지 않습니다');
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${params.teacherId} FOR UPDATE`;
    const teacher = await tx.teacher.findUnique({ where: { id: params.teacherId } });
    if (!teacher) throw apiError('NOT_FOUND');
    const order = await tx.paymentOrder.findUnique({ where: { paymentKey: params.pgTid } });
    if (!order || order.status !== 'paid' || order.teacherId !== params.teacherId || order.amount !== params.paidAmount) throw apiError('VALIDATION_FAILED', '확인된 충전 주문이 없습니다');
    const duplicate = await tx.creditTopup.findUnique({ where: { pgTid: params.pgTid } });
    if (duplicate) {
      if (duplicate.teacherId !== params.teacherId || duplicate.paidAmount !== params.paidAmount) throw apiError('VALIDATION_FAILED', '거래 정보가 일치하지 않습니다');
      return { duplicate: true, grantedAmount: duplicate.grantedAmount, bonusPct: duplicate.bonusPct, balanceAfter: teacher.creditBalance };
    }
    const result = applyTopup({ paidAmount: params.paidAmount, currentBalance: teacher.creditBalance, now: params.now ?? new Date() });
    await tx.creditTopup.create({ data: { teacherId: params.teacherId, paidAmount: result.paidAmount, grantedAmount: result.grantedAmount, bonusPct: result.bonusPct, pgTid: params.pgTid } });
    const updated = await tx.teacher.update({ where: { id: params.teacherId }, data: { creditBalance: { increment: result.grantedAmount } } });
    return { duplicate: false, grantedAmount: result.grantedAmount, bonusPct: result.bonusPct, balanceAfter: updated.creditBalance };
  });
}
export function verifyPgSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PG_WEBHOOK_SECRET;
  if (!secret || !signature) throw apiError('UNAUTHENTICATED');
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw apiError('UNAUTHENTICATED');
}
const payloadSchema = z.object({
  pgTid: z.string().min(1).max(300), invoiceId: z.string().regex(/^\d+$/).optional(),
  teacherId: z.string().regex(/^\d+$/).optional(), status: z.enum(['paid', 'failed']),
  kind: z.enum(['invoice', 'topup']).optional(), amount: z.number().int().nonnegative().optional(),
});
export type PgWebhookPayload = z.infer<typeof payloadSchema>;
export async function handlePgWebhook(input: PgWebhookPayload, now = new Date()) {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) throw apiError('VALIDATION_FAILED', '결제 응답 형식이 올바르지 않습니다');
  const payload = parsed.data;
  if (payload.kind === 'topup') {
    if (!payload.teacherId || !payload.amount) throw apiError('VALIDATION_FAILED', '충전 정보가 없습니다');
    if (payload.status !== 'paid') return { ignored: true };
    const order = await db().paymentOrder.findUnique({ where: { paymentKey: payload.pgTid } });
    if (!order || order.kind !== 'topup' || order.teacherId !== BigInt(payload.teacherId) || order.amount !== payload.amount || order.status !== 'paid') throw apiError('VALIDATION_FAILED', '확인된 충전 주문이 없습니다');
    return topupCredits({ teacherId: BigInt(payload.teacherId), paidAmount: payload.amount, pgTid: payload.pgTid, now });
  }
  if (!payload.invoiceId) throw apiError('VALIDATION_FAILED', '청구서가 없습니다');
  const prisma = db();
  const identity = await prisma.invoice.findUnique({ where: { id: BigInt(payload.invoiceId) } });
  if (!identity) throw apiError('NOT_FOUND');
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${identity.teacherId} FOR UPDATE`;
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: identity.id } });
    if (payload.status === 'paid' && payload.amount !== invoice.chargeAmount) throw apiError('VALIDATION_FAILED', '청구 금액과 승인 금액이 일치하지 않습니다');
    if (['paid', 'void'].includes(invoice.status)) return { ignored: true, reason: 'terminal-state' };
    if (payload.status === 'paid') {
      const reused = await tx.invoice.findFirst({ where: { pgTid: payload.pgTid, id: { not: invoice.id } } });
      if (reused) throw apiError('VALIDATION_FAILED', '이미 사용한 결제 거래입니다');
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: 'paid', paidAt: now, pgTid: payload.pgTid } });
      const lines = await tx.invoiceLine.findMany({ where: { invoiceId: invoice.id } });
      await tx.billingCycle.updateMany({ where: { id: { in: lines.map(l => l.billingCycleId) } }, data: { status: 'paid' } });
      const remaining = await tx.invoice.findMany({ where: { teacherId: invoice.teacherId, status: { in: ['failed', 'grace', 'locked'] } } });
      const locked = remaining.some(i => i.status === 'locked');
      await tx.teacher.update({ where: { id: invoice.teacherId }, data: { billingStatus: locked ? 'locked' : remaining.length ? 'failed' : 'ok' } });
      if (!locked) await tx.$executeRaw`UPDATE students SET status = COALESCE(status_before_lock, 'active'), status_before_lock = NULL WHERE teacher_id = ${invoice.teacherId} AND status = 'locked'`;
      return { ok: true, status: 'paid' };
    }
    if (invoice.status === 'locked') return { ignored: true, reason: 'already-locked' };
    const result = onPaymentFailure({ ...invoice, status: invoice.status as InvoiceState['status'] }, now);
    await tx.invoice.update({ where: { id: invoice.id }, data: { status: 'grace', failedAt: result.invoice.failedAt, graceUntil: result.invoice.graceUntil } });
    await tx.teacher.updateMany({ where: { id: invoice.teacherId, billingStatus: { not: 'locked' } }, data: { billingStatus: 'failed' } });
    if (!invoice.failedAt) await tx.notification.create({ data: { targetType: 'teacher', targetId: invoice.teacherId, kind: 'payment_failed', channel: 'email', scheduledAt: now, payload: { invoiceId: String(invoice.id) } } });
    return { ok: true, status: 'grace' };
  });
}
export { enforceLock };
