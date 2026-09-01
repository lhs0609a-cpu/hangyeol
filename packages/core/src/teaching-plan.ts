import { LESSON_FRAME, planFor, type LessonPlan } from '@hangyeol/content';
import { addDays } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';

/*
 * 교수 플랜 — 강사에게 "이 학생에게 지금 무엇을 해야 하는가"를 준다.
 *
 * 교재만 주면 강사는 여전히 판단해야 한다. 이 학생이 어디서 막혔는지,
 * 오늘 복습을 길게 잡아야 하는지, 다음 차시로 넘어가도 되는지.
 * 그 판단을 대신 해 주는 것이 "교재 없이는 감도 안 오는" 상태를 만든다.
 *
 * 근거는 전부 우리가 이미 갖고 있는 데이터다.
 *   · 직전 리포트의 표현·오류        → 복습 항목
 *   · 반복해서 등장한 오류           → 중점 교정
 *   · 통과/재수행 이력               → 진도 판단
 *   · 학생 활동 유무                 → 복습 길이 조정
 *   · 공백 일수                      → 복귀 모드
 *
 * 외부 API 를 부르지 않는다. 종량과금이 학생 수에 비례해 늘지 않아야 한다.
 */

/** 2주 이상 공백이면 다음 수업은 복습 모드로 바꾼다 (02번 문서 C-10). */
export const GAP_DAYS_FOR_RECOVERY = 14;

/** 복습 이행률이 이 아래면 복습을 길게 잡으라고 경고한다 (07번 T-02 단계 0). */
export const LOW_SRS_COMPLETION = 0.5;

export type PlanMode = 'normal' | 'recovery' | 'first_lesson' | 'repeat';

export interface TimeAllocation {
  phase: string;
  label: string;
  minutes: number;
  /** 기본 배분에서 바뀌었으면 왜 바뀌었는지. */
  adjustedBecause?: string;
}

export interface FocusPoint {
  /** 무엇을 고칠 것인가. */
  item: string;
  /** 몇 번 나왔는가. 반복될수록 우선순위가 높다. */
  occurrences: number;
  /** 강사가 그 자리에서 쓸 수 있는 교정 방법. */
  howToFix: string;
}

export interface TeachingPlan {
  studentId: string;
  studentName: string;
  nextLessonNo: number;
  mode: PlanMode;
  /** 왜 이 모드인가. 강사가 납득해야 따른다. */
  modeReason: string;
  unit: { unitNo: number; title: string; goalStatement: string } | null;
  plan: LessonPlan | null;
  allocation: TimeAllocation[];
  /** 오늘 복습할 것. 직전 리포트에서 그대로 온다 — 강사가 만들지 않는다. */
  reviewItems: string[];
  /** 반복 오류. 오늘 집중할 지점. */
  focus: FocusPoint[];
  /** 이 학생의 모국어에서 특히 주의할 점. */
  l1Note: string | null;
  /** 이 차시에서 강사가 흔히 하는 실수. */
  pitfalls: string[];
  /** 통과 판정 기준. 이걸 말하면 다음 차시로 간다. */
  exitTicket: string[];
  /** 강사에게 보여줄 한 줄 요약. */
  headline: string;
}

/** 조사 오류는 발달 단계다. 매번 고치면 발화가 죽는다 (08번 §11). */
const PARTICLE_PATTERN = /(을|를|이|가|은|는|에|에서|도|만)\s*→/;

function howToFix(errorText: string): string {
  if (PARTICLE_PATTERN.test(errorText)) {
    return '조사 오류는 발달 단계입니다. 말하기 중에는 넘어가고, 마무리 5분에 한 번만 짚으세요.';
  }
  if (/[ㄱ-ㅎㅏ-ㅣ]/.test(errorText)) {
    return '발음 항목입니다. 입 모양이나 혀 위치를 보여주고 세 번 따라 하게 하세요.';
  }
  return '문장 전체를 다시 말하게 하세요. 고친 형태를 강사가 먼저 한 번 들려줍니다.';
}

/**
 * 시간 배분을 학생 상태에 맞춰 조정한다.
 *
 * 기본은 08번 문서의 50분 고정 틀이다.
 * 복습 이행률이 낮거나 공백이 길면 복습을 늘리고 본 차시를 줄인다 —
 * 진도를 지키는 것보다 학생이 따라오는 것이 먼저다.
 */
function allocate(mode: PlanMode, srsCompletion: number): TimeAllocation[] {
  const base = LESSON_FRAME.map((f) => ({
    phase: f.phase as string,
    label: f.label as string,
    minutes: f.toMin - f.fromMin,
  }));

  if (mode === 'recovery') {
    return base.map((b) =>
      b.phase === 'review'
        ? { ...b, minutes: 10, adjustedBecause: '2주 이상 공백 — 복습을 10분으로 늘립니다' }
        : b.phase === 'drill'
          ? { ...b, minutes: 5, adjustedBecause: '복습에 시간을 넘겼습니다' }
          : b.phase === 'free'
            ? { ...b, minutes: 5, adjustedBecause: '복습에 시간을 넘겼습니다' }
            : b,
    );
  }

  if (mode === 'first_lesson') {
    return base.map((b) =>
      b.phase === 'review'
        ? { ...b, minutes: 3, adjustedBecause: '첫 수업 — 복습할 것이 없습니다' }
        : b.phase === 'roleplay'
          ? { ...b, minutes: 15, adjustedBecause: '첫 수업은 성취 경험이 목적입니다' }
          : b,
    );
  }

  if (srsCompletion < LOW_SRS_COMPLETION) {
    return base.map((b) =>
      b.phase === 'review'
        ? {
            ...b,
            minutes: 8,
            adjustedBecause: `복습 카드 이행률 ${Math.round(srsCompletion * 100)}% — 복습을 길게 잡으세요`,
          }
        : b.phase === 'free'
          ? { ...b, minutes: 7, adjustedBecause: '복습에 시간을 넘겼습니다' }
          : b,
    );
  }

  return base;
}

export async function teachingPlan(
  teacherId: bigint,
  studentId: bigint,
  now = new Date(),
): Promise<TeachingPlan> {
  const prisma = db();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      teacherId: true,
      name: true,
      nameKo: true,
      l1Code: true,
      currentLessonNo: true,
      lastLessonAt: true,
    },
  });
  if (!student || student.teacherId !== teacherId) throw apiError('NOT_FOUND');

  const [lastLesson, recentErrors, dueCards, doneCards] = await Promise.all([
    prisma.lesson.findFirst({
      where: { studentId, reportSubmittedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      select: { outcome: true, unitId: true, reportItems: { orderBy: { ord: 'asc' } } },
    }),
    // 최근 5회 수업의 오류를 모아 반복되는 것을 찾는다.
    prisma.lessonReportItem.findMany({
      where: { kind: 'error', lesson: { studentId } },
      orderBy: { id: 'desc' },
      take: 30,
      select: { body: true },
    }),
    prisma.vocabCard.count({ where: { studentId, state: { not: 'graduated' }, dueAt: { lte: now } } }),
    prisma.vocabCard.count({ where: { studentId, reps: { gt: 0 } } }),
  ]);

  const totalCards = dueCards + doneCards;
  const srsCompletion = totalCards === 0 ? 1 : doneCards / totalCards;

  const gapDays = student.lastLessonAt
    ? Math.floor((now.getTime() - student.lastLessonAt.getTime()) / 86_400_000)
    : 0;

  // 재수행이면 같은 차시를 다시 한다. 통과 못 했는데 넘어가지 않는다.
  const repeat = lastLesson?.outcome === 'repeat';
  const nextLessonNo = repeat ? student.currentLessonNo : student.currentLessonNo + 1;

  const mode: PlanMode =
    student.currentLessonNo === 0
      ? 'first_lesson'
      : repeat
        ? 'repeat'
        : gapDays >= GAP_DAYS_FOR_RECOVERY
          ? 'recovery'
          : 'normal';

  const modeReason = {
    first_lesson: '첫 수업입니다. 복습이 없고 성취 경험이 목적입니다.',
    repeat: '지난 수업이 재수행이었습니다. 같은 차시를 다시 합니다 — 통과 못 했는데 넘어가지 않습니다.',
    recovery: `${gapDays}일 공백입니다. 복습 10분 모드로 시작하세요.`,
    normal: '정상 진행입니다.',
  }[mode];

  const unit = await prisma.curriculumUnit.findUnique({
    where: { unitNo: nextLessonNo },
    select: { unitNo: true, title: true, goalStatement: true },
  });

  const plan = planFor(nextLessonNo);

  // 반복 오류를 센다. 같은 오류가 두 번 이상이면 중점 교정 대상이다.
  const counts = new Map<string, number>();
  for (const e of recentErrors) counts.set(e.body, (counts.get(e.body) ?? 0) + 1);

  const focus: FocusPoint[] = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([item, occurrences]) => ({ item, occurrences, howToFix: howToFix(item) }));

  const reviewItems =
    lastLesson?.reportItems.filter((i) => i.kind === 'expression').map((i) => i.body) ?? [];

  const headline =
    mode === 'first_lesson'
      ? '첫 수업 — 30분 안에 이름을 한글로 쓰게 하세요'
      : mode === 'repeat'
        ? `${nextLessonNo}차시 재수행 — 지난번 통과 못 한 지점부터`
        : mode === 'recovery'
          ? `${gapDays}일 만입니다 — 복습 10분부터`
          : srsCompletion < LOW_SRS_COMPLETION
            ? `복습 이행률 ${Math.round(srsCompletion * 100)}% — 복습을 길게 잡으세요`
            : `${nextLessonNo}차시 — ${unit?.goalStatement ?? '정상 진행'}`;

  return {
    studentId: String(student.id),
    studentName: student.nameKo ?? student.name,
    nextLessonNo,
    mode,
    modeReason,
    unit,
    plan,
    allocation: allocate(mode, srsCompletion),
    reviewItems,
    focus,
    l1Note: plan?.l1Notes[student.l1Code as keyof typeof plan.l1Notes] ?? null,
    pitfalls: plan?.teacherPitfalls ?? [],
    exitTicket: plan?.exitTicket ?? [],
    headline,
  };
}

/**
 * 학습 계획 — 이 학생이 한국어를 마스터하려면 앞으로 무엇을 해야 하는가.
 *
 * 차시 하나가 아니라 궤적을 본다. 강사가 학생에게 보여줄 수 있어야 한다.
 */
export interface MasteryPlan {
  currentLessonNo: number;
  levelCode: string;
  /** 지금 속도로 다음 급까지 몇 주 남았는가. */
  weeksToNextLevel: number | null;
  lessonsPerWeek: number;
  vocabTotal: number;
  /** 지금 잡아야 할 것. 우선순위 순. */
  priorities: { title: string; why: string; action: string }[];
}

export async function masteryPlan(
  teacherId: bigint,
  studentId: bigint,
  now = new Date(),
): Promise<MasteryPlan> {
  const prisma = db();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, teacherId: true, levelCode: true, currentLessonNo: true, firstLessonAt: true },
  });
  if (!student || student.teacherId !== teacherId) throw apiError('NOT_FOUND');

  const [vocabTotal, lessonCount, unreviewed] = await Promise.all([
    prisma.vocabCard.count({ where: { studentId } }),
    prisma.lesson.count({ where: { studentId } }),
    prisma.vocabCard.count({ where: { studentId, reps: 0, dueAt: { lte: addDays(now, -3) } } }),
  ]);

  const weeksElapsed = student.firstLessonAt
    ? Math.max(1, (now.getTime() - student.firstLessonAt.getTime()) / (7 * 86_400_000))
    : 1;
  const lessonsPerWeek = Math.round((lessonCount / weeksElapsed) * 10) / 10;

  // 1급 30차시 기준. 다음 급까지 남은 차시를 현재 속도로 나눈다.
  const levelEnd = { topik1: 30, topik2: 70, topik3: 120, topik4: 170, topik5: 210, topik6: 250 }[
    student.levelCode
  ];
  const remaining = levelEnd ? levelEnd - student.currentLessonNo : null;
  const weeksToNextLevel =
    remaining !== null && lessonsPerWeek > 0 ? Math.ceil(remaining / lessonsPerWeek) : null;

  const priorities: MasteryPlan['priorities'] = [];

  if (unreviewed > 5) {
    priorities.push({
      title: '복습이 밀려 있습니다',
      why: `3일 이상 손대지 않은 카드가 ${unreviewed}장입니다. 망각이 학습보다 빠른 상태입니다.`,
      action: '다음 수업 복습을 10분으로 늘리고, 학생에게 하루 3분만 쓰라고 말하세요.',
    });
  }

  if (lessonsPerWeek < 0.8) {
    priorities.push({
      title: '수업 간격이 넓습니다',
      why: `주 ${lessonsPerWeek}회입니다. 간격이 넓으면 지난 시간 것을 다시 세우는 데 수업이 소모됩니다.`,
      action: '주 1회를 최소선으로 제안하세요. 어려우면 수업을 30분으로 줄이고 횟수를 늘립니다.',
    });
  }

  if (vocabTotal > 0 && student.currentLessonNo > 0) {
    const perLesson = vocabTotal / student.currentLessonNo;
    if (perLesson > 4.5) {
      priorities.push({
        title: '한 수업에 표현을 너무 많이 넣고 있습니다',
        why: `차시당 평균 ${perLesson.toFixed(1)}개입니다. 50분에 12개를 넣으면 1주 뒤 3개가 남습니다.`,
        action: '리포트에 3개만 넣으세요. 다음 주에 반드시 기억해야 할 것만.',
      });
    }
  }

  if (priorities.length === 0) {
    priorities.push({
      title: '지금 속도가 좋습니다',
      why: `주 ${lessonsPerWeek}회, 누적 어휘 ${vocabTotal}개. 복습도 따라오고 있습니다.`,
      action: '유지하세요. 학생에게 진도 그래프를 보여주면 동기가 유지됩니다.',
    });
  }

  return {
    currentLessonNo: student.currentLessonNo,
    levelCode: student.levelCode,
    weeksToNextLevel,
    lessonsPerWeek,
    vocabTotal,
    priorities,
  };
}
