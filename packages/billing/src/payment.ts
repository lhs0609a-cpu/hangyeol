import { addDays, type BillingStatus, type InvoiceStatus, type StudentStatus } from '@hangyeol/shared';

/**
 * 결제 실패 처리 — 05번 문서 §6.
 *
 * 독촉하지 않는다. 다음 차시가 안 열리는 것이 유일하고 충분한 회수 수단이다.
 */

/** 실패 후 잠금까지의 유예. 이 3일 동안은 아무것도 잠그지 않는다. */
export const GRACE_DAYS = 3;

/** 유예 기간 중 자동 재시도 상한 (D+1, D+2). 10번 문서의 "최대 3회" 를 넘지 않는다. */
export const MAX_RETRY_ATTEMPTS = 3;

export interface InvoiceState {
  status: InvoiceStatus;
  failedAt: Date | null;
  graceUntil: Date | null;
  retryCount: number;
  paidAt: Date | null;
  pgTid: string | null;
}

export interface PaymentFailureResult {
  invoice: InvoiceState;
  teacherBillingStatus: BillingStatus;
  /** 실패 직후에는 잠그지 않는다. */
  lockStudents: false;
  notify: 'payment_failed';
}

export function onPaymentFailure(invoice: InvoiceState, now: Date): PaymentFailureResult {
  return {
    invoice: {
      ...invoice,
      // D+0: failed 로 찍고 곧바로 grace 로 넘긴다.
      status: 'grace',
      failedAt: invoice.failedAt ?? now,
      graceUntil: invoice.graceUntil ?? addDays(now, GRACE_DAYS),
      retryCount: invoice.retryCount,
    },
    teacherBillingStatus: 'failed',
    lockStudents: false,
    notify: 'payment_failed',
  };
}

/** payment-retry 배치가 이 인보이스를 다시 긁어야 하는가. */
export function shouldRetry(invoice: InvoiceState, now: Date): boolean {
  if (invoice.status !== 'grace') return false;
  if (invoice.graceUntil === null) return false;
  if (now.getTime() >= invoice.graceUntil.getTime()) return false;
  return invoice.retryCount < MAX_RETRY_ATTEMPTS;
}

export function recordRetryFailure(invoice: InvoiceState): InvoiceState {
  return { ...invoice, retryCount: invoice.retryCount + 1 };
}

export interface LockResult {
  invoice: InvoiceState;
  teacherBillingStatus: BillingStatus;
  /** 강사의 모든 학생을 잠근다. 학생 노트는 읽기전용으로 살아있다. */
  lockStudents: boolean;
}

/**
 * lock-enforce 배치 (매일 KST 04:00).
 * 유예 만료 & 미결제 → 잠금. 상태 기반이므로 재실행해도 결과가 같다.
 */
export function enforceLock(invoice: InvoiceState, now: Date): LockResult {
  const expired =
    invoice.status === 'grace' &&
    invoice.graceUntil !== null &&
    now.getTime() >= invoice.graceUntil.getTime();

  if (!expired) {
    return {
      invoice,
      teacherBillingStatus: invoice.status === 'grace' ? 'failed' : 'ok',
      lockStudents: invoice.status === 'locked',
    };
  }

  return {
    invoice: { ...invoice, status: 'locked' },
    teacherBillingStatus: 'locked',
    lockStudents: true,
  };
}

/**
 * 잠금 시 학생 상태 전이.
 * 복원을 위해 직전 상태를 반드시 보존한다 (students.status_before_lock).
 */
export function lockStudent(current: StudentStatus): {
  status: StudentStatus;
  statusBeforeLock: StudentStatus | null;
} {
  if (current === 'locked') return { status: 'locked', statusBeforeLock: null };
  return { status: 'locked', statusBeforeLock: current };
}

export function unlockStudent(
  current: StudentStatus,
  statusBeforeLock: StudentStatus | null,
): StudentStatus {
  if (current !== 'locked') return current;
  return statusBeforeLock ?? 'active';
}

export interface PaymentSuccessResult {
  invoice: InvoiceState;
  teacherBillingStatus: BillingStatus;
  /** 이 인보이스에 묶인 주기는 paid 로 넘어간다. */
  cycleStatusAfter: 'paid';
  unlockStudents: boolean;
}

export function onPaymentSuccess(
  invoice: InvoiceState,
  now: Date,
  pgTid: string,
): PaymentSuccessResult {
  return {
    invoice: { ...invoice, status: 'paid', paidAt: now, pgTid },
    teacherBillingStatus: 'ok',
    cycleStatusAfter: 'paid',
    unlockStudents: invoice.status === 'locked' || invoice.status === 'grace',
  };
}

/**
 * PG 웹훅 멱등 판정. 같은 pg_tid 가 다시 오면 무시한다.
 */
export function isDuplicateWebhook(invoice: InvoiceState, pgTid: string): boolean {
  return invoice.pgTid === pgTid && invoice.status === 'paid';
}

/**
 * 잠금 상태에서 학생이 무엇을 할 수 있는가 — TC-10.
 * 학생은 잘못이 없다. SRS·HVPT·다청은 계속 돌아가고, 새 차시 자료만 막힌다.
 */
export function studentNoteAccess(teacherBillingStatus: BillingStatus): {
  srs: boolean;
  hvpt: boolean;
  listening: boolean;
  newLessonAssets: boolean;
} {
  const locked = teacherBillingStatus === 'locked';
  return { srs: true, hvpt: true, listening: true, newLessonAssets: !locked };
}
