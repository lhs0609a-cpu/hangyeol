import type { Prisma } from '@hangyeol/db';
import { z } from 'zod';
import { db } from './guard.js';
import { apiError } from './errors.js';
import { encryptEmail, hashEmail } from './crypto.js';
import { assertPaymentMatches, tossRequest, type VerifiedPayment } from './payment-provider.js';
import { tuitionShare } from './tuition-math.js';

export const offerInput = z.object({ teacherId: z.string().regex(/^\d+$/), title: z.string().trim().min(3).max(90), description: z.string().trim().min(20).max(3000), sessions: z.number().int().min(1).max(100), minutes: z.number().int().min(15).max(180), amount: z.number().int().min(1000).max(5000000), feeBps: z.number().int().min(0).max(10000), published: z.boolean() });
export const applicationInput = z.object({ offerId: z.string().uuid(), name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(254), language: z.enum(['en','ja','zh','vi','es','ko']), timezone: z.string().max(80).refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }), goal: z.string().trim().min(5).max(1500), consent: z.literal(true) });
export function parseTuition<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw apiError('VALIDATION_FAILED', 'Please check the form fields.');
  return result.data;
}
export async function saveOffer(value: unknown, actorId: bigint) {
  const input = parseTuition(offerInput, value);
  const teacher = await db().teacher.findUnique({ where: { id: BigInt(input.teacherId) } });
  if (!teacher || teacher.approvalStatus !== 'approved') throw apiError('VALIDATION_FAILED', '승인된 강사를 선택하세요');
  return db().$transaction(async tx => {
    const offer = await tx.courseOffer.create({ data: { ...input, teacherId: teacher.id } });
    await tx.auditLog.create({ data: { actorType: 'admin', actorId, action: 'course.create', meta: { offerId: offer.id } } });
    return offer;
  });
}
export async function applyForCourse(value: unknown) {
  const input = parseTuition(applicationInput, value);
  const offer = await db().courseOffer.findUnique({ where: { id: input.offerId } });
  if (!offer?.published) throw apiError('NOT_FOUND');
  const emailHash = hashEmail(input.email);
  await db().courseApplication.upsert({ where: { offerId_emailHash: { offerId: offer.id, emailHash } }, update: {}, create: {
    offerId: offer.id, name: input.name, emailHash, emailEnc: encryptEmail(input.email), language: input.language, timezone: input.timezone, goal: input.goal,
  } });
  // No account existence, student ID, or authentication link is returned publicly.
  return { ok: true, message: 'Your request has been received. We will email you after reviewing your learning goals and lesson availability.' };
}
export async function decideApplication(id: string, decision: 'approved' | 'rejected', actorId: bigint) {
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM course_applications WHERE id = ${id} FOR UPDATE`;
    const application = await tx.courseApplication.findUnique({ where: { id } });
    if (!application) throw apiError('NOT_FOUND');
    if (application.status !== 'pending') return { status: application.status };
    if (decision === 'rejected') {
      await tx.courseApplication.update({ where: { id }, data: { status: decision } });
    } else {
      const offer = await tx.courseOffer.findUniqueOrThrow({ where: { id: application.offerId } });
      await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${offer.teacherId} FOR UPDATE`;
      const teacher = await tx.teacher.findUniqueOrThrow({ where: { id: offer.teacherId } });
      if (teacher.approvalStatus !== 'approved' || !offer.published) throw apiError('VALIDATION_FAILED', '모집 중인 승인 강사의 과정인지 확인하세요');
      const student = await tx.student.upsert({ where: { teacherId_emailHash: { teacherId: offer.teacherId, emailHash: application.emailHash } }, update: {}, create: {
        teacherId: offer.teacherId, name: application.name, emailHash: application.emailHash, emailEnc: application.emailEnc, l1Code: application.language, platform: 'direct', goalTrack: application.goal,
      } });
      const order = await tx.paymentOrder.create({ data: { teacherId: offer.teacherId, studentId: student.id, kind: 'tuition', name: offer.title, amount: offer.amount } });
      await tx.tuitionEnrollment.create({ data: { applicationId: id, orderId: order.id, studentId: student.id, teacherId: offer.teacherId, sessions: offer.sessions, feeBps: offer.feeBps, amount: offer.amount } });
      await tx.courseApplication.update({ where: { id }, data: { status: decision, studentId: student.id } });
      await tx.notification.create({ data: { targetType: 'student', targetId: student.id, kind: 'course_ready', channel: 'email', scheduledAt: new Date() } });
    }
    await tx.auditLog.create({ data: { actorType: 'admin', actorId, action: `application.${decision}`, meta: { applicationId: id } } });
    return { status: decision };
  });
}

export async function ownTuitionOrder(studentId: bigint, id: string) {
  const order = await db().paymentOrder.findUnique({ where: { id } });
  if (!order || order.studentId !== studentId || order.kind !== 'tuition') throw apiError('NOT_FOUND');
  return order;
}
export async function confirmTuition(studentId: bigint, value: unknown) {
  const input = parseTuition(z.object({ orderId: z.string().uuid(), paymentKey: z.string().min(1).max(200), amount: z.number().int().positive() }), value);
  const order = await ownTuitionOrder(studentId, input.orderId);
  if (order.amount !== input.amount || !['pending','paid'].includes(order.status)) throw apiError('VALIDATION_FAILED');
  let payment: VerifiedPayment;
  try { payment = await tossRequest<VerifiedPayment>('payments/confirm', { orderId: order.id, paymentKey: input.paymentKey, amount: order.amount }, order.requestKey); }
  catch { payment = await tossRequest<VerifiedPayment>(`payments/${encodeURIComponent(input.paymentKey)}`); }
  assertPaymentMatches(payment, order);
  if (payment.paymentKey !== input.paymentKey) throw apiError('VALIDATION_FAILED');
  return reconcileTuition(payment);
}
export async function reconcileTuition(payment: VerifiedPayment) {
  const order = await db().paymentOrder.findUnique({ where: { id: payment.orderId } });
  if (!order || order.kind !== 'tuition') throw apiError('NOT_FOUND');
  assertPaymentMatches(payment, order);
  if (!Number.isSafeInteger(payment.balanceAmount) || payment.balanceAmount < 0 || payment.balanceAmount > order.amount) throw apiError('VALIDATION_FAILED');
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${order.teacherId} FOR UPDATE`;
    const current = await tx.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
    const enrollment = await tx.tuitionEnrollment.findUniqueOrThrow({ where: { orderId: order.id } });
    if (current.paymentKey && current.paymentKey !== payment.paymentKey) throw apiError('VALIDATION_FAILED');
    if (payment.status === 'DONE') {
      if (current.status !== 'pending') return { status: current.status };
      await tx.paymentOrder.update({ where: { id: order.id }, data: { status: 'paid', paymentKey: payment.paymentKey, paidAt: new Date() } });
      await tx.tuitionEnrollment.update({ where: { id: enrollment.id }, data: { status: 'active' } });
      return { status: 'paid' };
    }
    const refunded = order.amount - payment.balanceAmount;
    if (refunded < enrollment.refundAmount && current.status !== 'refunding') return { status: current.status };
    const earned = Math.floor(enrollment.amount * enrollment.used / enrollment.sessions);
    if (current.status === 'refunding' && refunded < enrollment.refundAmount) return { status: 'refunding' };
    const status = refunded !== enrollment.amount - earned ? 'review_required' : 'refunded';
    await tx.paymentOrder.update({ where: { id: order.id }, data: { status, paymentKey: payment.paymentKey, refundedAt: new Date() } });
    await tx.tuitionEnrollment.update({ where: { id: enrollment.id }, data: { status, refundAmount: refunded } });
    return { status };
  });
}

/** Teacher row lock is shared with starts, refunds and settlement creation. */
export async function reserveTuition(tx: Prisma.TransactionClient, studentId: bigint, teacherId: bigint, lessonId: bigint) {
  const enrollments = await tx.tuitionEnrollment.findMany({ where: { studentId, teacherId }, orderBy: { createdAt: 'asc' } });
  if (!enrollments.length) return; // Existing externally paid students retain their workflow.
  const enrollment = enrollments.find(e => e.status === 'active' && e.used < e.sessions);
  if (!enrollment) throw apiError('VALIDATION_FAILED', '사용 가능한 수강권이 없습니다. 학생 수강 내역을 확인하세요');
  const share = tuitionShare(enrollment.amount, enrollment.sessions, enrollment.feeBps, enrollment.used + 1);
  await tx.tuitionUsage.create({ data: { enrollmentId: enrollment.id, lessonId, teacherId, ...share } });
  await tx.tuitionEnrollment.update({ where: { id: enrollment.id }, data: { used: { increment: 1 } } });
}
export async function completeTuition(tx: Prisma.TransactionClient, teacherId: bigint, lessonId: bigint, now: Date) {
  await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${teacherId} FOR UPDATE`;
  await tx.tuitionUsage.updateMany({ where: { lessonId, teacherId, status: 'reserved' }, data: { status: 'completed', completedAt: now } });
}
export async function refundTuition(studentId: bigint, orderId: string) {
  const order = await ownTuitionOrder(studentId, orderId);
  if (!order.paymentKey) throw apiError('VALIDATION_FAILED');
  const enrollment = await db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${order.teacherId} FOR UPDATE`;
    const current = await tx.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
    const e = await tx.tuitionEnrollment.findUniqueOrThrow({ where: { orderId } });
    if (['refunded','refunding'].includes(current.status)) return e;
    if (current.status !== 'paid' || e.status !== 'active') throw apiError('VALIDATION_FAILED');
    if (await tx.tuitionUsage.count({ where: { enrollmentId: e.id, status: 'reserved' } })) throw apiError('VALIDATION_FAILED', 'Finish the ongoing lesson before requesting a refund.');
    const refundAmount = e.amount - Math.floor(e.amount * e.used / e.sessions);
    if (refundAmount <= 0) throw apiError('VALIDATION_FAILED', 'No unused lessons remain.');
    await tx.paymentOrder.update({ where: { id: orderId }, data: { status: 'refunding' } });
    return tx.tuitionEnrollment.update({ where: { id: e.id }, data: { status: 'refunding', refundAmount } });
  });
  if (enrollment.status === 'refunded') return { status: 'refunded' };
  let payment = await tossRequest<VerifiedPayment>(`payments/${encodeURIComponent(order.paymentKey)}`);
  assertPaymentMatches(payment, order);
  const alreadyRefunded = order.amount - payment.balanceAmount;
  if (alreadyRefunded < enrollment.refundAmount) payment = await tossRequest<VerifiedPayment>(`payments/${encodeURIComponent(order.paymentKey)}/cancel`, {
    cancelReason: 'Unused Korean lesson package refund', cancelAmount: enrollment.refundAmount - alreadyRefunded,
  }, order.refundKey);
  if (payment.status === 'DONE') throw apiError('VALIDATION_FAILED', 'Refund pending. Please check this order again.');
  return reconcileTuition(payment);
}

export async function createPayout(teacherId: bigint, actorId: bigint) {
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${teacherId} FOR UPDATE`;
    // Any unmatched external refund must be reconciled before disbursement.
    if (await tx.tuitionEnrollment.count({ where: { teacherId, status: { in: ['review_required','refunding'] } } })) throw apiError('VALIDATION_FAILED', '환불 확인을 먼저 완료하세요');
    const rows = await tx.tuitionUsage.findMany({ where: { teacherId, status: 'completed', payoutId: null }, take: 100 });
    const amount = rows.reduce((sum, row) => sum + row.net, 0);
    if (!amount) throw apiError('VALIDATION_FAILED', '정산할 완료 수업이 없습니다');
    const payout = await tx.teacherPayout.create({ data: { teacherId, amount } });
    await tx.tuitionUsage.updateMany({ where: { id: { in: rows.map(r => r.id) }, payoutId: null }, data: { payoutId: payout.id } });
    await tx.auditLog.create({ data: { actorType: 'admin', actorId, action: 'payout.create', meta: { payoutId: payout.id, amount } } });
    return payout;
  });
}
export async function recordPayout(id: string, reference: string, actorId: bigint) {
  if (typeof reference !== 'string' || reference.trim().length < 6 || reference.length > 200) throw apiError('VALIDATION_FAILED', '은행 송금 내역의 고유 식별자를 입력하세요');
  return db().$transaction(async tx => {
    const initial = await tx.teacherPayout.findUnique({ where: { id } });
    if (!initial) throw apiError('NOT_FOUND');
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${initial.teacherId} FOR UPDATE`;
    const payout = await tx.teacherPayout.findUniqueOrThrow({ where: { id } });
    if (payout.status === 'paid') return payout;
    if (await tx.tuitionEnrollment.count({ where: { teacherId: payout.teacherId, status: { in: ['review_required','refunding'] } } })) throw apiError('VALIDATION_FAILED', '환불 확인을 먼저 완료하세요');
    const result = await tx.teacherPayout.update({ where: { id }, data: { status: 'paid', transferReference: reference.trim(), paidAt: new Date() } });
    await tx.auditLog.create({ data: { actorType: 'admin', actorId, action: 'payout.record_transfer', meta: { payoutId: id, reference: reference.trim() } } });
    return result;
  });
}
