import { db } from './guard.js';
import { decryptEmail } from './crypto.js';
import { magicLinkUrl } from './students.js';
import { signMagicLink } from './auth.js';

export function reminderText(noteUrl: string) {
  return { subject: 'Your Korean practice is ready', text: `Hi! Take a few minutes to practise the expressions from your lesson.\n\nOpen your learning notebook: ${noteUrl}\n\nTry saying each expression before revealing the answer. Your teacher will review difficult expressions with you next time.` };
}
/** A leased outbox; provider idempotency prevents duplicates if the process exits after sending. */
export async function runNotifications(now = new Date()) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM || process.env.MAIL_ENABLED !== 'true') return { skipped: 'mail-not-enabled' };
  const prisma = db();
  const pending = await prisma.notification.findMany({ where: { channel: 'email', sentAt: null, scheduledAt: { lte: now }, attempts: { lt: 5 }, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] }, take: 25, orderBy: { scheduledAt: 'asc' } });
  let sent = 0;
  for (const item of pending) {
    const claimed = await prisma.notification.updateMany({ where: { id: item.id, sentAt: null, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] }, data: { lockedUntil: new Date(now.getTime() + 120_000), attempts: { increment: 1 } } });
    if (!claimed.count) continue;
    try {
      let to: string; let message: { subject: string; text: string };
      if (item.targetType === 'student') {
        const student = await prisma.student.findUniqueOrThrow({ where: { id: item.targetId } });
        to = decryptEmail(student.emailEnc);
        message = reminderText(await magicLinkUrl(student.id, student.teacherId));
        if (item.kind === 'course_ready') {
          const base = process.env.TEACHER_BASE_URL;
          if (!base) throw new Error('course-url-not-configured');
          const token = await signMagicLink({ studentId: String(student.id), teacherId: String(student.teacherId) });
          message = { subject: 'Your Korean course is ready', text: `Your course application has been approved. Review your package and complete payment using this private link:\n\n${base}/student-area?t=${encodeURIComponent(token)}\n\nThe link expires in 15 minutes. Request a new link from the courses page if needed.` };
        }
      } else {
        const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: item.targetId } });
        to = teacher.email;
        message = { subject: '수업 운영 알림', text: item.kind === 'payment_failed' ? '이용료 결제가 확인되지 않았습니다. 로그인 후 청구 화면에서 결제 내역을 확인해 주세요.' : '계정 또는 수업 정보가 업데이트되었습니다. 로그인 후 확인해 주세요.' };
      }
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(20_000),
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `notification/${item.id}` },
        body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], ...message }) });
      if (!response.ok) throw new Error('provider-rejected');
      await prisma.notification.update({ where: { id: item.id }, data: { sentAt: new Date(), lockedUntil: null, lastError: null } });
      sent++;
    } catch {
      await prisma.notification.update({ where: { id: item.id }, data: { lockedUntil: new Date(now.getTime() + 5 * 60_000 * (item.attempts + 1)), lastError: 'delivery-failed' } });
    }
  }
  return { sent, attempted: pending.length };
}
