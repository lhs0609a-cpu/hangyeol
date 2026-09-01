import { studentNoteAccess } from '@hangyeol/billing';
import { addDays, type BillingStatus } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';

/**
 * 학생 학습노트 — 02번 문서 D, 화이트라벨.
 *
 * 이 파일이 내보내는 어떤 값에도 서비스명이 들어가면 안 된다.
 * 학생에게 존재하는 것은 "○○ 선생님의 학습 노트"뿐이다.
 */

export type SrsGrade = 'hard' | 'good' | 'easy';

/** 03번 문서 §5 SRS 스케줄 규칙. */
const MIN_EASE = 1.3;
const GRADUATE_STREAK = 3;

export interface SrsUpdate {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: Date;
  state: 'learning' | 'review' | 'graduated';
}

/**
 * 카드 한 장의 다음 간격을 계산한다. 순수 함수 — DB 도 시계도 없다.
 *
 *   어려움  ease −0.20   1일       (lapses += 1, learning 으로 되돌림)
 *   보통    ease −0.02   interval × 1.6
 *   쉬움    ease +0.10   interval × ease
 */
export function gradeCard(
  card: { ease: number; intervalDays: number; reps: number; lapses: number; easyStreak: number },
  grade: SrsGrade,
  now: Date,
): SrsUpdate & { easyStreak: number } {
  const reps = card.reps + 1;

  if (grade === 'hard') {
    const ease = Math.max(MIN_EASE, card.ease - 0.2);
    return {
      ease,
      intervalDays: 1,
      reps,
      lapses: card.lapses + 1,
      dueAt: addDays(now, 1),
      state: 'learning',
      easyStreak: 0,
    };
  }

  if (grade === 'good') {
    const ease = Math.max(MIN_EASE, card.ease - 0.02);
    const intervalDays = Math.max(1, Math.round(card.intervalDays * 1.6));
    return {
      ease,
      intervalDays,
      reps,
      lapses: card.lapses,
      dueAt: addDays(now, intervalDays),
      state: 'review',
      easyStreak: 0,
    };
  }

  const ease = card.ease + 0.1;
  const intervalDays = Math.max(1, Math.round(card.intervalDays * ease));
  const easyStreak = card.easyStreak + 1;
  return {
    ease,
    intervalDays,
    reps,
    lapses: card.lapses,
    dueAt: addDays(now, intervalDays),
    // 3회 연속 '쉬움' 이면 졸업. 더 묻지 않는다.
    state: easyStreak >= GRADUATE_STREAK ? 'graduated' : 'review',
    easyStreak,
  };
}

export async function dueCards(studentId: bigint, now = new Date()) {
  return db().vocabCard.findMany({
    where: { studentId, state: { not: 'graduated' }, dueAt: { lte: now } },
    orderBy: { dueAt: 'asc' },
    take: 20,
    select: { id: true, term: true, glossL1: true, example: true, audioKey: true },
  });
}

export async function applyGrade(studentId: bigint, cardId: bigint, grade: SrsGrade, now = new Date()) {
  const prisma = db();
  const card = await prisma.vocabCard.findUnique({ where: { id: cardId } });
  if (!card || card.studentId !== studentId) throw apiError('NOT_FOUND');

  // easyStreak 은 별도 컬럼이 없다. reps 대비 lapses 로 근사하지 않고,
  // '쉬움' 연속만 세면 되므로 state 가 review 이고 lapses 변화가 없을 때만 누적한다.
  const easyStreak = card.state === 'review' ? Math.max(0, card.reps - card.lapses) : 0;

  const next = gradeCard(
    {
      ease: Number(card.ease),
      intervalDays: card.intervalDays,
      reps: card.reps,
      lapses: card.lapses,
      easyStreak,
    },
    grade,
    now,
  );

  await prisma.$transaction([
    prisma.vocabCard.update({
      where: { id: cardId },
      data: {
        ease: next.ease,
        intervalDays: next.intervalDays,
        reps: next.reps,
        lapses: next.lapses,
        dueAt: next.dueAt,
        state: next.state,
      },
    }),
    prisma.studentActivity.create({ data: { studentId, kind: 'srs' } }),
  ]);

  return { dueAt: next.dueAt, state: next.state, intervalDays: next.intervalDays };
}

export interface NoteHome {
  teacherDisplayName: string;
  studentNameKo: string;
  streakDays: number;
  syllableProgress: { done: number; total: number };
  tasks: { id: string; label: string; sub: string; minutes: number; done: boolean }[];
  lastLesson: { date: string; expressions: string[]; correction: string | null } | null;
  access: ReturnType<typeof studentNoteAccess>;
}

/**
 * 학습노트 홈.
 *
 * 강사가 미납으로 잠겨도 학생 화면은 계속 돈다 (05번 §6, TC-10).
 * 학생은 잘못이 없다. 새 차시 자료만 막힌다.
 */
export async function noteHome(studentId: bigint, now = new Date()): Promise<NoteHome> {
  const prisma = db();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      nameKo: true,
      name: true,
      teacher: { select: { name: true, billingStatus: true } },
    },
  });
  if (!student) throw apiError('NOT_FOUND');

  const [due, activities, lastLesson] = await Promise.all([
    prisma.vocabCard.count({
      where: { studentId, state: { not: 'graduated' }, dueAt: { lte: now } },
    }),
    prisma.studentActivity.findMany({
      where: { studentId, occurredAt: { gte: addDays(now, -1) } },
      select: { kind: true },
    }),
    prisma.lesson.findFirst({
      where: { studentId, reportSubmittedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true, reportItems: { orderBy: { ord: 'asc' } } },
    }),
  ]);

  // 학생 도구는 복습 카드 하나다.
  // 수업은 강사가 실시간으로 하고, 학생이 혼자 하는 것은 잊지 않게 붙잡는 일뿐이다.
  // 이 하나가 student_activity 를 남겨 과금 활성 판정 (B) 조건을 채운다.
  const doneKinds = new Set(activities.map((a) => a.kind));
  const tasks = [
    {
      id: 'srs',
      label: '복습 카드',
      sub: due > 0 ? `${due}개` : '오늘은 없어요',
      minutes: 3,
      done: doneKinds.has('srs') || due === 0,
    },
  ];

  const errors = lastLesson?.reportItems.filter((i) => i.kind === 'error') ?? [];

  return {
    teacherDisplayName: student.teacher.name,
    studentNameKo: student.nameKo ?? student.name,
    streakDays: await streakDays(studentId, now),
    // 06번 §4.7 의 '한' 글자는 원래 오늘 과제 4개에 매여 있었다.
    // 과제가 하나로 줄었으니 기준을 주간 학습일로 옮긴다 —
    // 글자가 한 주에 걸쳐 완성되고, 그게 매일 돌아올 이유가 된다.
    syllableProgress: { done: await weeklyStudyDays(studentId, now), total: 4 },
    tasks,
    lastLesson: lastLesson
      ? {
          date: lastLesson.startedAt.toISOString().slice(0, 10),
          expressions: lastLesson.reportItems.filter((i) => i.kind === 'expression').map((i) => i.body),
          correction: errors[0]?.body ?? null,
        }
      : null,
    access: studentNoteAccess(student.teacher.billingStatus as BillingStatus),
  };
}

/** 이번 주에 복습한 날 수. 최대 4일까지 센다 — 그 이상은 글자가 이미 완성된다. */
async function weeklyStudyDays(studentId: bigint, now: Date): Promise<number> {
  const rows = await db().studentActivity.findMany({
    where: { studentId, occurredAt: { gte: addDays(now, -6) } },
    select: { occurredAt: true },
  });
  const days = new Set(rows.map((r) => r.occurredAt.toISOString().slice(0, 10)));
  return Math.min(4, days.size);
}

/** 연속 학습일. 학생 화면의 유일한 게이미피케이션이다. */
async function streakDays(studentId: bigint, now: Date): Promise<number> {
  const rows = await db().studentActivity.findMany({
    where: { studentId, occurredAt: { gte: addDays(now, -60) } },
    select: { occurredAt: true },
    orderBy: { occurredAt: 'desc' },
  });

  const days = new Set(rows.map((r) => r.occurredAt.toISOString().slice(0, 10)));
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    if (!days.has(addDays(now, -i).toISOString().slice(0, 10))) break;
    streak += 1;
  }
  return streak;
}
