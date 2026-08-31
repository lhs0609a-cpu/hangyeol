import { resolveEnrollment } from '@hangyeol/billing';
import type { Prisma } from '@hangyeol/db';
import { signMagicLink } from './auth.js';
import { encryptEmail, hashEmail } from './crypto.js';
import { apiError } from './errors.js';
import { db } from './guard.js';

/**
 * 학생 레코드 — 02번 문서 B-01~B-05, P0 코어.
 * 없으면 자물쇠도 과금도 성립하지 않는다.
 */

export interface CreateStudentInput {
  teacherId: bigint;
  name: string;
  nameKo?: string | null;
  email: string;
  l1Code: string;
  countryCode?: string | null;
  platform: 'italki' | 'preply' | 'direct';
  platformUrl?: string | null;
  goalTrack?: string | null;
}

export interface CreateStudentResult {
  id: bigint;
  status: string;
  duplicate: boolean;
  noteUrl: string;
  billing: { chargedNow: number; firstChargeAtLessonNo: number };
}

export function noteBaseUrl(): string {
  return process.env.NOTE_BASE_URL ?? 'http://localhost:3001';
}

/**
 * 등록은 언제나 무료다. 같은 이메일이 이미 있으면 새로 만들지 않고 이어간다.
 * 05번 문서 §8-4: cycle_no 를 이어가고 새 과금은 발생하지 않는다.
 */
export async function createStudent(input: CreateStudentInput): Promise<CreateStudentResult> {
  const prisma = db();
  const emailHash = hashEmail(input.email);

  const existing = await prisma.student.findUnique({
    where: { teacherId_emailHash: { teacherId: input.teacherId, emailHash } },
    select: { id: true, status: true, currentLessonNo: true },
  });

  if (existing) {
    const maxCycle = await prisma.billingCycle.aggregate({
      where: { studentId: existing.id },
      _max: { cycleNo: true },
    });

    const decision = resolveEnrollment({
      id: Number(existing.id),
      status: existing.status as never,
      maxCycleNo: maxCycle._max.cycleNo ?? 0,
      currentLessonNo: existing.currentLessonNo,
    });

    // completed 였던 학생은 다시 진행 상태로 돌린다. 새 레코드를 만들지 않는다.
    const revived =
      existing.status === 'completed'
        ? await prisma.student.update({
            where: { id: existing.id },
            data: { status: 'pending' },
            select: { id: true, status: true },
          })
        : existing;

    return {
      id: revived.id,
      status: revived.status,
      duplicate: true,
      noteUrl: await magicLinkUrl(revived.id, input.teacherId),
      billing: {
        chargedNow: decision.chargedNow,
        firstChargeAtLessonNo: decision.firstChargeAtLessonNo,
      },
    };
  }

  const decision = resolveEnrollment(null);

  const data: Prisma.StudentUncheckedCreateInput = {
    teacherId: input.teacherId,
    name: input.name,
    nameKo: input.nameKo ?? null,
    emailHash,
    emailEnc: encryptEmail(input.email),
    l1Code: input.l1Code,
    countryCode: input.countryCode ?? null,
    platform: input.platform,
    platformUrl: input.platformUrl ?? null,
    goalTrack: input.goalTrack ?? null,
    status: 'pending',
  };

  const created = await prisma.student.create({ data, select: { id: true, status: true } });

  await prisma.auditLog.create({
    data: {
      actorType: 'teacher',
      actorId: input.teacherId,
      action: 'student.create',
      entity: 'students',
      entityId: created.id,
    },
  });

  return {
    id: created.id,
    status: created.status,
    duplicate: false,
    noteUrl: await magicLinkUrl(created.id, input.teacherId),
    billing: {
      chargedNow: decision.chargedNow,
      firstChargeAtLessonNo: decision.firstChargeAtLessonNo,
    },
  };
}

/** 학습노트 매직링크. 학생에게는 이 URL 만 나간다. */
export async function magicLinkUrl(studentId: bigint, teacherId: bigint): Promise<string> {
  const token = await signMagicLink({
    studentId: String(studentId),
    teacherId: String(teacherId),
  });
  return `${noteBaseUrl()}/verify?t=${token}`;
}

/**
 * 매직링크 클릭 — pending → active.
 * 이 순간 student_activity(kind='verify') 가 남고, 그게 과금 활성판정 (B) 조건의 첫 근거가 된다.
 */
export async function verifyStudent(studentId: bigint): Promise<{ verified: boolean }> {
  const prisma = db();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, status: true, verifiedAt: true },
  });
  if (!student) throw apiError('NOT_FOUND');

  if (student.verifiedAt) {
    // 이미 인증된 학생의 재방문. 활동만 남기고 상태는 건드리지 않는다.
    await recordActivity(studentId, 'note_open');
    return { verified: true };
  }

  await prisma.$transaction([
    prisma.student.update({
      where: { id: studentId },
      data: {
        verifiedAt: new Date(),
        // locked·dormant 인 학생을 인증만으로 active 로 올리지 않는다.
        ...(student.status === 'pending' ? { status: 'active' } : {}),
      },
    }),
    prisma.studentActivity.create({ data: { studentId, kind: 'verify' } }),
  ]);

  return { verified: true };
}

/** 과금 활성 판정 (B) 조건의 원천. 학생이 무엇을 하든 여기로 들어온다. */
export async function recordActivity(
  studentId: bigint,
  kind: 'verify' | 'srs' | 'hvpt' | 'fluency' | 'listen' | 'worksheet' | 'note_open',
  meta?: Record<string, unknown>,
): Promise<void> {
  await db().studentActivity.create({
    data: { studentId, kind, ...(meta ? { meta: meta as Prisma.InputJsonValue } : {}) },
  });
}

export async function listStudents(teacherId: bigint, status?: string) {
  return db().student.findMany({
    where: { teacherId, ...(status ? { status } : {}) },
    orderBy: [{ lastLessonAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      nameKo: true,
      l1Code: true,
      countryCode: true,
      platform: true,
      levelCode: true,
      status: true,
      currentLessonNo: true,
      lastLessonAt: true,
      verifiedAt: true,
    },
  });
}

/** 과정 종료 — 읽기전용 아카이브. 진행 중 주기는 즉시 종료하고 일할 계산하지 않는다(05번 §8-7). */
export async function completeStudent(teacherId: bigint, studentId: bigint) {
  const prisma = db();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { id: studentId } });
    if (!student || student.teacherId !== teacherId) throw apiError('NOT_FOUND');

    await tx.student.update({ where: { id: studentId }, data: { status: 'completed' } });
    await tx.billingCycle.updateMany({
      where: { studentId, status: 'open' },
      data: { status: 'waived_dormant', amount: 0, closedAt: now },
    });

    return { ok: true };
  });
}
