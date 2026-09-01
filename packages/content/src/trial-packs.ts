/*
 * 체험수업 팩 4종 — 08번 문서 §8. 최우선 제작물이다.
 *
 * 양쪽 플랫폼 모두 첫 수업 실패 = 강사 수입 0이다.
 * Preply 는 체험이 무급이고, italki 는 48시간 내 100% 만족보장 환불이 최대 2회 가능하다.
 *
 * 8–15분 구간이 전환율을 결정한다. 학생이 첫 30분에 자기 이름을 한글로
 * 쓰고 나가면 재수강한다. 그래서 그 구간은 어느 팩에서도 빼지 않는다.
 *
 * 스크립트는 그대로 읽으면 되는 수준으로 쓴다. 강사가 판단할 여지를 남기지 않는다.
 */

export type TrialTrack = 'kcontent' | 'travel' | 'eps' | 'topik';

export interface TrialSegment {
  fromMin: number;
  toMin: number;
  title: string;
  /** 강사가 그대로 읽는 대사. */
  script: string[];
  note?: string;
}

export interface TrialPack {
  track: TrialTrack;
  label: string;
  /** 이 팩에서 즉시 쓰게 만드는 표현 3개. */
  expressions: string[];
  segments: TrialSegment[];
}

/** 전 종 공통 — 0~15분과 25~30분은 같다. 목적별로 15~25분만 갈린다. */
const commonOpen = (): TrialSegment[] => [
  {
    fromMin: 0,
    toMin: 3,
    title: '인사 + 자기소개',
    note: '한국어 100%. 아주 느리게. 학생이 못 알아들어도 괜찮다 — 소리에 익숙해지는 시간이다.',
    script: [
      '안녕하세요. 만나서 반가워요.',
      '저는 ○○○이에요. 한국어 선생님이에요.',
      '오늘 삼십 분 같이 공부해요. 천천히 할게요. 괜찮아요.',
    ],
  },
  {
    fromMin: 3,
    toMin: 8,
    title: '학생 목적 파악',
    note: '준비된 질문 5개. 학생 모국어 병기해서 보여준다. 대답은 짧아도 된다.',
    script: [
      '왜 한국어를 배워요? (Why are you learning Korean?)',
      '한국 드라마 봐요? 케이팝 좋아해요? (Do you watch dramas? Like K-pop?)',
      '한국에 가 봤어요? (Have you been to Korea?)',
      '얼마나 공부했어요? (How long have you studied?)',
      '무엇이 제일 어려워요? (What is hardest for you?)',
    ],
  },
  {
    fromMin: 8,
    toMin: 15,
    title: '한글 맛보기 — 자기 이름 쓰기',
    note: '★ 이 구간이 전환율을 결정한다. 어떤 팩에서도 빼지 않는다. 로마자를 쓰지 않는다.',
    script: [
      '한글은 그림이 아니에요. 소리예요. 조립해요.',
      'ㅁ은 입 모양이에요. ㄱ은 혀 모양이에요.',
      '자, 이름을 써 볼까요? 천천히요.',
      '(학생 이름을 한 글자씩 자모로 분해해 보여준다)',
      '보세요. 이게 ○○ 씨 이름이에요. 한글로요.',
      '오늘 처음인데 벌써 이름을 썼어요.',
    ],
  },
];

const commonClose = (): TrialSegment[] => [
  {
    fromMin: 25,
    toMin: 30,
    title: '진도 그래프 + 다음 수업 제안',
    note: '학습 노트 링크를 이 자리에서 보낸다. 등록은 무료이고 1차시도 무료다.',
    script: [
      '오늘 배운 거 정리할게요. 표현 세 개, 그리고 이름 쓰기.',
      '학습 노트를 보낼게요. 매일 십구 분이에요. 짧아요.',
      '다음 시간에는 ○○을/를 해요.',
      '천천히 하면 돼요. 같이 해요.',
    ],
  },
];

const middle = (title: string, expressions: string[], lines: string[]): TrialSegment => ({
  fromMin: 15,
  toMin: 25,
  title,
  note: `목표 표현 3개를 즉시 쓰게 한다: ${expressions.join(' · ')}`,
  script: lines,
});

export const TRIAL_PACKS: TrialPack[] = [
  {
    track: 'kcontent',
    label: 'K-콘텐츠',
    expressions: ['좋아해요', '최고예요', '진짜?'],
    segments: [
      ...commonOpen(),
      middle('좋아하는 것 말하기', ['좋아해요', '최고예요', '진짜?'], [
        '드라마에서 이 말 많이 들었죠? "좋아해요".',
        '따라 하세요. 좋 · 아 · 해 · 요.',
        '누구 좋아해요? 말해 보세요.',
        '"최고예요"도 해 볼까요? 최 · 고 · 예 · 요.',
        '그리고 "진짜?" 이건 놀랄 때 써요.',
        '자, 제가 말할게요. ○○ 씨가 대답해요.',
      ]),
      ...commonClose(),
    ],
  },
  {
    track: 'travel',
    label: '여행',
    expressions: ['주세요', '얼마예요?', '어디예요?'],
    segments: [
      ...commonOpen(),
      middle('가게에서 말하기', ['주세요', '얼마예요?', '어디예요?'], [
        '한국에서 제일 많이 쓰는 말이에요. "주세요".',
        '물 주세요. 커피 주세요. 따라 하세요.',
        '"얼마예요?" 이건 가격을 물어요.',
        '"어디예요?" 이건 장소를 물어요. 화장실 어디예요?',
        '제가 가게 주인 할게요. 주문해 보세요.',
      ]),
      ...commonClose(),
    ],
  },
  {
    track: 'eps',
    label: '취업 (EPS)',
    expressions: ['했어요', '할 수 있어요', '알겠습니다'],
    segments: [
      ...commonOpen(),
      middle('일터에서 말하기', ['했어요', '할 수 있어요', '알겠습니다'], [
        '일할 때 꼭 필요한 말이에요.',
        '"했어요" — 끝났을 때 말해요. 다 했어요.',
        '"할 수 있어요" — 가능할 때요.',
        '"알겠습니다" — 지시를 들었을 때요. 이건 아주 중요해요.',
        '제가 반장 할게요. 대답해 보세요.',
      ]),
      ...commonClose(),
    ],
  },
  {
    track: 'topik',
    label: '유학 (TOPIK)',
    expressions: ['-이에요/예요', '있어요', '아니에요'],
    segments: [
      ...commonOpen(),
      middle('시험에 나오는 기본형', ['-이에요/예요', '있어요', '아니에요'], [
        'TOPIK 1급은 이 세 개에서 시작해요.',
        '"저는 학생이에요." 따라 하세요.',
        '"시간 있어요?" 있어요 / 없어요.',
        '"아니에요"는 부정이에요.',
        '제가 문제를 낼게요. 골라 보세요.',
      ]),
      ...commonClose(),
    ],
  },
];

export const TRIAL_PACK_STATUS = {
  drafted: TRIAL_PACKS.length,
  target: 4,
  note: '스크립트 초안 완료. 슬라이드 자산과 한국어교원 검수 필요',
} as const;
