import type { MarketFact } from './market.js';

/*
 * 훈민정음 — 이 제품의 이름이 어디서 왔고, 왜 그 이름을 쓰는가.
 *
 * 랜딩에 역사 구간을 넣기로 한 이유.
 *
 * 이 제품은 "교재를 주는 도구" 다. 기능만 늘어놓으면 남들도 다 하는 말이 된다.
 * 그런데 우리가 하려는 일 자체는 580년 전에 한 번 있었던 일이다 —
 * 아는 사람만 쓰던 문자를 누구나 쓸 수 있게 바꾸는 일. 세종이 한 일이 그것이고,
 * 그 문장이 훈민정음 서문에 그대로 있다.
 *
 *   "나랏말싸미 듕귁에 달아 문자와로 서르 사맛디 아니할쎄"
 *    ─ 우리말이 중국과 달라 한자로는 서로 통하지 아니하여
 *
 * '사맛다' 는 '통하다' 다. 제품 이름을 여기서 가져왔다.
 * 이름의 출처를 화면에 두지 않으면 이름은 그냥 소리일 뿐이다.
 *
 * ── 이 파일이 지키는 것 ──────────────────────────────────
 *
 * market.ts 와 같은 규칙을 따른다. 출처 없는 숫자는 넣지 않는다.
 * 역사 항목도 마찬가지다 — "세계에서 가장 과학적인 문자" 같은 말은
 * 누가 언제 무슨 근거로 했는지가 없으면 자화자찬이라 오히려 신뢰를 깎는다.
 * 그래서 감탄 대신 확인 가능한 것만 적는다: 만든 연도, 등재 연도, 상 이름,
 * 그리고 언어학자가 붙인 분류 이름.
 *
 * 옛 표기에 대하여.
 *
 * 서문 원문은 아래아(ㆍ)와 반치음이 섞인 옛한글이다. 그대로 넣으면
 * IBM Plex Sans KR 이 못 그려서 네모가 뜬다 — 한글 이야기를 하는 구간에서
 * 한글이 깨지는 것보다 나쁜 것은 없다. 그래서 널리 쓰이는 현대 자모 표기를
 * 쓰고, 그것이 옮긴 것임을 화면에 밝힌다. 원문인 척하지 않는다.
 */

/**
 * 제품 이름의 출처. 화면에서 이 구간의 첫 문장이 된다.
 *
 * 어원 표기 주의 — 기본형은 '사맛다' 가 아니라 **'사맟다'** 다.
 * 중세국어 8종성법(종성에 ㄱㄴㄷㄹㅁㅂㅅㅇ 여덟만 허용)때문에
 * 표기상 '사맛디' 로 적힌 것이고 어간은 '사맟-' 이다.
 * 이름의 내력을 파는 구간에서 그 내력을 틀리면 구간 전체가 무너진다.
 */
export const SAMAT_ORIGIN = {
  /** 옛 표기를 현대 자모로 옮긴 것. 원문 그대로가 아니라는 사실을 화면에 적는다. */
  line: '나랏말싸미 듕귁에 달아 문자와로 서르 사맛디 아니할쎄',
  modern: '우리말이 중국과 달라 한자로는 서로 통하지 아니하여',
  word: '사맛디',
  /** 기본형과 뜻. 화면의 낱말 카드가 이것을 찍는다. */
  stem: '사맟다',
  gloss: '통하다 · 서로 뜻이 닿다',
  note: '옛 표기를 현대 자모로 옮긴 것입니다. 기본형은 「사맟다」이고, 8종성법 때문에 「사맛디」로 적혔습니다',
  source: '훈민정음 · 한국민족문화대백과사전',
  sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0065805',
} as const;

/**
 * 세종이 자음을 만든 방법.
 *
 * 훈민정음 해례본 제자해가 다섯 글자의 모양이 어디서 왔는지 밝혀 놓았다.
 * 발음할 때 입안이 만드는 모양을 그대로 글자로 그렸고,
 * 소리가 세지면 획을 하나 더했다. 이게 이 구간의 전부다 —
 * 다른 설명을 붙이지 않아도 표를 보면 알아서 읽힌다.
 *
 * derived 는 가획 순서다. ㅇ 에서 ㅎ 으로 가는 사이에 ㆆ(여린히읗)이 있지만
 * 현대 한글에 없는 글자라 뺐다. 뺐다는 사실은 note 에 적는다.
 */
export interface JamoOrigin {
  /** 기본자. 발음기관을 본뜬 다섯 글자. */
  base: string;
  /** 어디를 본떴는가. 해례 제자해의 설명을 우리말로 옮긴 것. */
  shape: string;
  /** 획을 더해 만든 글자들. 소리가 세지는 순서다. */
  derived: readonly string[];
  note?: string;
}

export const JAMO_ORIGINS: readonly JamoOrigin[] = Object.freeze([
  { base: 'ㄱ', shape: '혀뿌리가 목구멍을 막는 모양', derived: ['ㅋ'] },
  { base: 'ㄴ', shape: '혀끝이 윗잇몸에 닿는 모양', derived: ['ㄷ', 'ㅌ'] },
  { base: 'ㅁ', shape: '입의 모양', derived: ['ㅂ', 'ㅍ'] },
  { base: 'ㅅ', shape: '이의 모양', derived: ['ㅈ', 'ㅊ'] },
  {
    base: 'ㅇ',
    shape: '목구멍의 모양',
    derived: ['ㅎ'],
    note: '사이에 여린히읗이 있었지만 지금은 쓰지 않습니다',
  },
]);

export const JAMO_SOURCE = {
  source: '훈민정음 해례본 제자해',
  sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0065805',
} as const;

/**
 * 모음을 만든 방법 — 하늘 · 땅 · 사람.
 *
 * 자음과 달리 모음은 글꼴로 보일 수가 없다. 기본자 중 아래아(ㆍ)가
 * 현대 한글에 없어서 글자로 찍으면 네모가 뜬다.
 * 그런데 이 셋은 각각 점 하나, 가로선 하나, 세로선 하나다 —
 * 그릴 수 있는 것을 굳이 글꼴에 맡길 이유가 없어서 화면이 직접 그린다.
 */
export type SamjaeMark = 'dot' | 'horizontal' | 'vertical';

export const SAMJAE: readonly { mark: SamjaeMark; means: string; became: string }[] =
  Object.freeze([
    { mark: 'dot', means: '하늘', became: 'ㅗ ㅏ ㅜ ㅓ 의 점' },
    { mark: 'horizontal', means: '땅', became: 'ㅡ ㅗ ㅜ' },
    { mark: 'vertical', means: '사람', became: 'ㅣ ㅏ ㅓ' },
  ]);

/**
 * 한글이 받은 평가. 우리가 하는 말이 아니라 남이 한 말만 적는다.
 *
 * "가장 과학적인 문자" 같은 문장은 출처를 못 대면 광고가 된다.
 * 대신 확인 가능한 것을 쓴다 — 유네스코가 무엇을 등재했는지,
 * 어느 언어학자가 무슨 분류를 새로 만들었는지, 어떤 상이 언제 생겼는지.
 */
export const HANGEUL_FACTS: readonly MarketFact[] = Object.freeze([
  {
    value: '1443년',
    label: '세종이 스물여덟 자를 만든 해',
    note: '3년 뒤인 1446년에 해례본과 함께 반포했다. 만든 사람과 만든 날짜와 만든 원리가 모두 남아 있는 문자는 이것뿐이다',
    source: '한국민족문화대백과사전',
    sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0065805',
    checkedOn: '2026-09',
  },
  {
    value: '1997년',
    label: '훈민정음 해례본 유네스코 세계기록유산 등재',
    note: '글자를 왜 그 모양으로 만들었는지 설명한 책이 함께 남았기 때문이다',
    source: '국가유산청',
    sourceUrl:
      'https://www.heritage.go.kr/heri/html/HtmlPage.do?pg=/unesco/MemHeritage/MemHeritage_01.jsp&pageNo=5_4_2_0',
    checkedOn: '2026-09',
  },
  {
    value: '1989년',
    label: '유네스코 세종대왕 문해상 제정',
    note: '모어로 글을 깨치게 한 공로에 매년 세 곳을 뽑아 시상한다. 문맹을 없앤 사람의 이름이 붙은 국제 상이다',
    source: 'UNESCO',
    sourceUrl: 'https://www.unesco.org/en/prizes/literacy',
    checkedOn: '2026-09',
  },
]);

/**
 * 언어학이 한글에 붙인 이름.
 *
 * 이 항목만 따로 둔 이유: 숫자가 아니라 분류라서 Stat 로 못 그린다.
 * 그리고 이 구간에서 가장 강한 근거이기도 하다 — 우리가 좋다고 한 게 아니라,
 * 기존 분류(표음·음절·표의)로는 설명이 안 돼서 새 칸을 만들어야 했던 문자다.
 */
export const FEATURAL_CLAIM = {
  term: '자질 문자',
  english: 'featural writing system',
  body:
    '글자의 모양이 소리의 성질을 담는 문자를 가리키는 말입니다. ' +
    '언어학자 제프리 샘슨이 1985년 한글을 설명하려고 만든 분류입니다 — ' +
    '기존의 어떤 칸에도 들어가지 않아서 칸을 새로 만들었습니다.',
  source: 'Featural writing system',
  sourceUrl: 'https://en.wikipedia.org/wiki/Featural_writing_system',
} as const;

/**
 * 정인지가 해례본 끝에 적은 말.
 *
 * 이 문장을 넣는 이유는 자랑이 아니라 우리 제품의 주장과 같은 말이기 때문이다.
 * "배우는 데 오래 걸리지 않게 만들었다" 는 것이 이 문자의 설계 목표였다.
 * 우리가 강사에게 파는 것도 같은 것이다 — 준비하는 데 오래 걸리지 않게.
 */
export const JEONGINJI_LINE = {
  line: '슬기로운 사람은 아침나절이 지나기 전에 깨치고, 어리석은 사람도 열흘이면 배운다',
  who: '정인지, 훈민정음 해례본 서문',
  source: '정인지 서문 · 한국민족문화대백과사전',
  sourceUrl: 'https://encykorea.aks.ac.kr/Article/E0078675',
} as const;


/**
 * 남이 한 말. 우리가 검증한 것만 싣는다.
 *
 * 한글에 대한 외국 학자의 찬사는 인터넷에 널려 있는데 절반이 출처가 없다.
 * 13번 문서 §3-A 가 하나씩 원출처를 확인했고, 확인된 것만 여기 있다.
 *
 * 뺀 것과 뺀 이유(다음 사람이 다시 주워 오지 않도록):
 *   · 베르너 사세 "전통 철학과 과학 이론을 결합한 최고의 알파벳"
 *     → 한국 정부 홍보 사이트에만 있다. 본인 저작에서 확인 불가.
 *   · 존 맨 "한글은 모든 알파벳의 꿈"
 *     → 검색으로 전혀 확인되지 않는다. 한국식 의역으로 보인다.
 *   · 로버트 램지 "인류의 위대한 지적 성취"
 *     → 샘슨의 말이 램지에게 잘못 붙은 것으로 보인다.
 *
 * 검증 안 된 인용을 하나 실으면 검증된 나머지까지 같이 의심받는다.
 * 이 구간에서는 인용 수가 아니라 인용의 안전성이 값이다.
 */
export interface ScholarVoice {
  /** 화면에 크게 놓이는 문장. 한국어로 옮긴 것. */
  line: string;
  /** 영어 원문. 옮긴 말만 실으면 확인할 길이 없다. */
  original?: string;
  who: string;
  work: string;
  sourceUrl: string;
}

export const SCHOLAR_VOICES: readonly ScholarVoice[] = Object.freeze([
  {
    line: '한글은 어느 나라에서 통용되는 문자 체계 가운데도 아마 가장 과학적일 것이다',
    original:
      "Han'gul is perhaps the most scientific system of writing in general use in any country.",
    who: '에드윈 라이샤워 · 존 페어뱅크, 하버드대',
    work: 'East Asia: The Great Tradition (1960) p.435',
    sourceUrl: 'https://en.wikiquote.org/wiki/Hangul',
  },
  {
    /*
     * 이 항목이 이 목록에서 가장 세다. 형용사가 하나도 없기 때문이다.
     * 찬사는 말이지만 20년을 매년 지킨 것은 행동이다.
     */
    line: '시카고대 언어학자 제임스 매콜리는 1979년부터 세상을 떠난 1999년까지 매년 한글날 파티를 열었다',
    who: '스탠퍼드대 언어학과 기록',
    work: 'Happy Hangul Day',
    sourceUrl: 'https://linguistics.stanford.edu/news/happy-hangul-day',
  },
]);

/**
 * 다이아몬드는 극찬하지 않았다 — 소개했다.
 *
 * 이 항목을 SCHOLAR_VOICES 와 따로 두는 이유가 그것이다.
 * 원문은 "학자들에 의해 그렇게 묘사되어 왔다(have been described by scholars)" 다.
 * "재러드 다이아몬드가 세계 최고의 알파벳이라고 했다" 로 쓰면 과장이고,
 * 과장 하나가 들키면 이 구간의 나머지 숫자까지 같이 죽는다.
 */
export const DIAMOND_NOTE = {
  line: '세종의 스물여덟 자는 학자들에 의해 "세계 최고의 알파벳", "가장 과학적인 문자 체계"로 묘사되어 왔다',
  original:
    'The king\'s 28 letters have been described by scholars as "the world\'s best alphabet" and "the most scientific system of writing."',
  who: '재러드 다이아몬드',
  work: 'Writing Right, Discover 1994년 6월호',
  sourceUrl: 'https://www.discovermagazine.com/mind/writing-right',
  /** 화면에 이 단서를 반드시 함께 찍는다. */
  caveat: '다이아몬드 본인의 평가가 아니라 학계의 평가를 소개한 문장입니다',
} as const;

/*
 * ── 여기서부터는 지금 벌어지고 있는 일 ────────────────────
 *
 * 세종은 우리말을 우리 글로 적게 했다. 지금은 우리 글을 배우겠다는 사람이
 * 밖에서 밀려온다. 그 사람들을 가르칠 강사에게 교재가 없다는 것이
 * 이 랜딩의 본론이고, 이 구간은 그 앞에 놓이는 근거다.
 *
 * ── 저작권 ─────────────────────────────────────────
 *
 * 오징어 게임 · BTS · 케이팝 데몬 헌터스는 이름과 사실만 적는다.
 * 스틸컷 · 공연 사진 · 로고는 넷플릭스와 소속사의 저작물이고 멤버 개인의
 * 초상이 겹친다. 13번 문서 §5 가 합법적 경로를 전부 확인했고 하나도 없었다 —
 * Getty 의 editorial 라이선스는 promotional 용도를 명시적으로 금지하고,
 * 유료 SaaS 랜딩은 정의상 promotional 이다.
 * 사실을 출처와 함께 진술하는 것은 복제가 아니다.
 *
 * ── 인과 ───────────────────────────────────────────
 *
 * "한류 때문에 한국어 학습이 늘었다" 를 우리 문장으로 단정하지 않는다.
 * 그렇게 말한 1차 공식 발언은 조사에서 확인되지 않았다.
 * 팬 수와 학습자 수를 나란히 놓기만 하고, 연결은 읽는 사람이 한다.
 */

/** 연표 한 줄. 줄마다 출처가 다르므로 출처를 줄에 붙인다. */
export interface DemandSpike {
  when: string;
  what: string;
  effect: string;
  source: string;
  sourceUrl: string;
}

/**
 * 한류가 어디까지 갔는지, 연도순으로.
 *
 * 출처를 줄마다 붙이는 이유: 넷플릭스 시청 수와 빌보드 차트와 그래미는
 * 전혀 다른 곳에서 온 숫자다. 각주 하나로 묶으면 셋 다 못 믿을 숫자가 된다.
 */
export const HALLYU_SPIKES: readonly DemandSpike[] = Object.freeze([
  {
    when: '2021년',
    what: '오징어 게임 시즌 1',
    effect: '90개국 1위 · 넷플릭스 역대 비영어 시리즈 1위',
    source: 'Netflix Tudum',
    sourceUrl: 'https://www.netflix.com/tudum/top10/most-popular/tv-non-english',
  },
  {
    when: '2025년 6월',
    what: '오징어 게임 시즌 3',
    effect: '93개국 동시 1위 — 넷플릭스 최초',
    source: 'Forbes',
    sourceUrl:
      'https://www.forbes.com/sites/maryroeloffs/2025/07/08/squid-game-smashes-netflix-records-no-1-in-93-countries/',
  },
  {
    when: '2025년 9월',
    what: '케이팝 데몬 헌터스',
    effect: '넷플릭스 역대 최다 시청 작품',
    source: 'Forbes',
    sourceUrl:
      'https://www.forbes.com/sites/reginakim/2025/09/03/kpop-demon-hunters-is-now-netflixs-most-watched-title-ever/',
  },
  {
    when: '2026년 2월',
    what: '「Golden」 그래미 수상',
    effect: '케이팝 최초 그래미',
    source: 'Billboard',
    sourceUrl:
      'https://www.billboard.com/music/awards/golden-kpop-demon-hunters-2026-grammys-first-kpop-winner-1236169490/',
  },
]);

/**
 * 이 구간을 여는 숫자.
 *
 * 한류의 크기를 말하는 방법은 여럿인데, 이것이 가장 정직하다.
 * 시청 수는 한 작품의 것이고 차트는 한 곡의 것이지만,
 * 이 숫자는 "한국 문화를 좋아한다고 스스로 등록한 사람" 을 센 것이다.
 * 정부 기관이 11년째 같은 방법으로 세고 있어서 추세를 믿을 수 있다.
 */
export const HALLYU_FANS = {
  from: { year: 2012, value: '926만명' },
  to: { year: 2023, value: '2억 2,500만명' },
  multiple: '24배',
  label: '전 세계 한류 동호회 회원',
  note: '한국국제교류재단과 외교부가 매년 같은 방법으로 센 숫자입니다',
  source: 'KF · 외교부 「2023 지구촌 한류현황」',
  sourceUrl: 'https://www.kf.or.kr/archives/ebook/ebook_view.do?p_cidx=4040&p_cfidx=128940',
  checkedOn: '2026-09',
} as const;

/**
 * 케이팝 데몬 헌터스.
 *
 * 이 항목만 따로 크게 두는 이유는 이 랜딩의 시점 때문이다.
 * 2026년에 한국어 강사에게 말을 걸면서 이 작품을 빼면 시장을 모르는 회사가 된다.
 */
export const KDH_FACT: MarketFact = {
  value: '5억회',
  label: '케이팝 데몬 헌터스 시청',
  note: '오징어 게임을 제치고 넷플릭스 역대 1위가 됐다. 주제가 「Golden」은 2026년 그래미를 받은 첫 케이팝 곡이다',
  source: 'Forbes · Billboard',
  sourceUrl:
    'https://www.forbes.com/sites/reginakim/2025/09/03/kpop-demon-hunters-is-now-netflixs-most-watched-title-ever/',
  checkedOn: '2026-09',
};

/**
 * 한류가 얼마나 넓게 퍼졌는지를 보이는 숫자들.
 *
 * BTS 항목에 수상을 암시하는 말을 붙이지 않는다 —
 * 그래미 4회 후보에 올랐고 수상은 없다. 바로 위 KDH_FACT 가 "최초 수상" 을
 * 말하므로 이 둘이 나란히 놓이면 오독이 생기기 쉽다. 센 숫자만 적는다.
 */
export const HALLYU_FACTS: readonly MarketFact[] = Object.freeze([
  {
    value: '7곡 · 7장',
    label: 'BTS 의 빌보드 1위 (Hot 100 · 빌보드 200)',
    note: '2026년 정규 5집은 그룹 역대 최대 주간 판매를 기록했다',
    source: 'Billboard',
    sourceUrl: 'https://www.billboard.com/lists/bts-number-ones-hot-100-billboard-200/',
    checkedOn: '2026-09',
  },
  {
    value: '20주',
    label: '「Golden」 빌보드 글로벌 연속 1위',
    note: '미국을 제외한 전 세계 차트 기준이다',
    source: 'Billboard',
    sourceUrl:
      'https://www.billboard.com/music/chart-beat/huntr-x-golden-global-charts-number-one-jan-10-1236149069/',
    checkedOn: '2026-09',
  },
  {
    value: '570배',
    label: '케이팝 글로벌 스트리밍 증가 (2014 → 2025)',
    note: '스포티파이가 직접 발표한 수치다',
    source: 'Spotify Newsroom',
    sourceUrl: 'https://newsroom.spotify.com/2026-03-11/loud-and-clear-music-economics-highlights/',
    checkedOn: '2026-09',
  },
]);

/**
 * 학습자가 어디에 얼마나 있는가.
 *
 * 인과를 말하는 유일한 문장이 여기 있는데, 우리 말이 아니라 인용이다.
 * 듀오링고 한국 총괄이 "K-콘텐츠 붐의 영향" 이라고 했다. 다만 회사 공식
 * 블로그가 아니라 언론 인터뷰라서, 출처를 그 인터뷰로 정확히 적는다.
 */
export const WORLD_LEARNERS = {
  headline: '한국을 본 적 없는 사람들이 한국어를 찾습니다',
  body:
    '듀오링고에서 한국어는 전 세계 6위 언어이고 학습자는 550만 명입니다. ' +
    '아르헨티나 · 콜롬비아 · 프랑스 · 독일 · 멕시코 · 스페인 · 폴란드 일곱 나라에서는 ' +
    '두 번째로 빠르게 자라는 언어입니다.',
  quote: '한국어 상승은 케이팝과 드라마, 영화가 만든 K-콘텐츠 붐의 영향입니다',
  quoteWho: '듀오링고 한국 총괄 인터뷰 (서울경제, 2025년 12월)',
  quoteUrl:
    'https://en.sedaily.com/finance/2025/12/06/korean-rises-to-6th-most-learned-language-globally-on',
  source: 'Duolingo Language Report 2025',
  sourceUrl: 'https://blog.duolingo.com/2025-duolingo-language-report/',
} as const;
