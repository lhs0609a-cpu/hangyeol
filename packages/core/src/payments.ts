import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  applyTopup,
  enforceLock,
  isDuplicateWebhook,
  onPaymentFailure,
  onPaymentSuccess,
  type InvoiceState,
} from '@hangyeol/billing';
import { apiError } from './errors.js';
import { db } from './guard.js';

/*
 * 결제 — 02번 문서 E-06·E-07·E-09, 05번 문서 §6·§7.
 *
 * 카드번호는 절대 보관하지 않는다. PG 빌링키만 갖는다 (09번 문서 §4).
 * 판정 로직은 전부 packages/billing 의 순수 함수가 한다. 여기서는 반영만 한다.
 */

function toInvoiceState(row: {
  status: string;
  failedAt: Date | null;
  graceUntil: Date | null;
  retryCount: number;
  paidAt: Date | null;
  pgTid: string | null;
}): InvoiceState {
  return {
    status: row.status as InvoiceState['status'],
    failedAt: row.failedAt,
    graceUntil: row.graceUntil,
    retryCount: row.retryCount,
    paidAt: row.paidAt,
    pgTid: row.pgTid,
  };
}

/** 빌링키 등록. 카드번호는 우리에게 오지 않는다 — PG 위젯이 발급한 키만 받는다. */
export async function registerBillingKey(params: {
  teacherId: bigint;
  pgBillingKey: string;
  cardLast4?: string;
}) {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(params.pgBillingKey)) {
    throw apiError('VALIDATION_FAILED', '빌링키 형식이 올바르지 않습니다');
  }
  if (params.cardLast4 && !/^\d{4}$/.test(params.cardLast4)) {
    throw apiError('VALIDATION_FAILED', '카드 뒷자리는 숫자 4자리입니다');
  }

  await db().teacher.update({
    where: { id: params.teacherId },
    data: {
      pgCustomerId: params.pgBillingKey,
      cardLast4: params.cardLast4 ?? null,
      // 등록만으로 잠금이 풀리지는 않는다. 결제가 성공해야 풀린다.
      ...(await hasUnpaid(params.teacherId) ? {} : { billingStatus: 'ok' }),
    },
  });

  return { ok: true, cardLast4: params.cardLast4 ?? null };
}

async function hasUnpaid(teacherId: bigint): Promise<boolean> {
  const count = await db().invoice.count({
    where: { teacherId, status: { in: ['pending', 'failed', 'grace', 'locked'] } },
  });
  return count > 0;
}

/** 크레딧 선충전 — 05번 문서 §7. 목적은 이자 수익이 아니라 락인이다. */
export async function topupCredits(params: {
  teacherId: bigint;
  paidAmount: number;
  pgTid: string;
  now?: Date;
}) {
  const prisma = db();
  const now = params.now ?? new Date();

  // 같은 pg_tid 로 두 번 적립하면 안 된다.
  const dup = await prisma.creditTopup.findFirst({ where: { pgTid: params.pgTid } });
  if (dup) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.teacherId },
      select: { creditBalance: true },
    });
    return {
      duplicate: true,
      grantedAmount: dup.grantedAmount,
      bonusPct: dup.bonusPct,
      balanceAfter: teacher?.creditBalance ?? 0,
    };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: params.teacherId },
    select: { creditBalance: true },
  });
  if (!teacher) throw apiError('NOT_FOUND');

  const result = applyTopup({
    paidAmount: params.paidAmount,
    currentBalance: teacher.creditBalance,
    now,
  });

  await prisma.$transaction([
    prisma.creditTopup.create({
      data: {
        teacherId: params.teacherId,
        paidAmount: result.paidAmount,
        grantedAmount: result.grantedAmount,
        bonusPct: result.bonusPct,
        pgTid: params.pgTid,
      },
    }),
    prisma.teacher.update({
      where: { id: params.teacherId },
      data: { creditBalance: result.balanceAfter },
    }),
  ]);

  return {
    duplicate: false,
    grantedAmount: result.grantedAmount,
    bonusPct: result.bonusPct,
    balanceAfter: result.balanceAfter,
    expiresAt: result.expiresAt,
  };
}

/**
 * PG 웹훅 서명 검증 — 04번 문서 J.
 * 서명이 없거나 틀리면 본문을 읽지도 않는다.
 */
export function verifyPgSignature(rawBody: string, signature: string | null): void {
  const secret = process.env.PG_WEBHOOK_SECRET;
  if (!secret) throw apiError('INTERNAL', 'PG_WEBHOOK_SECRET 이 설정되지 않았습니다');
  if (!signature) throw apiError('UNAUTHENTICATED', '서명이 없습니다');

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw apiError('UNAUTHENTICATED', '서명이 일치하지 않습니다');
  }
}

export interface PgWebhookPayload {
  pgTid: string;
  invoiceId?: string;
  teacherId?: string;
  status: 'paid' | 'failed';
  kind?: 'invoice' | 'topup';
  amount?: number;
}

/**
 * PG 결제 결과 수신 — 04번 문서 J.
 *
 * 멱등키는 pg_tid 다. 중복 수신 시 무시한다.
 * PG 는 같은 이벤트를 여러 번 보낸다. 그때마다 상태를 다시 쓰면
 * 이미 복원한 학생 상태를 또 덮어쓰게 된다.
 */
export async function handlePgWebhook(payload: PgWebhookPayload, now = new Date()) {
  const prisma = db();

  if (payload.kind === 'topup') {
    if (!payload.teacherId || !payload.amount) {
      throw apiError('VALIDATION_FAILED', '충전 웹훅에 teacherId 와 amount 가 필요합니다');
    }
    if (payload.status !== 'paid') return { ignored: true, reason: 'topup-not-paid' };
    return topupCredits({
      teacherId: BigInt(payload.teacherId),
      paidAmount: payload.amount,
      pgTid: payload.pgTid,
      now,
    });
  }

  if (!payload.invoiceId) throw apiError('VALIDATION_FAILED', 'invoiceId 가 필요합니다');

  const invoice = await prisma.invoice.findUnique({ where: { id: BigInt(payload.invoiceId) } });
  if (!invoice) throw apiError('NOT_FOUND');

  const state = toInvoiceState(invoice);

  if (isDuplicateWebhook(state, payload.pgTid)) {
    return { ignored: true, reason: 'duplicate-pg-tid' };
  }

  if (payload.status === 'paid') {
    const result = onPaymentSuccess(state, now, payload.pgTid);

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'paid', paidAt: now, pgTid: payload.pgTid },
      });
      await tx.invoiceLine.findMany({ where: { invoiceId: invoice.id } }).then((lines) =>
        tx.billingCycle.updateMany({
          where: { id: { in: lines.map((l) => l.billingCycleId) } },
          data: { status: result.cycleStatusAfter },
        }),
      );
      await tx.teacher.update({
        where: { id: invoice.teacherId },
        data: { billingStatus: result.teacherBillingStatus },
      });

      if (result.unlockStudents) {
        // 잠금 직전 상태로 복원한다. 전원 active 로 되살리면
        // dormant·completed 학생까지 살아난다.
        await tx.$executeRaw`
          UPDATE students
          SET status = COALESCE(status_before_lock, 'active'), status_before_lock = NULL
          WHERE teacher_id = ${invoice.teacherId} AND status = 'locked'
        `;
      }
    });

    return { ok: true, status: 'paid' as const, unlocked: result.unlockStudents };
  }

  const result = onPaymentFailure(state, now);

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: result.invoice.status,
        failedAt: result.invoice.failedAt,
        graceUntil: result.invoice.graceUntil,
      },
    }),
    prisma.teacher.update({
      where: { id: invoice.teacherId },
      data: { billingStatus: result.teacherBillingStatus },
    }),
    prisma.notification.create({
      data: {
        targetType: 'teacher',
        targetId: invoice.teacherId,
        kind: 'payment_failed',
        scheduledAt: now,
        channel: 'email',
        payload: { invoiceId: String(invoice.id), graceUntil: result.invoice.graceUntil },
      },
    }),
  ]);

  // D+0 에는 아무것도 잠그지 않는다. 3일 유예가 먼저다.
  return { ok: true, status: 'grace' as const, graceUntil: result.invoice.graceUntil };
}

/** payment-retry 배치가 실제로 PG 를 다시 긁는다. */
export async function retryInvoice(invoiceId: bigint, charge: (args: { billingKey: string; amount: number }) => Promise<{ ok: boolean; pgTid: string }>, now = new Date()) {
  const prisma = db();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { teacher: { select: { pgCustomerId: true } } },
  });
  if (!invoice) throw apiError('NOT_FOUND');
  if (!invoice.teacher.pgCustomerId) {
    return { skipped: true, reason: 'no-billing-key' };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { retryCount: { increment: 1 } },
  });

  const res = await charge({
    billingKey: invoice.teacher.pgCustomerId,
    amount: invoice.chargeAmount,
  });

  return handlePgWebhook(
    {
      pgTid: res.pgTid,
      invoiceId: String(invoiceId),
      status: res.ok ? 'paid' : 'failed',
      kind: 'invoice',
    },
    now,
  );
}

/** lock-enforce 가 부르는 상태 판정 재노출 — 배치에서 같은 함수를 쓴다. */
export { enforceLock };
