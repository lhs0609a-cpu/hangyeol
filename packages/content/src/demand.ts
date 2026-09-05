import type { MarketFact } from './market.js';

/*
 * 수요와 공백 — 랜딩 4·5번 마디의 근거 원장. 13번 문서 §3-C·§3-D.
 *
 * 이 파일이 존재하는 이유.
 *
 * 랜딩의 2·3번 마디(한글·한류)는 방문자가 이미 아는 이야기다.
 * 아는 이야기는 설득하지 못한다. 4번 마디만이 모르던 것을 준다 —
 * 미국 대학에서 스페인어가 18% 줄어드는 동안 한국어는 38% 늘었다는 사실은
 * 한국어 강사조차 대부분 모른다. 그래서 이 구간에 그래프를 놓고,
 * 그래프에 들어가는 숫자를 여기 원장으로 모은다.
 *
 * ── 이 파일의 절대 규칙 ────────────────────────────────
 *
 * 1. 출처 없는 숫자는 넣지 않는다. market.ts 와 같은 규칙이다.
 * 2. 결측 연도를 조용히 잇지 않는다. 없는 해는 없다고 적는다 —
 *    빠진 해를 이어 그리면 그래프가 거짓말을 한다.
 * 3. 인과를 우리 문장으로 단정하지 않는다. "한류 때문에 늘었다" 는
 *    우리가 할 말이 아니다. 팬 수와 학습자 수를 나란히 놓기만 한다.
 *    연결은 읽는 사람이 한다.
 * 4. 스냅샷 수치(오늘 세어 본 강사 수 같은 것)는 확인 시점을 화면에 적는다.
 */

/** 한 해의 값. 그래프 A 가 이것을 막대로 그린다. */
export interface YearPoint {
  year: number;
  value: number;
  /** 그 해에만 붙는 설명. 2020년 급락처럼 이유가 없으면 오독되는 자리에 쓴다. */
  mark?: string;
}

/*
 * 그래프 A — TOPIK 한국어능력시험 연간 응시자 수.
 *
 * 가장 직관적인 지표다. "한국어 시험을 보러 오는 사람" 보다 더 설명이 필요 없는
 * 수요 증거는 없다. 게다가 이야기가 극적이다 — 2019년까지 계속 오르다가
 * 2020년 코로나로 반토막이 나고, 다시 올라 사상 최고를 갱신한다.
 *
 * ── 결측에 대하여 ────────────────────────────────────
 *
 * 2014 · 2021 · 2022 는 1차 출처로 확인하지 못했다. 다른 해와 섞어 이으면
 * 없는 해가 있는 것처럼 보인다. 그래서 배열에서 빼고, 뺐다는 사실을
 * MISSING 에 적어 화면이 캡션으로 밝히게 한다.
 *
 * 2022년에 대해 "약 35만 명" 이라는 서술을 찾았지만 1차 출처를 못 찾아
 * 채택하지 않았다. 그럴듯한 숫자를 채워 넣는 것이 비워 두는 것보다 나쁘다.
 */
export const TOPIK_APPLICANTS: readonly YearPoint[] = Object.freeze([
  { year: 2013, value: 167853 },
  { year: 2015, value: 206768 },
  { year: 2016, value: 250141 },
  { year: 2017, value: 290638 },
  { year: 2018, value: 329224 },
  { year: 2019, value: 375871, mark: '역대 최다' },
  { year: 2020, value: 218869, mark: '코로나' },
  { year: 2023, value: 421812 },
  { year: 2024, value: 428585, mark: '8월까지 누계' },
]);

export const TOPIK_SERIES = {
  title: '한국어능력시험(TOPIK) 연간 응시자',
  unit: '명',
  points: TOPIK_APPLICANTS,
  /** 화면이 이 문장을 캡션으로 찍는다. 결측을 숨기지 않는다. */
  missing: '2014 · 2021 · 2022년은 1차 출처로 확인하지 못해 비워 두었습니다',
  /** 2020년 급락에 이유를 붙이지 않으면 "수요가 꺾였다" 로 읽힌다. */
  note: '2020년 급락은 코로나로 시험이 취소·축소된 결과입니다. 2024년 값은 8월까지의 누계입니다',
  source: '국립국제교육원 통계 (대학저널·서울신문 보도)',
  sourceUrl: 'https://www.seoul.co.kr/news/life/scholaship/2024/10/09/20241009500070',
  checkedOn: '2026-09',
} as const;

/** 다이버징 막대 한 줄. 부호가 곧 의미라서 색만으로 말하지 않는다. */
export interface DeltaBar {
  label: string;
  /** 백분율 증감. 양수는 증가, 음수는 감소. */
  percent: number;
  /** 이 줄이 이야기의 주인공인가. 하나만 true 다. */
  emphasis?: boolean;
}

/*
 * 그래프 B — 미국 대학 언어별 수강 등록 증감 (2016 → 2021).
 *
 * 이 랜딩에서 가장 센 한 장이다. 다른 마디는 "한국어가 인기 있다" 를 말하지만
 * 이 그래프는 "다른 언어는 전부 무너지는 중인데 한국어만 올라간다" 를 말한다.
 * 방문자가 처음 보는 사실이고, 그래서 이 구간에서만 스크롤이 멈춘다.
 *
 * ── 정직성 조건 ──────────────────────────────────────
 *
 * MLA 조사의 15개 주요 언어 중 증가한 것은 셋뿐이다(한국어 · 미국수어 · 성서 히브리어).
 * 여기 다섯 줄만 보이므로, 고른 것이 아니라는 사실을 캡션이 밝혀야 한다.
 * 유리한 것만 골라 그린 그래프는 한 번 들키면 나머지 숫자까지 같이 죽는다.
 *
 * 성서 히브리어(+9.1%)를 뺀 이유는 편집이 아니라 지면이다 —
 * 방문자가 아는 언어라야 비교가 성립하는데 그 항목은 대비를 만들지 못한다.
 * 뺐다는 사실도 캡션에 적는다.
 */
export const MLA_ENROLLMENT_DELTA: readonly DeltaBar[] = Object.freeze([
  { label: '한국어', percent: 38.3, emphasis: true },
  { label: '미국수어', percent: 0.8 },
  { label: '스페인어', percent: -18.0 },
  { label: '프랑스어', percent: -23.1 },
  { label: '독일어', percent: -33.6 },
]);

export const MLA_SERIES = {
  title: '미국 대학 외국어 수강 등록 증감 (2016 → 2021)',
  bars: MLA_ENROLLMENT_DELTA,
  caption:
    'MLA 가 조사한 주요 15개 언어 중 등록이 늘어난 것은 한국어 · 미국수어 · 성서 히브리어 셋뿐입니다. ' +
    '여기에는 비교가 되는 다섯 개만 실었습니다.',
  /** 원문을 그대로 옮긴다. 우리가 요약하면 힘이 빠진다. */
  quote: 'Korean has not shown a decrease in enrollments since 1974.',
  quoteKo: '한국어는 1974년 이후로 등록이 줄어든 적이 없다.',
  source: 'Modern Language Association, Fall 2021 Enrollment Census',
  sourceUrl:
    'https://www.mla.org/content/download/191324/file/Enrollments-in-Languages-Other-Than-English-in-US-Institutions-of-Higher-Education-Fall-2021.pdf',
  checkedOn: '2026-09',
} as const;

/**
 * 그래프 옆에 서는 숫자들.
 *
 * 그래프가 못 하는 말을 한다. 그래프는 추세를 보이고, 이 숫자들은 규모를 보인다.
 */
export const DEMAND_FACTS: readonly MarketFact[] = Object.freeze([
  {
    value: '19,270명',
    label: '미국 대학 한국어 수강 등록 (2021년)',
    note: '2016년 13,936명에서 5,334명 늘었다. 같은 기간 그만큼 늘린 언어는 없었다',
    source: 'Modern Language Association',
    sourceUrl:
      'https://www.mla.org/content/download/191324/file/Enrollments-in-Languages-Other-Than-English-in-US-Institutions-of-Higher-Education-Fall-2021.pdf',
    checkedOn: '2026-09',
  },
  {
    value: '88개국',
    label: '세종학당이 있는 나라 (2024년)',
    note: '2007년에는 3개국 13개소였다. 지금은 256개소다',
    source: '세종학당재단',
    sourceUrl: 'https://www.ksif.or.kr/cop/bbs/selectBoardArticle.do?nttId=9220000006274&bbsId=BBSMSTR_000000000071',
    checkedOn: '2026-09',
  },
  {
    value: '23.9만명',
    label: '세종학당 수강생 (2025년)',
    note: '전년 21만명에서 13.6% 늘었다. 신규 학당 지정 경쟁률은 8.5대 1이다',
    source: '세종학당재단',
    sourceUrl: 'https://www.dongponews.net/news/articleView.html?idxno=56366',
    checkedOn: '2026-09',
  },
]);

/*
 * ── 여기서부터는 공백 ──────────────────────────────────
 *
 * 위가 "배우려는 사람이 이만큼 늘었다" 라면 여기는 "그런데 가르칠 사람이 없다" 다.
 * 랜딩에서 이 두 구간이 붙어 있어야 논증이 선다. 떨어뜨리면 그냥 시장 소개가 된다.
 */

/** 플랫폼 하나의 실상. 오늘 직접 세어 본 숫자라 확인 시점을 화면에 적는다. */
export interface PlatformGap {
  platform: string;
  teachers: number;
  /** 이 숫자를 우리가 어떻게 얻었는지. 추정과 실측을 구분한다. */
  how: string;
  sourceUrl: string;
  checkedOn: string;
}

export const PLATFORM_GAPS: readonly PlatformGap[] = Object.freeze([
  {
    platform: 'italki',
    teachers: 537,
    how: '한국어 강사 목록을 직접 세었습니다',
    sourceUrl: 'https://www.italki.com/en/teachers/korean',
    checkedOn: '2026-09-05',
  },
  {
    platform: 'Preply',
    teachers: 4313,
    how: '한국어 튜터 목록을 직접 세었습니다',
    sourceUrl: 'https://preply.com/en/online/korean-tutors',
    checkedOn: '2026-09-05',
  },
]);

/**
 * 플랫폼이 스스로 문서에 적어 둔 것.
 *
 * 이 인용이 이 랜딩에서 가장 값싸고 가장 센 근거다.
 * 우리가 "강사가 교재를 직접 만들어야 한다" 고 주장할 필요가 없다 —
 * 플랫폼이 공식 핸드북에 그렇게 써 두었다. 옮기기만 하면 된다.
 */
export const PLATFORM_ADMISSION = {
  line: '슬라이드, PDF, 다운로드 자료는 전부 강사가 준비합니다',
  who: 'italki 공식 Teacher Handbook',
  sourceUrl: 'https://support.italki.com/hc/en-us/articles/900000093843',
  checkedOn: '2026-09',
} as const;

/** 실제 강사의 말. 우리가 지어낸 페르소나가 아니라 공개된 글에서 가져왔다. */
export const TEACHER_VOICE = {
  line: '슬라이드도 PDF도 다운로드 자료도 전부 강사 몫입니다. 그래서 처음에 일이 아주 많습니다',
  who: 'italki 강사 (1,700회 이상 수업)',
  source: 'Think in Italian',
  sourceUrl: 'https://www.thinkinitalian.com/how-to-teach-on-italki',
  checkedOn: '2026-09',
} as const;

/** 공백을 숫자로. */
export const GAP_FACTS: readonly MarketFact[] = Object.freeze([
  {
    value: '27.9%',
    label: '한국어교원 자격자 중 실제 활동 비율',
    note: '누적 83,754명이 자격을 땄고, 지금 가르치는 사람은 7,380명이다',
    source: '국립국어원',
    sourceUrl: 'https://www.korean.go.kr',
    checkedOn: '2026-09',
  },
  {
    value: '44분',
    label: '60분 수업 하나를 준비하는 데 드는 시간',
    note: '어학 교사 대상 설문. 도구를 쓴 뒤 30분이 줄었다는 조사 결과다',
    source: 'Off2Class 자체 설문',
    sourceUrl: 'https://www.off2class.com/save-time-lesson-planning-how-off2class-helps-esl-teachers/',
    checkedOn: '2026-09',
  },
]);

/**
 * 경쟁 지형. 왜 아직 아무도 이걸 안 하고 있는가.
 *
 * 이 문단이 없으면 방문자가 "이미 있는 거 아니야?" 에서 멈춘다.
 * 있는 것과 없는 것을 이름으로 대야 그 질문이 닫힌다.
 */
export const COMPETITIVE_GAP = {
  headline: '학습자용은 있고, 무료 자료실도 있습니다. 그 사이가 비어 있습니다',
  body:
    '학습자가 혼자 쓰는 구독 서비스가 있고, 정부와 대학이 만든 무료 강사 자료실이 있습니다. ' +
    '그런데 온라인에서 1:1 로 가르치는 개인 강사가 그대로 열어 수업에 쓸 수 있는 ' +
    '유료 커리큘럼 도구는 조사에서 확인되지 않았습니다. ' +
    '자료실의 자료는 강사가 다시 수업으로 만들어야 하고, 그 작업이 바로 차시당 1~2시간입니다.',
  checkedOn: '2026-09',
} as const;
