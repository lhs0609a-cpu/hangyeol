import {
  applyAnswer,
  finalize,
  INITIAL_TEST_STATE,
  LEVEL_QUESTIONS,
  LEVEL_TEST_LENGTH,
  nextQuestion,
  type LevelResult,
  type TestState,
} from '@hangyeol/content';
import type { Prisma } from '@hangyeol/db';
import { apiError } from './errors.js';
import { db } from './guard.js';

/*
 * 레벨 테스트 — 02번 문서 B-06.
 *
 * 상태를 서버에 두지 않고 매 요청에 실어 보낸다.
 * 학생이 중간에 창을 닫아도 세션이 새지 않고, 서버에 임시 테이블이 필요 없다.
 * 대신 상태를 그대로 믿으면 조작이 가능하므로 서버에서 채점한다 —
 * 클라이언트는 어느 문항을 골랐는지만 보낸다.
 */

export interface NextQuestionResponse {
  done: boolean;
  progress: { asked: number; total: number };
  question: {
    id: string;
    prompt: string;
    choices: string[];
  } | null;
  state: TestState;
}

export function startTest(): NextQuestionResponse {
  return serveNext(INITIAL_TEST_STATE);
}

function serveNext(state: TestState): NextQuestionResponse {
  const q = nextQuestion(state);

  if (!q || state.asked.length >= LEVEL_TEST_LENGTH) {
    return {
      done: true,
      progress: { asked: state.asked.length, total: LEVEL_TEST_LENGTH },
      question: null,
      state,
    };
  }

  return {
    done: false,
    progress: { asked: state.asked.length, total: LEVEL_TEST_LENGTH },
    // 정답 인덱스를 내려보내지 않는다. 채점은 서버가 한다.
    question: { id: q.id, prompt: q.prompt, choices: q.choices },
    state,
  };
}

export function answerQuestion(state: TestState, questionId: string, choiceIndex: number): NextQuestionResponse {
  const q = LEVEL_QUESTIONS.find((x) => x.id === questionId);
  if (!q) throw apiError('VALIDATION_FAILED', '없는 문항입니다');

  if (state.asked.includes(questionId)) {
    // 같은 문항을 두 번 답하면 정답률이 조작된다.
    throw apiError('VALIDATION_FAILED', '이미 답한 문항입니다');
  }

  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= q.choices.length) {
    throw apiError('VALIDATION_FAILED', '선택지 범위를 벗어났습니다');
  }

  return serveNext(applyAnswer(state, q, choiceIndex));
}

export interface SavedLevelResult extends LevelResult {
  saved: true;
}

/**
 * 결과를 저장하고 학생의 레벨을 배정한다.
 *
 * 이미 테스트를 마친 학생이 다시 보면 새 기록을 남긴다 —
 * 레벨은 바뀔 수 있고, 언제 어떻게 바뀌었는지가 강사에게 필요하다.
 */
export async function saveLevelResult(studentId: bigint, state: TestState): Promise<SavedLevelResult> {
  if (state.asked.length < LEVEL_TEST_LENGTH) {
    throw apiError('VALIDATION_FAILED', `${LEVEL_TEST_LENGTH}문항을 모두 풀어야 합니다`);
  }

  const result = finalize(state);
  const prisma = db();

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw apiError('NOT_FOUND');

  await prisma.$transaction([
    prisma.levelTest.create({
      data: {
        studentId,
        levelCode: result.levelCode,
        correct: result.correct,
        asked: result.asked,
        answers: { asked: state.asked, missed: state.missed } as Prisma.InputJsonValue,
      },
    }),
    prisma.student.update({ where: { id: studentId }, data: { levelCode: result.levelCode } }),
    // 레벨 테스트도 학생 활동이다. 과금 활성 판정 (B) 조건을 채운다.
    prisma.studentActivity.create({
      data: { studentId, kind: 'worksheet', meta: { levelTest: result.levelCode } },
    }),
  ]);

  return { ...result, saved: true };
}

/** 강사 화면에서 보는 최근 결과. */
export async function latestLevelTest(studentId: bigint) {
  const row = await db().levelTest.findFirst({
    where: { studentId },
    orderBy: { completedAt: 'desc' },
  });
  if (!row) return null;

  const answers = row.answers as { missed?: string[] } | null;
  return {
    levelCode: row.levelCode,
    correct: row.correct,
    asked: row.asked,
    weakPoints: [...new Set(answers?.missed ?? [])].slice(0, 5),
    completedAt: row.completedAt.toISOString(),
  };
}
