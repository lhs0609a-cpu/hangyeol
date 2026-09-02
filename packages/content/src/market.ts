/*
 * 랜딩에 쓰는 시장 근거.
 *
 * 화면에 숫자를 직접 박지 않는다. 마케팅 숫자는 반드시 낡고,
 * 낡은 숫자가 여러 화면에 흩어져 있으면 어느 것이 최신인지 아무도 모른다.
 * 출처와 확인 시점을 값 옆에 붙여 한곳에 두고, 화면은 여기서만 읽는다.
 *
 * 규칙: 출처가 없는 숫자는 넣지 않는다. 추정치는 estimate: true 로 표시한다.
 */

export interface MarketFact {
  /** 화면에 크게 보일 값. 단위까지 포함한 완성된 문자열이다. */
  value: string;
  /** 값 아래 한 줄. 무엇을 센 숫자인지 말한다. */
  label: string;
  /** 맥락. 왜 이 숫자가 의미 있는지. */
  note?: string;
  source: string;
  sourceUrl: string;
  /** 우리가 확인한 시점. 숫자가 언제 것인지와 다르다. */
  checkedOn: string;
}

const CHECKED = '2026-09';

/** 랜딩 최상단 — 시장이 커지고 있다는 근거. */
export const MARKET_HEADLINE: MarketFact[] = [
  {
    value: '1,600만명',
    label: '전 세계 한국어 학습자',
    note: '2017년 550만명에서 7년 만에 191% 늘었다',
    source: 'Seoul Vision 2030',
    sourceUrl: 'https://seoulvision2030.com/culture/korean-language-global-spread/',
    checkedOn: CHECKED,
  },
  {
    value: '55만명',
    label: 'TOPIK 응시자 (2025년)',
    note: '2022년 36만명 · 2023년 42만명 · 2024년 49만명 — 4년 연속 증가',
    source: 'Korea.net',
    sourceUrl: 'https://www.korea.net/NewsFocus/Society/view?articleId=279830',
    checkedOn: CHECKED,
  },
  {
    value: '6위',
    label: '듀오링고에서 배우는 언어 순위',
    note: '이탈리아어를 제쳤다. 학습자의 70%가 16~30세다',
    source: 'Duolingo Language Report',
    sourceUrl: 'https://duolingoguides.com/duolingo-language-report/',
    checkedOn: CHECKED,
  },
];

/** 시장 규모 — 돈이 어디에 있는지. */
export const MARKET_SIZE: MarketFact[] = [
  {
    value: '244억 달러',
    label: '온라인 어학 시장 (2026년)',
    note: '2031년 508억 달러로 두 배가 된다',
    source: 'LingoBright',
    sourceUrl:
      'https://www.lingobright.com/statistics/preply-and-italki-tutor-marketplace-statistics/',
    checkedOn: CHECKED,
  },
  {
    value: '13만명',
    label: 'italki · Preply 등록 강사',
    note: 'italki 3만명, Preply 10만명. 이들 대부분이 교재 없이 가르친다',
    source: 'LingoBright',
    sourceUrl:
      'https://www.lingobright.com/statistics/preply-and-italki-tutor-marketplace-statistics/',
    checkedOn: CHECKED,
  },
  {
    value: '23.9만명',
    label: '세종학당 수강생 (2025년)',
    note: '244개 학당, 역대 최다. 전년보다 2.8만명 늘었다',
    source: 'Seoul Vision 2030',
    sourceUrl: 'https://seoulvision2030.com/culture/korean-language-global-spread/',
    checkedOn: CHECKED,
  },
];

/*
 * 수요가 계속 밀려온다는 근거.
 * 한류 콘텐츠가 나올 때마다 학습자가 튄다 — 이게 이 시장의 성격이다.
 */
export const DEMAND_SPIKES = [
  { when: '2021년 9월', what: '오징어 게임 시즌 1', effect: '한국어 학습 등록 40% 증가' },
  { when: '2024년 12월', what: '오징어 게임 시즌 2', effect: '한국어 학습 등록 25% 증가' },
] as const;

export const DEMAND_SOURCE = {
  source: 'Duolingo Language Report',
  sourceUrl: 'https://duolingoguides.com/duolingo-language-report/',
} as const;

/*
 * 강사가 겪는 문제. 랜딩의 본론이다.
 *
 * 시장이 크다는 것만으로는 아무도 가입하지 않는다.
 * "나한테 무슨 문제가 있는지" 를 먼저 맞혀야 한다.
 */
export const TEACHER_PAIN = [
  {
    title: '교재를 주지 않는다',
    body: 'italki 도 Preply 도 커리큘럼을 주지 않습니다. 무엇을 어떤 순서로 가르칠지 강사가 혼자 정합니다.',
  },
  {
    title: '준비에 수업만큼 걸린다',
    body: '한 차시를 준비하는 데 1~2시간. 수업료는 그 시간을 쳐 주지 않습니다.',
  },
  {
    title: '학생이 왜 그만두는지 모른다',
    body: '늘고 있다는 느낌은 있는데 근거가 없습니다. 학생도 마찬가지라 조용히 떠납니다.',
  },
] as const;

/** 우리가 주는 것. 기능이 아니라 결과로 적는다. */
export const VALUE_PROPS = [
  {
    title: '읽으면 되는 수업 대본',
    body: '첫 멘트부터 마무리까지 그대로 적혀 있습니다. 학생이 막혔을 때 무엇을 하는지도 적혀 있습니다.',
    metric: '준비 시간 0분',
  },
  {
    title: '슬라이드가 이미 만들어져 있다',
    body: '차시를 열면 화면이 나옵니다. 강사는 말만 하면 됩니다.',
    metric: '차시당 12~17장',
  },
  {
    title: '학생이 무엇을 못 하는지 보인다',
    body: '수업 3분 기록이 다음 수업의 복습과 학습 계획이 됩니다.',
    metric: '3분이면 끝',
  },
] as const;

/** 랜딩 하단 — 우리가 실제로 갖고 있는 것. 과장하지 않는다. */
export const BUILD_STATUS = {
  levels: '1급 · 2급',
  unitsWritten: 70,
  unitsTarget: 250,
  note: '3급 이상은 순차 공개됩니다',
} as const;
