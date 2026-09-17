import { addDays } from '@hangyeol/shared';
import { randomToken } from './crypto.js';
import { db } from './guard.js';

/*
 * 보관기간과 파기 — 09번 문서 §4.
 *
 *   학생 학습 이력   강사 탈퇴 후 90일
 *   철회 요청        요청 후 30일 내 파기, 강사에게 통지
 *
 * 그동안 이 표는 문서에만 있었다. 문서에만 있는 보관기간은 지켜지지 않는다 —
 * 아무도 지우지 않으면 데이터는 영원히 남는다.
 *
 * ── 지우는 것과 남기는 것
 *
 * 학습 이력은 지운다. 단어장·복습 기록·레벨 테스트·수업 리포트 항목처럼
 * 그 학생이 무엇을 배웠는지 말하는 것 전부다.
 *
 * 수업·청구 행은 남긴다. 05번 과금 명세가 계산 근거를 요구하고,
 * 09번 §5 L2·L4 가 거래 내역 보관을 요구한다. 대신 그 행에서 사람을 찾을 수
 * 없도록 학생 레코드의 식별 정보를 지운다 — 이름·이메일·국가·플랫폼 주소.
 * 행을 통째로 지우면 청구서의 라인이 함께 사라져 매출 근거가 깨진다.
 *
 * 되돌릴 수 없다. 그래서 배치는 기한이 지난 것만 건드리고, 무엇을 지웠는지
 * 감사 로그에 남긴다.
 */

export const WITHDRAW_PURGE_DAYS = 30;
export const TEACHER_PURGE_DAYS = 90;

/** 지운 뒤에도 남는 이름. 화면이 빈칸을 그리지 않도록 자리표시만 둔다. */
const PURGED_NAME = '파기된 기록';

async function purgeStudent(studentId: bigint, reason: string, now: Date): Promise<void> {
  const prisma = db();

  await prisma.$transaction(async (tx) => {
    // 학습 이력 — 09번 §4 표의 "학습 이력(단어장·SRS·HVPT)".
    await tx.lessonReportItem.deleteMany({ where: { lesson: { studentId } } });
    await tx.vocabCard.deleteMany({ where: { studentId } });
    await tx.studentActivity.deleteMany({ where: { studentId } });
    await tx.levelTest.deleteMany({ where: { studentId } });
    await tx.hvptSession.deleteMany({ where: { studentId } });
    await tx.fluencySession.deleteMany({ where: { studentId } });
    await tx.listeningLog.deleteMany({ where: { studentId } });
    await tx.strandWeekly.deleteMany({ where: { studentId } });
    await tx.learningProgress.deleteMany({ where: { studentId } });

    // 열람 로그는 학생별 기록이다. 우회 감지용이지만 보관기간이 따로 있지 않다.
    await tx.assetView.deleteMany({ where: { studentId } });

    // 보내지 않은 알림에는 학생 이름이 들어 있다.
    await tx.notification.deleteMany({ where: { targetType: 'student', targetId: studentId } });
    await tx.lessonSchedule.deleteMany({ where: { studentId } });

    /*
     * 식별 정보를 지운다.
     *
     * email_hash 는 NOT NULL 이고 (teacher_id, email_hash) 가 유일키다.
     * 빈 문자열로 두면 같은 강사의 두 번째 파기에서 충돌한다. 그래서 난수를 넣는다 —
     * 어떤 이메일로도 다시 찾아지지 않으면서 유일성은 지킨다.
     */
    await tx.student.update({
      where: { id: studentId },
      data: {
        name: PURGED_NAME,
        nameKo: null,
        emailHash: `purged:${randomToken(16)}`,
        emailEnc: Buffer.alloc(0),
        countryCode: null,
        platformUrl: null,
        status: 'completed',
        withdrawRequestedAt: null,
        consentAt: null,
        consentVersion: null,
        consentLocale: null,
        teacherConsentAt: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorType: 'system',
        action: 'student.purged',
        entity: 'students',
        entityId: studentId,
        meta: { reason, purgedAt: now.toISOString() },
      },
    });
  });
}

export interface PurgeResult {
  withdrawn: number;
  departed: number;
}

/**
 * 파기 배치. 멱등하다 — 이미 파기된 학생은 기한 조회에 걸리지 않는다
 * (withdraw_requested_at 을 비우고, 강사 탈퇴 건은 파기 표시로 걸러진다).
 */
export async function runRetentionPurge(now = new Date()): Promise<PurgeResult> {
  const prisma = db();

  // 1) 학생 본인이 철회를 요청한 지 30일이 지난 건.
  const withdrawn = await prisma.student.findMany({
    where: { withdrawRequestedAt: { lte: addDays(now, -WITHDRAW_PURGE_DAYS) } },
    select: { id: true },
    take: 500,
  });

  for (const student of withdrawn) {
    await purgeStudent(student.id, 'withdraw_request', now);
  }

  // 2) 강사가 탈퇴한 지 90일이 지난 건. 그 강사의 학생 전부가 대상이다.
  const departed = await prisma.student.findMany({
    where: {
      name: { not: PURGED_NAME },
      teacher: { withdrawnAt: { lte: addDays(now, -TEACHER_PURGE_DAYS) } },
    },
    select: { id: true },
    take: 500,
  });

  for (const student of departed) {
    await purgeStudent(student.id, 'teacher_withdrawn', now);
  }

  return { withdrawn: withdrawn.length, departed: departed.length };
}

/**
 * 강사 탈퇴 표시.
 *
 * 즉시 지우지 않는다. 학생의 학습 기록은 90일 더 살아 있어야 하고(09번 §4),
 * 청구·정산 기록은 그보다 오래 남아야 한다. 대신 이 시각부터 로그인을 막는다.
 */
export async function withdrawTeacher(teacherId: bigint, now = new Date()) {
  const prisma = db();

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { withdrawnAt: true },
  });
  if (!teacher) return { withdrawnAt: null, duplicate: false };

  // 두 번 눌러도 기한이 미뤄지지 않는다.
  if (teacher.withdrawnAt) {
    return { withdrawnAt: teacher.withdrawnAt.toISOString(), duplicate: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.teacher.update({ where: { id: teacherId }, data: { withdrawnAt: now } });
    await tx.auditLog.create({
      data: {
        actorType: 'teacher',
        actorId: teacherId,
        action: 'teacher.withdrawn',
        entity: 'teachers',
        entityId: teacherId,
        meta: { studentPurgeAfterDays: TEACHER_PURGE_DAYS },
      },
    });
  });

  return { withdrawnAt: now.toISOString(), duplicate: false };
}
