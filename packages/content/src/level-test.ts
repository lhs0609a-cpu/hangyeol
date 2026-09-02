/*
 * 레벨 테스트 — 02번 문서 B-06.
 *
 * "적응형 20문항 → TOPIK 1~6급 배정. 첫 수업 전에 완료."
 *
 * 왜 첫 수업 전인가: 레벨을 수업에서 재면 50분 중 20분이 날아간다.
 * 학생이 링크를 열었을 때 5분 안에 끝내고 오면 강사는 첫 수업부터 가르친다.
 *
 * 적응형으로 만든 이유: 20문항을 고정으로 내면 1급 학생이 5급 문제를 15개 풀고
 * 좌절한다. 맞히면 올리고 틀리면 내려서, 학생이 자기 수준 근처에서만 푼다.
 *
 * ※ AI 초안. 한국어교원 자격 2급 검수 필요.
 */

export interface LevelQuestion {
  id: string;
  /** 이 문항이 변별하는 급. */
  level: number;
  /** 무엇을 묻는가. 오답 분석에 쓴다. */
  target: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
}

const q = (
  id: string,
  level: number,
  target: string,
  prompt: string,
  choices: string[],
  answerIndex: number,
): LevelQuestion => ({ id, level, target, prompt, choices, answerIndex });

/**
 * 급별 문항. 각 급에서 뽑아 쓰므로 급마다 여유 있게 둔다.
 *
 * 문항은 "아는가"가 아니라 "쓸 수 있는가"를 본다.
 * 문법 용어를 묻지 않는다 — 학생은 용어를 몰라도 말할 수 있다.
 */
export const LEVEL_QUESTIONS: readonly LevelQuestion[] = Object.freeze([
  // ── 1급 ────────────────────────────────────────────────
  q('L1-1', 1, '이에요/예요', '저는 학생___.', ['이에요', '예요', '있어요', '해요'], 0),
  q('L1-2', 1, '있어요/없어요', '시간 ___? 네, 있어요.', ['이에요', '있어요', '해요', '가요'], 1),
  q('L1-3', 1, '-아/어요', '저는 밥을 ___.', ['먹다', '먹어요', '먹었어요', '먹을 거예요'], 1),
  q('L1-4', 1, '이/가', '날씨___ 좋아요.', ['를', '가', '에', '도'], 1),
  q('L1-5', 1, '을/를', '커피___ 마셔요.', ['가', '를', '에서', '도'], 1),
  q('L1-6', 1, '에/에서', '학교___ 공부해요.', ['에', '에서', '를', '도'], 1),
  q('L1-7', 1, '안 부정', '오늘은 학교에 ___ 가요.', ['안', '못', '아니', '없'], 0),
  q('L1-8', 1, '-았/었어요', '어제 친구를 ___.', ['만나요', '만났어요', '만날 거예요', '만나다'], 1),
  q('L1-9', 1, '-고 싶어요', '한국에 ___.', ['가요', '갔어요', '가고 싶어요', '가세요'], 2),
  q('L1-10', 1, '-(으)세요', '여기 ___.', ['앉아요', '앉으세요', '앉았어요', '앉고'], 1),

  // ── 2급 ────────────────────────────────────────────────
  q('L2-1', 2, '-아/어서', '바빠___ 못 갔어요.', ['고', '서', '지만', '면'], 1),
  q('L2-2', 2, '-지만', '비싸___ 맛있어요.', ['고', '서', '지만', '니까'], 2),
  q('L2-3', 2, '-(으)ㄹ 때', '밥을 먹___ 이야기해요.', ['을 때', '어서', '지만', '고'], 0),
  q('L2-4', 2, '-(으)면', '시간이 있___ 만나요.', ['어서', '으면', '지만', '고'], 1),
  q('L2-5', 2, '-(으)ㄴ 후에', '숙제를 한 ___ 놀아요.', ['후에', '전에', '때', '동안'], 0),
  q('L2-6', 2, '-는 것', '한국어를 배우___ 재미있어요.', ['는 것이', '어서', '지만', '면'], 0),
  q('L2-7', 2, '-아/어 본 적', '제주도에 가 ___ 있어요.', ['본 적이', '는 것이', '을 때', '으면'], 0),
  q('L2-8', 2, '-(으)려고', '한국에 가___ 돈을 모아요.', ['려고', '어서', '지만', '면'], 0),

  // ── 3급 ────────────────────────────────────────────────
  q('L3-1', 3, '-(으)ㄴ데', '비가 오___ 우산이 없어요.', ['는데', '아서', '으면', '고'], 0),
  q('L3-2', 3, '-게 되다', '한국에 살___ 됐어요.', ['게', '어서', '지만', '고'], 0),
  q('L3-3', 3, '-는 편이다', '저는 조용한 ___.', ['편이에요', '것이에요', '때예요', '뿐이에요'], 0),
  q('L3-4', 3, '-곤 하다', '주말에는 산에 가___ 해요.', ['곤', '어서', '지만', '려고'], 0),
  q('L3-5', 3, '-(으)ㄹ 줄 알다', '운전할 ___ 알아요.', ['줄', '것', '때', '수'], 0),
  q('L3-6', 3, '-에 비해', '작년___ 올해가 더워요.', ['에 비해', '에게', '에서', '까지'], 0),

  // ── 4급 ────────────────────────────────────────────────
  q('L4-1', 4, '-(으)ㅁ에 따라', '기술이 발전___ 생활이 바뀌었어요.', ['함에 따라', '해서', '하지만', '하면'], 0),
  q('L4-2', 4, '-(으)ㄹ 뿐만 아니라', '싸___ 품질도 좋아요.', ['ㄹ 뿐만 아니라', '아서', '지만', '면'], 0),
  q('L4-3', 4, '-더라도', '어렵___ 포기하지 마세요.', ['더라도', '어서', '으면', '고'], 0),
  q('L4-4', 4, '-(으)로 인해', '태풍___ 항공편이 취소됐어요.', ['으로 인해', '에게', '에서', '까지'], 0),
  q('L4-5', 4, '-기 마련이다', '실수는 하___ 마련이에요.', ['기', '는 것', '을 때', '면'], 0),

  // ── 5·6급 ──────────────────────────────────────────────
  q('L5-1', 5, '-(으)ㅁ에도 불구하고', '노력했___ 결과가 나빴어요.', ['음에도 불구하고', '어서', '지만', '으면'], 0),
  q('L5-2', 5, '-는 셈이다', '거의 다 끝난 ___.', ['셈이에요', '것이에요', '때예요', '뿐이에요'], 0),
  q('L5-3', 5, '-(으)ㄹ 법하다', '그럴 ___ 이야기예요.', ['법한', '만한', '뻔한', '듯한'], 0),
  q('L6-1', 6, '-기에 망정이지', '미리 알았___ 큰일 날 뻔했어요.', ['기에 망정이지', '어서', '지만', '으면'], 0),
  q('L6-2', 6, '-(으)ㄴ 나머지', '너무 놀란 ___ 말을 못 했어요.', ['나머지', '까닭에', '탓에', '덕분에'], 0),
]);

export const LEVEL_TEST_LENGTH = 20;
export const MAX_LEVEL = 6;
export const MIN_LEVEL = 1;

export interface TestState {
  /** 지금 추정하는 급. 답할 때마다 움직인다. */
  level: number;
  asked: string[];
  correct: number;
  /** 틀린 문항의 target. 강사가 어디서 막혔는지 본다. */
  missed: string[];
}

export const INITIAL_TEST_STATE: TestState = { level: 2, asked: [], correct: 0, missed: [] };

/**
 * 다음 문항을 고른다.
 *
 * 현재 추정 급에서 안 낸 문항을 우선 쓰고, 없으면 인접 급으로 넓힌다.
 * 순수 함수다 — 같은 상태에 같은 난수면 같은 문항이 나온다.
 */
export function nextQuestion(state: TestState, random: () => number = Math.random): LevelQuestion | null {
  if (state.asked.length >= LEVEL_TEST_LENGTH) return null;

  const asked = new Set(state.asked);

  // 추정 급에서 시작해 한 칸씩 넓혀 간다.
  for (let spread = 0; spread <= MAX_LEVEL; spread += 1) {
    const levels = [state.level - spread, state.level + spread].filter(
      (l) => l >= MIN_LEVEL && l <= MAX_LEVEL,
    );
    const pool = LEVEL_QUESTIONS.filter((x) => levels.includes(x.level) && !asked.has(x.id));
    if (pool.length > 0) return pool[Math.floor(random() * pool.length)]!;
  }

  return null;
}

/**
 * 답을 반영한다.
 *
 * 맞히면 올리고 틀리면 내린다. 한 칸씩 움직이는 이유는
 * 한 문항의 우연이 결과를 통째로 흔들지 않게 하기 위해서다.
 */
export function applyAnswer(state: TestState, question: LevelQuestion, choiceIndex: number): TestState {
  const isCorrect = choiceIndex === question.answerIndex;

  return {
    level: isCorrect
      ? Math.min(MAX_LEVEL, state.level + 1)
      : Math.max(MIN_LEVEL, state.level - 1),
    asked: [...state.asked, question.id],
    correct: state.correct + (isCorrect ? 1 : 0),
    missed: isCorrect ? state.missed : [...state.missed, question.target],
  };
}

export interface LevelResult {
  levelCode: string;
  level: number;
  correct: number;
  asked: number;
  /** 반복해서 틀린 문법. 강사가 첫 수업에서 확인할 것. */
  weakPoints: string[];
  /** 이 급에서 몇 차시부터 시작하면 되는가. */
  startUnitNo: number;
}

/** 급별 시작 차시 — 08번 문서 §1 의 구간. */
const LEVEL_START_UNIT: Record<number, number> = {
  1: 1,
  2: 31,
  3: 71,
  4: 121,
  5: 171,
  6: 211,
};

/**
 * 최종 급을 정한다.
 *
 * 마지막 추정 급을 그대로 쓰지 않고 정답률로 보정한다.
 * 적응형은 끝에서 한 문항 운으로 급이 갈릴 수 있기 때문이다.
 */
export function finalize(state: TestState): LevelResult {
  const rate = state.asked.length === 0 ? 0 : state.correct / state.asked.length;

  // 정답률이 낮으면 한 급 내린다. 높게 잡아 학생을 좌절시키는 쪽이 더 나쁘다.
  const adjusted =
    rate < 0.4 ? state.level - 1 : rate > 0.8 ? state.level : state.level;
  const level = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, adjusted));

  // 두 번 이상 틀린 문법만 약점으로 본다. 한 번은 실수일 수 있다.
  const counts = new Map<string, number>();
  for (const m of state.missed) counts.set(m, (counts.get(m) ?? 0) + 1);
  const weakPoints = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([target]) => target);

  return {
    levelCode: `topik${level}`,
    level,
    correct: state.correct,
    asked: state.asked.length,
    weakPoints: weakPoints.length > 0 ? weakPoints : [...new Set(state.missed)].slice(0, 3),
    startUnitNo: LEVEL_START_UNIT[level] ?? 1,
  };
}

export const LEVEL_TEST_STATUS = {
  questions: LEVEL_QUESTIONS.length,
  length: LEVEL_TEST_LENGTH,
  note: 'AI 초안. 한국어교원 자격 2급 검수 필요. 문항은 문법 용어가 아니라 사용 능력을 묻는다',
} as const;
