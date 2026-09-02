import { addDays } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';
import { lastReport } from './lessons.js';

/*
 * 수업 예약과 오늘 수업 — 02번 문서 C-01·C-02, 07번 T-01.
 *
 * 예약은 수업이 아니다. lessons 는 실제로 시작해야 생기고,
 * 그 INSERT 가 2차시에서 과금 주기를 연다.
 * 예약을 lessons 에 섞으면 시작하지 않은 수업이 과금을 일으킨다.
 */

/** 15분 이내면 화면이 출발 패널로 바뀐다 (07번 T-01). */
export const IMMINENT_MINUTES = 15;

export interface TodayItem {
  studentId: string;
  name: string;
  nameKo: string;
  flag: string | null;
  l1Code: string;
  levelCode: string;
  nextLessonNo: number;
  status: string;
  scheduleId: string | null;
  scheduledAt: string | null;
  minutesUntil: number | null;
  /** 15분 이내. 프론트는 이때 출발 패널로 전환한다. */
  imminent: boolean;
  prev: { date: string; expressions: string[]; errors: string[] } | null;
  /** 복습 이행률. 0.5 미만이면 복습을 길게 잡으라고 경고한다. */
  srsCompletion: number;
}

export async function todayLessons(teacherId: bigint, now = new Date()): Promise<{ items: TodayItem[] }> {
  const prisma = db();

  // 오늘 남은 예약 + 지난 예약 중 아직 시작 안 한 것.
  const dayEnd = new Date(now);
  dayEnd.setUTCHours(dayEnd.getUTCHours() + 24);

  const schedules = await prisma.lessonSchedule.findMany({
    where: {
      teacherId,
      canceledAt: null,
      lessonId: null,
      scheduledAt: { gte: addDays(now, -1), lte: dayEnd },
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          nameKo: true,
          countryCode: true,
          l1Code: true,
          levelCode: true,
          currentLessonNo: true,
          status: true,
        },
      },
    },
  });

  const items: TodayItem[] = [];

  for (const s of schedules) {
    const minutesUntil = Math.round((s.scheduledAt.getTime() - now.getTime()) / 60_000);
    items.push({
      studentId: String(s.student.id),
      name: s.student.name,
      nameKo: s.student.nameKo ?? s.student.name,
      flag: s.student.countryCode,
      l1Code: s.student.l1Code,
      levelCode: s.student.levelCode,
      nextLessonNo: s.student.currentLessonNo + 1,
      status: s.student.status,
      scheduleId: String(s.id),
      scheduledAt: s.scheduledAt.toISOString(),
      minutesUntil,
      imminent: minutesUntil <= IMMINENT_MINUTES && minutesUntil >= -30,
      prev: await lastReport(s.student.id),
      srsCompletion: await srsCompletion(s.student.id, now),
    });
  }

  return { items };
}

/** 복습 이행률 — 지난 리포트 표현 중 실제로 복습한 비율. */
export async function srsCompletion(studentId: bigint, now = new Date()): Promise<number> {
  const prisma = db();
  const [due, done] = await Promise.all([
    prisma.vocabCard.count({ where: { studentId, state: { not: 'graduated' }, dueAt: { lte: now } } }),
    prisma.vocabCard.count({ where: { studentId, reps: { gt: 0 } } }),
  ]);
  const total = due + done;
  return total === 0 ? 1 : Math.round((done / total) * 100) / 100;
}

export async function createSchedule(params: {
  teacherId: bigint;
  studentId: bigint;
  scheduledAt: Date;
  durationMin?: number;
}) {
  const prisma = db();

  const student = await prisma.student.findUnique({ where: { id: params.studentId } });
  if (!student || student.teacherId !== params.teacherId) throw apiError('NOT_FOUND');

  // 같은 시각에 두 학생을 잡으면 강사가 한쪽을 놓친다.
  const clash = await prisma.lessonSchedule.findFirst({
    where: {
      teacherId: params.teacherId,
      canceledAt: null,
      scheduledAt: {
        gte: new Date(params.scheduledAt.getTime() - 30 * 60_000),
        lte: new Date(params.scheduledAt.getTime() + 30 * 60_000),
      },
    },
    include: { student: { select: { nameKo: true, name: true } } },
  });

  if (clash) {
    throw apiError(
      'VALIDATION_FAILED',
      `그 시간 근처에 ${clash.student.nameKo ?? clash.student.name} 학생 수업이 있습니다`,
    );
  }

  const created = await prisma.lessonSchedule.create({
    data: {
      teacherId: params.teacherId,
      studentId: params.studentId,
      scheduledAt: params.scheduledAt,
      durationMin: params.durationMin ?? 50,
    },
  });

  return { id: String(created.id), scheduledAt: created.scheduledAt.toISOString() };
}

export async function cancelSchedule(teacherId: bigint, scheduleId: bigint, now = new Date()) {
  const prisma = db();
  const schedule = await prisma.lessonSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.teacherId !== teacherId) throw apiError('NOT_FOUND');

  await prisma.lessonSchedule.update({ where: { id: scheduleId }, data: { canceledAt: now } });
  return { ok: true };
}

/** 수업이 시작되면 예약에 연결한다. 예약이 계속 오늘 목록에 남지 않게. */
export async function linkScheduleToLesson(params: {
  teacherId: bigint;
  studentId: bigint;
  lessonId: bigint;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  const prisma = db();

  // 지금 시각에 가장 가까운 미시작 예약을 찾는다.
  const schedule = await prisma.lessonSchedule.findFirst({
    where: {
      teacherId: params.teacherId,
      studentId: params.studentId,
      canceledAt: null,
      lessonId: null,
      scheduledAt: { gte: addDays(now, -1), lte: addDays(now, 1) },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  if (schedule) {
    await prisma.lessonSchedule.update({
      where: { id: schedule.id },
      data: { lessonId: params.lessonId },
    });
  }
}
