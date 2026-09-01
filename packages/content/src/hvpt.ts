/*
 * HVPT 음원 매니페스트 — 08번 문서 §3.
 *
 * 필수 3요건을 지키지 않으면 HVPT 가 아니다.
 *   ① 화자 다양성      같은 소리를 화자 8명 목소리로
 *   ② 음성맥락 다양성  isolated / word_initial / word_medial / sentence
 *   ③ 즉각 교정 피드백  오답 → 정답 공개 → 즉시 재생 → 재시도
 *
 * 이 파일은 "무엇을 만들어야 하는가"의 목록이다.
 * 실제 mp3 는 tools/tts-batch 가 사전 생성해 R2 에 올린다.
 * 런타임 TTS 호출은 금지다 — 학생 수에 비례하는 종량과금을 만들지 않는다.
 */

export const TALKER_COUNT = 8;

export const CONTEXTS = ['isolated', 'word_initial', 'word_medial', 'sentence'] as const;
export type HvptContext = (typeof CONTEXTS)[number];

export interface ContrastDraft {
  id: string;
  label: string;
  note: string;
  tokens: string[];
  /** 값이 작을수록 그 모국어 화자에게 급하다. */
  l1Priority: Record<string, number>;
  /** 맥락별 발화 대본. word_initial 등은 토큰이 단어 안에 들어간 형태다. */
  frames: Record<HvptContext, (token: string) => string>;
}

const isolatedOnly = (token: string) => token;

export const CONTRASTS: ContrastDraft[] = [
  {
    id: 'g3',
    label: 'ㄱ ㅋ ㄲ',
    note: '평음 · 격음 · 경음',
    tokens: ['개', '캐', '깨'],
    l1Priority: { en: 1, es: 1, vi: 2, ja: 3, zh: 3 },
    frames: {
      isolated: isolatedOnly,
      word_initial: (t) => `${t}구리`,
      word_medial: (t) => `아${t}`,
      sentence: (t) => `이거 ${t} 맞아요?`,
    },
  },
  {
    id: 'd3',
    label: 'ㄷ ㅌ ㄸ',
    note: '평음 · 격음 · 경음',
    tokens: ['달', '탈', '딸'],
    l1Priority: { en: 1, es: 1, vi: 2, ja: 3, zh: 3 },
    frames: {
      isolated: isolatedOnly,
      word_initial: (t) => `${t}이 있어요`,
      word_medial: (t) => `우${t}`,
      sentence: (t) => `${t} 보세요`,
    },
  },
  {
    id: 'eo',
    label: 'ㅓ ㅗ',
    note: '입술 둥글기',
    tokens: ['서', '소'],
    l1Priority: { en: 1, ja: 1, es: 2, vi: 3, zh: 3 },
    frames: {
      isolated: isolatedOnly,
      word_initial: (t) => `${t}리`,
      word_medial: (t) => `어${t}`,
      sentence: (t) => `${t}라고 했어요`,
    },
  },
  {
    id: 'eu',
    label: 'ㅡ ㅜ',
    note: '없는 모음',
    tokens: ['글', '굴'],
    l1Priority: { en: 1, ja: 1, es: 1, vi: 2, zh: 3 },
    frames: {
      isolated: isolatedOnly,
      word_initial: (t) => `${t}이에요`,
      word_medial: (t) => `한${t}`,
      sentence: (t) => `${t} 좋아해요`,
    },
  },
  {
    id: 'coda',
    label: '받침 ㄱ ㄴ ㅁ',
    note: '불파음 — 일본어·중국어권 최대 난관',
    tokens: ['박', '반', '밤'],
    l1Priority: { ja: 1, zh: 1, vi: 1, en: 2, es: 2 },
    frames: {
      isolated: isolatedOnly,
      word_initial: (t) => `${t}이 있어요`,
      word_medial: (t) => `그 ${t}`,
      sentence: (t) => `${t}이라고 해요`,
    },
  },
];

export interface TokenSpec {
  contrastId: string;
  token: string;
  talkerIdx: number;
  context: HvptContext;
  /** R2 저장 키. 불변이다. 한 번 만들면 바꾸지 않는다. */
  audioKey: string;
  /** TTS 배치에 넘길 발화 텍스트. */
  utterance: string;
}

/**
 * 만들어야 할 음원 전량을 펼친다.
 * 5 대립쌍 × 평균 2.6 토큰 × 화자 8 × 맥락 4 ≒ 416개.
 */
export function buildTokenManifest(): TokenSpec[] {
  const out: TokenSpec[] = [];
  for (const c of CONTRASTS) {
    for (const token of c.tokens) {
      for (let talkerIdx = 0; talkerIdx < TALKER_COUNT; talkerIdx += 1) {
        for (const context of CONTEXTS) {
          out.push({
            contrastId: c.id,
            token,
            talkerIdx,
            context,
            audioKey: `hvpt/${c.id}/${token}_t${talkerIdx}_${context}.mp3`,
            utterance: c.frames[context](token),
          });
        }
      }
    }
  }
  return out;
}

export const HVPT_STATUS = {
  contrasts: CONTRASTS.length,
  plannedTokens: buildTokenManifest().length,
  generatedAudio: 0,
  note: '매니페스트만 존재. mp3 는 tools/tts-batch 로 사전 생성해야 한다 (런타임 TTS 금지)',
} as const;

/**
 * 출제기 — 08번 §3 · 07번 S-02.
 *
 *   · 동일 talker_idx 연속 2회 금지
 *   · 세션당 화자 8명 전원 최소 1회 등장
 *   · 맥락을 섞는다
 *
 * 순수 함수로 둔다. 출제 규칙이 깨졌는지 테스트로 고정할 수 있어야 한다.
 */
export interface QuizState {
  /** 이번 세션에서 이미 낸 화자들. */
  usedTalkers: number[];
  lastTalkerIdx: number | null;
}

export function pickNext(
  pool: TokenSpec[],
  state: QuizState,
  random: () => number = Math.random,
): { spec: TokenSpec; state: QuizState } {
  if (pool.length === 0) throw new Error('token pool is empty');

  // 아직 안 나온 화자를 먼저 소진한다. 8명 전원 등장 요건을 만족시키기 위해서다.
  const unseen = pool.filter(
    (t) => !state.usedTalkers.includes(t.talkerIdx) && t.talkerIdx !== state.lastTalkerIdx,
  );
  const notLast = pool.filter((t) => t.talkerIdx !== state.lastTalkerIdx);
  const candidates = unseen.length > 0 ? unseen : notLast.length > 0 ? notLast : pool;

  const spec = candidates[Math.floor(random() * candidates.length)]!;

  return {
    spec,
    state: {
      usedTalkers: state.usedTalkers.includes(spec.talkerIdx)
        ? state.usedTalkers
        : [...state.usedTalkers, spec.talkerIdx],
      lastTalkerIdx: spec.talkerIdx,
    },
  };
}

export const INITIAL_QUIZ_STATE: QuizState = { usedTalkers: [], lastTalkerIdx: null };
