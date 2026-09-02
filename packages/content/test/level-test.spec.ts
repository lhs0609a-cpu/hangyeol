import { describe, expect, it } from 'vitest';
import {
  applyAnswer,
  finalize,
  INITIAL_TEST_STATE,
  LEVEL_QUESTIONS,
  LEVEL_TEST_LENGTH,
  MAX_LEVEL,
  MIN_LEVEL,
  nextQuestion,
  type TestState,
} from '@hangyeol/content';

/*
 * 레벨 테스트는 학생이 처음 만나는 화면이다.
 * 여기서 5급 문제를 15개 받으면 그 학생은 돌아오지 않는다.
 * 적응이 실제로 되는지를 기계가 지킨다.
 */

function answerAll(correctness: (q: { level: number }) => boolean): TestState {
  let state = INITIAL_TEST_STATE;
  for (let i = 0; i < LEVEL_TEST_LENGTH; i += 1) {
    const q = nextQuestion(state, () => 0);
    if (!q) break;
    const choice = correctness(q) ? q.answerIndex : (q.answerIndex + 1) % q.choices.length;
    state = applyAnswer(state, q, choice);
  }
  return state;
}

describe('문항 은행', () => {
  it('id 가 유일하다', () => {
    const ids = LEVEL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('정답 인덱스가 선택지 범위 안에 있다', () => {
    for (const q of LEVEL_QUESTIONS) {
      expect(q.answerIndex, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex, q.id).toBeLessThan(q.choices.length);
    }
  });

  it('선택지가 최소 3개다 — 2개면 찍어서 맞을 확률이 너무 높다', () => {
    for (const q of LEVEL_QUESTIONS) {
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('선택지에 중복이 없다', () => {
    for (const q of LEVEL_QUESTIONS) {
      expect(new Set(q.choices).size, q.id).toBe(q.choices.length);
    }
  });

  it('20문항을 낼 만큼 있다', () => {
    expect(LEVEL_QUESTIONS.length).toBeGreaterThanOrEqual(LEVEL_TEST_LENGTH);
  });

  it('1~6급이 모두 있다', () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
      expect(LEVEL_QUESTIONS.some((q) => q.level === level), `${level}급 문항 없음`).toBe(true);
    }
  });
});

describe('적응 — 맞히면 올라가고 틀리면 내려간다', () => {
  it('다 맞히면 최고급에 도달한다', () => {
    const state = answerAll(() => true);
    expect(state.level).toBe(MAX_LEVEL);
    expect(state.correct).toBe(state.asked.length);
  });

  it('다 틀리면 최저급으로 내려간다', () => {
    const state = answerAll(() => false);
    expect(state.level).toBe(MIN_LEVEL);
    expect(state.correct).toBe(0);
  });

  it('같은 문항을 두 번 내지 않는다', () => {
    const state = answerAll((q) => q.level <= 2);
    expect(new Set(state.asked).size).toBe(state.asked.length);
  });

  it('20문항에서 멈춘다', () => {
    const state = answerAll((q) => q.level <= 2);
    expect(state.asked.length).toBeLessThanOrEqual(LEVEL_TEST_LENGTH);
    expect(nextQuestion({ ...state, asked: new Array(LEVEL_TEST_LENGTH).fill('x') })).toBeNull();
  });

  it('급 경계를 벗어나지 않는다', () => {
    let state = INITIAL_TEST_STATE;
    for (let i = 0; i < 40; i += 1) {
      const q = nextQuestion(state, () => 0);
      if (!q) break;
      state = applyAnswer(state, q, q.answerIndex);
      expect(state.level).toBeLessThanOrEqual(MAX_LEVEL);
      expect(state.level).toBeGreaterThanOrEqual(MIN_LEVEL);
    }
  });
});

describe('최종 배정', () => {
  it('다 맞히면 높은 급이 나온다', () => {
    expect(finalize(answerAll(() => true)).level).toBeGreaterThanOrEqual(5);
  });

  it('다 틀리면 1급이다', () => {
    const result = finalize(answerAll(() => false));
    expect(result.level).toBe(MIN_LEVEL);
    expect(result.startUnitNo).toBe(1);
  });

  it('정답률이 낮으면 한 급 내린다 — 높게 잡아 좌절시키는 쪽이 더 나쁘다', () => {
    const lucky: TestState = { level: 4, asked: new Array(20).fill('x'), correct: 5, missed: [] };
    expect(finalize(lucky).level).toBeLessThan(4);
  });

  it('급마다 시작 차시가 정해져 있다', () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
      const state: TestState = { level, asked: new Array(20).fill('x'), correct: 14, missed: [] };
      expect(finalize(state).startUnitNo).toBeGreaterThan(0);
    }
  });

  it('두 번 이상 틀린 문법을 약점으로 뽑는다', () => {
    const state: TestState = {
      level: 2,
      asked: new Array(20).fill('x'),
      correct: 10,
      missed: ['이/가', '이/가', '을/를'],
    };
    expect(finalize(state).weakPoints[0]).toBe('이/가');
  });
});
