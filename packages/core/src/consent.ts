import { consentNotice, CONSENT_VERSION, type ConsentNotice } from '@hangyeol/content';
import { apiError } from './errors.js';
import { db } from './guard.js';

/*
 * 개인정보 동의 — 09번 문서 §4.
 *
 * 두 개를 따로 받는다.
 *
 *   강사   학생 정보를 입력하는 시점에 "학생 동의를 받았음" 을 확인한다.
 *          강사는 남의 정보를 대신 입력한다(09번 §5 L3).
 *   학생   학습노트 첫 진입에서 직접 동의한다. 필수 동의다 —
 *          동의 전에는 노트의 어떤 화면도 열리지 않는다.
 *
 * 강사 확인만으로 끝내지 않는 이유: 그건 강사의 진술이지 학생의 의사가 아니다.
 * 학생 본인이 누른 기록이 없으면 "동의를 받았다" 는 말을 아무도 확인할 수 없다.
 *
 * 동의 기록은 학생 활동(student_activity)에 남기지 않는다.
 * 그걸 남기면 동의 클릭 한 번이 과금 활성 판정의 (B) 조건을 채운다 —
 * 수업도 복습도 없는 주기가 청구된다. 05번 §3.2 가 뜻한 활동이 아니다.
 */

export interface ConsentState {
  required: boolean;
  consentedAt: string | null;
  version: string | null;
  withdrawRequestedAt: string | null;
  notice: ConsentNotice;
}

export async function consentState(studentId: bigint): Promise<ConsentState> {
  const student = await db().student.findUnique({
    where: { id: studentId },
    select: { l1Code: true, consentAt: true, consentVersion: true, withdrawRequestedAt: true },
  });
  if (!student) throw apiError('NOT_FOUND');

  // 고지가 바뀌면 다시 받는다. 예전 판에 동의한 기록은 새 판을 설명하지 못한다.
  const current = student.consentAt !== null && student.consentVersion === CONSENT_VERSION;

  return {
    required: !current,
    consentedAt: student.consentAt?.toISOString() ?? null,
    version: student.consentVersion,
    withdrawRequestedAt: student.withdrawRequestedAt?.toISOString() ?? null,
    notice: consentNotice(student.l1Code),
  };
}

/** 학생이 직접 누른다. 동의 없이 이 함수를 부르는 경로를 만들지 않는다. */
export async function recordConsent(studentId: bigint, now = new Date()): Promise<ConsentState> {
  const prisma = db();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { l1Code: true },
  });
  if (!student) throw apiError('NOT_FOUND');

  await prisma.student.update({
    where: { id: studentId },
    data: {
      consentAt: now,
      consentVersion: CONSENT_VERSION,
      consentLocale: consentNotice(student.l1Code).locale,
      // 다시 동의했다면 이전 철회 요청은 철회된 것이다.
      withdrawRequestedAt: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'student',
      actorId: studentId,
      action: 'consent.granted',
      entity: 'students',
      entityId: studentId,
      meta: { version: CONSENT_VERSION },
    },
  });

  return consentState(studentId);
}

/**
 * 철회 요청 — 09번 §4 "철회 요청 시 30일 내 파기, 강사에게 통지".
 *
 * 여기서 바로 지우지 않는다. 지우면 진행 중인 수업의 진도와 수강권이 같이
 * 사라지고, 강사는 이유도 모른 채 학생을 잃는다. 요청을 기록하고 강사에게
 * 알린 뒤, 30일이 지나면 파기 배치가 지운다(retention.ts).
 */
export async function requestWithdrawal(studentId: bigint, now = new Date()) {
  const prisma = db();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, teacherId: true, name: true, withdrawRequestedAt: true },
  });
  if (!student) throw apiError('NOT_FOUND');

  // 같은 요청을 여러 번 눌러도 기한이 미뤄지지 않는다.
  if (student.withdrawRequestedAt) {
    return { requestedAt: student.withdrawRequestedAt.toISOString(), duplicate: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.student.update({ where: { id: studentId }, data: { withdrawRequestedAt: now } });

    await tx.notification.create({
      data: {
        targetType: 'teacher',
        targetId: student.teacherId,
        kind: 'consent_withdrawn',
        // 학생 이름은 강사가 이미 아는 정보다. 이메일은 넣지 않는다.
        payload: { studentId: String(student.id), studentName: student.name, purgeAfterDays: 30 },
        scheduledAt: now,
        channel: 'email',
      },
    });

    await tx.auditLog.create({
      data: {
        actorType: 'student',
        actorId: studentId,
        action: 'consent.withdraw_requested',
        entity: 'students',
        entityId: studentId,
      },
    });
  });

  return { requestedAt: now.toISOString(), duplicate: false };
}

/**
 * 학습노트 API 의 동의 관문.
 *
 * 화면마다 검사하면 반드시 하나를 빠뜨리고, 빠뜨린 그 화면이 동의 없이 열린다.
 * 그래서 세션을 꺼내는 자리 옆에 이것을 둔다.
 */
export async function assertConsented(studentId: bigint): Promise<void> {
  const state = await consentState(studentId);
  if (!state.required) return;

  throw apiError('STUDENT_CONSENT_REQUIRED', undefined, { version: CONSENT_VERSION });
}
