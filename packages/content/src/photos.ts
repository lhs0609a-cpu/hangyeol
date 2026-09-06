import type { LicenseId } from './licenses.js';

/*
 * 랜딩 사진 레지스트리.
 *
 * 왜 사진을 넣기로 했는가.
 *
 * italki 와 Preply 의 화면을 훑어보면 "진짜로 돌아가는 서비스" 로 읽히는 이유가
 * 디자인이 아니라 사람이다. 두 곳 모두 첫 화면에 사람 사진을 걸고,
 * 강사 목록의 카드마다 얼굴·국적·수업 수·별점을 붙인다.
 * 우리 랜딩에는 슬라이드(제품)만 있었다. 만든 물건은 보이는데
 * 가르치는 사람이 없어서 제품 소개가 아니라 도면처럼 읽혔다.
 *
 * 그렇다고 두 사이트의 사진을 가져올 수는 없다.
 * 08번 문서 §6 이 "외부 콘텐츠를 복제하지 않는다" 고 못 박았고,
 * 그 사진들은 남의 저작물이면서 동시에 강사 개인의 초상이다.
 * 그래서 상업 이용이 허용된 사진을 직접 골라 저장소에 넣었다.
 *
 * Pexels 라이선스는 출처 표시를 요구하지 않는다. 그래도 촬영자를 적는다 —
 * 표시 의무가 없다는 것과 누가 찍었는지 모른다는 것은 다르다.
 *
 * ── 절대 규칙 ────────────────────────────────────────────
 * 이 사진의 인물을 우리 강사·후기·추천으로 쓰지 않는다.
 *
 * 두 가지 이유가 겹친다.
 *   1. Pexels 라이선스가 "이미지 속 인물이 제품을 보증하는 것처럼 보이게 하지 말 것" 을
 *      명시한다. 이름을 붙이고 따옴표를 치는 순간 위반이다.
 *   2. market.ts 가 "출처 없는 숫자는 넣지 않는다" 로 버티고 있다.
 *      없는 강사를 한 명이라도 지어내면 그 옆의 숫자도 전부 같이 의심받는다.
 *
 * 사진은 상황을 보여주는 데까지만 쓴다. 사람을 지목하지 않는다.
 */

export type PhotoId =
  | 'teacher-online-lesson'
  | 'handmade-flashcard'
  | 'one-to-one-lesson'
  | 'korean-handwriting'
  | 'seoul-night'
  | 'hunmin-preface'
  | 'hallyu-lightsticks'
  | 'dalgona-shapes'
  | 'hojakdo';

export interface Photo {
  id: PhotoId;
  /** apps/teacher/public 아래 경로. 파일은 저장소에 들어 있다 — 외부 링크로 걸지 않는다. */
  src: string;
  /** 저장된 실제 화소. 이 값을 <img> 에 넣어야 이미지가 뜨기 전에 자리가 안 밀린다. */
  width: number;
  height: number;
  /** 스크린리더가 읽는 문장. 사진에 무엇이 있는지가 아니라 무엇을 말하는지를 적는다. */
  alt: string;
  photographer: string;
  /** 원본 페이지. 촬영자와 라이선스를 여기서 확인했다. */
  sourceUrl: string;
  license: LicenseId;
  /** 화면 어디에, 왜 쓰는가. 쓰이지 않는 사진은 이 목록에 남기지 않는다. */
  usedAt: string;
}

const PEXELS = 'Pexels' as const satisfies LicenseId;
/* 저작권이 소멸한 옛 문서. 표시 의무는 없지만 어느 소장본인지 적는다 — licenses.ts 참고 */
const PD_OLD = 'PD-old' as const satisfies LicenseId;
/*
 * 동일조건변경허락(Share-Alike). 사진을 그대로 싣는 것은 2차 저작물이 아니라
 * 편집물이라 우리 페이지 전체에 라이선스가 옮지 않는다. 다만 우리가 자른 사진
 * 자체는 같은 라이선스로 나가므로 /licenses 가 그 사실을 밝힌다.
 */
const CC_BY_SA_4 = 'CC-BY-SA-4.0' as const satisfies LicenseId;

/**
 * 고른 기준.
 *
 * 06번 문서 §1 의 팔레트가 먹·종이·쪽빛이다. 채도가 높은 사진을 섞으면
 * 사진만 튀어서 붙여 넣은 것처럼 보인다. 그래서 색이 가라앉은 사진만 골랐다.
 * 서울 야경 한 장만 예외인데, 그 구간이 말하는 것이 "한류로 학습자가 튄다" 라
 * 네온이 있어야 문장과 그림이 같은 말을 한다.
 *
 * 얼굴이 정면으로 크게 나온 사진도 피했다. 강사를 특정하는 것처럼 읽힌다.
 */
export const PHOTOS: Readonly<Record<PhotoId, Photo>> = Object.freeze({
  'teacher-online-lesson': {
    id: 'teacher-online-lesson',
    src: '/photos/teacher-online-lesson.jpg',
    width: 880,
    height: 1100,
    alt: '헤드셋을 쓴 강사가 펼쳐 놓은 교재를 보며 화면 너머로 설명하고 있다',
    photographer: 'Thirdman',
    sourceUrl: 'https://www.pexels.com/photo/6503001/',
    license: PEXELS,
    usedAt: '랜딩 히어로 — 슬라이드 한 장이 이 사진 위에 겹친다',
  },
  'handmade-flashcard': {
    id: 'handmade-flashcard',
    src: '/photos/handmade-flashcard.jpg',
    width: 1200,
    height: 900,
    alt: '강사가 종이에 직접 문법 항목을 적어 만든 카드를 노트북 화면 쪽으로 들어 보이고 있다',
    photographer: 'Tima Miroshnichenko',
    sourceUrl: 'https://www.pexels.com/photo/6671599/',
    license: PEXELS,
    usedAt: '랜딩 문제 구간 — "교재를 주지 않는다" 옆',
  },
  'one-to-one-lesson': {
    id: 'one-to-one-lesson',
    src: '/photos/one-to-one-lesson.jpg',
    width: 1400,
    height: 788,
    alt: '창가 책상에서 노트북으로 학생과 일대일 수업을 하고 있다',
    photographer: 'Vanessa Garcia',
    sourceUrl: 'https://www.pexels.com/photo/6326378/',
    license: PEXELS,
    usedAt: '랜딩 해법 구간 — 수업은 강사가 실시간으로 한다는 것을 보인다',
  },
  'korean-handwriting': {
    id: 'korean-handwriting',
    src: '/photos/korean-handwriting.jpg',
    width: 1400,
    height: 788,
    alt: '한국어 문장을 손으로 적은 노란 메모지 두 장이 겹쳐 놓여 있다',
    photographer: 'Youn Seung Jin',
    sourceUrl: 'https://www.pexels.com/photo/38939111/',
    license: PEXELS,
    usedAt: '랜딩 가입 구간 앞 띠 — 배우는 쪽의 손글씨',
  },
  'seoul-night': {
    id: 'seoul-night',
    src: '/photos/seoul-night.jpg',
    width: 900,
    height: 1200,
    alt: '한글 간판이 늘어선 서울의 밤거리',
    photographer: 'Ethan Brooke',
    sourceUrl: 'https://www.pexels.com/photo/16395527/',
    license: PEXELS,
    usedAt: '랜딩 수요 구간 — 한류 콘텐츠가 나올 때마다 학습자가 튄다는 문장 옆',
  },

  /*
   * 훈민정음 해례본 어제 서문 — 이 랜딩에서 유일하게 "진짜" 인 이미지다.
   *
   * 원래 이 자리에는 Pexels 의 일반 한문 문서 사진이 있었고, 이 파일에
   * "해례본 사진은 소장 기관 촬영물이라 우리가 쓸 수 있는 것이 아니다" 라고
   * 적혀 있었다. 확인해 보니 그게 틀렸다 — 규장각 소장본 스캔이
   * PD-1923 · PD-South Korea 로 위키미디어 공용에 있다.
   * 확인하지 않은 통념 하나 때문에 진짜 문서 대신 대역을 쓰고 있었다.
   *
   * 파일은 원본 그대로가 아니라 누끼 딴 것이다. 종이와 장서인을 지우고
   * 먹만 남겼다 — 그래야 한지 바닥에 얹었을 때 사진이 아니라 글이 된다.
   * 장서인을 지울 때 붉다는 이유만으로 지우면 그 아래 글자까지 파이므로
   * (우하단 '字' 가 그랬다), 붉으면서 먹만큼 진하지 않은 화소만 지웠다.
   *
   * 이 사진의 alt 를 "한문 문서" 로 쓰지 않는다. 무엇이 적혀 있는지가 요점이다.
   */
  'hunmin-preface': {
    id: 'hunmin-preface',
    src: '/photos/hunmin-preface.png',
    width: 900,
    height: 1200,
    alt: '훈민정음 해례본 첫 장. 세로쓰기 한문으로 「訓民正音 國之語音異乎中國與文字不相流通」 으로 시작하는 세종의 서문이 적혀 있다',
    photographer: '서울대학교 규장각한국학연구원 소장본',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hunminjeongeum_Haerye_02.jpg',
    license: PD_OLD,
    usedAt: '랜딩 훈민정음 구간 — 제품 이름이 나온 바로 그 문장이 적힌 페이지',
  },

  /*
   * 오징어 게임을 보여 주는데 넷플릭스 저작물이 하나도 없는 사진이다.
   *
   * 찍힌 것은 달고나(뽑기)와 이쑤시개다. 달고나는 1960년대부터 있던
   * 길거리 과자이고, 찍힌 무늬는 동그라미 · 세모 · 별 · 우산 —
   * 도형 넷이다. 도형은 저작물이 아니고 놀이의 규칙도 저작물이 아니다.
   * 그런데 2021년 이후로는 이 넉 장을 보면 전 세계가 같은 것을 떠올린다.
   *
   * 스틸컷을 쓸 수 없어서 대신 고른 것이 아니다. 이쪽이 더 맞다 —
   * 이 구간은 "한국 것이 세계로 갔다" 를 말하는데, 실제로 간 것은
   * 넷플릭스의 화면이 아니라 달고나라는 말과 그 놀이였다.
   * 그리고 이건 우리가 파는 것과 같은 종류다. 학습자가 배우고 싶어 하는
   * 한국어 낱말.
   *
   * ── 사진을 자른 이유 ────────────────────────────────
   *
   * 원본 아래쪽에 이 과자를 만든 제과점의 상호가 찍혀 있었다.
   * 남의 상호를 우리 랜딩에 노출할 이유가 없어서 잘라 냈다.
   * 자르는 것은 변경이므로 우리가 내보내는 이 사진도 CC BY-SA 로 나간다.
   */
  'dalgona-shapes': {
    id: 'dalgona-shapes',
    src: '/photos/dalgona-shapes.jpg',
    width: 900,
    height: 800,
    alt: '달고나 네 개에 각각 동그라미 · 세모 · 별 · 우산 모양이 찍혀 있고 옆에 이쑤시개가 놓여 있다',
    photographer: 'Triplecaña',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Squid_Game_dalgona_cookies.jpg',
    license: CC_BY_SA_4,
    usedAt: '랜딩 한류 구간 — 화면 밖으로 나온 것이 무엇인지 보이는 자리',
  },

  /*
   * 호작도(虎鵲圖) — 조선의 민화. 케이팝 데몬 헌터스를 보이는 방법이다.
   *
   * 그 영화의 스틸컷 · 캐릭터 · 로고는 전부 막혀 있다. 로고는 저작권이
   * 풀린 판본이 공용에 있지만 상표가 남아서, 유료 상품의 랜딩에 놓으면
   * 제휴 관계로 읽힌다. 저작권과 상표는 다른 층이다.
   *
   * 그런데 이 그림은 그 영화의 대역이 아니라 출처다.
   * 영화에 나오는 호랑이(Derpy)와 까치(Sussie)가 민화에서 왔다는 것은
   * 제작진이 밝힌 사실이고, 위키백과가 Salon 기사를 출처로 달아 두었다.
   * 대역으로 때운 것이 아니라 원본을 보이는 것이라서 이쪽이 더 세다.
   *
   * 그리고 이 사진이 이 랜딩의 척추를 잇는다 — 훈민정음 구간이 "옛것" 을
   * 말하고 한류 구간이 "지금" 을 말하는데, 조선의 그림이 2025년 넷플릭스
   * 1위 영화가 됐다는 사실이 그 둘을 한 문장으로 묶는다.
   *
   * 종이색이 --hanji 와 거의 같아서 한지 구간에 놓으면 사라진다.
   * 먹 구간에 놓아야 산다 — 검은 바닥에서 유일하게 따뜻한 것이 된다.
   */
  hojakdo: {
    id: 'hojakdo',
    src: '/photos/hojakdo.jpg',
    width: 900,
    height: 1094,
    alt: '조선의 민화 호작도. 눈이 크고 표정이 우스운 호랑이가 앉아 있고 소나무 가지에 까치가 앉아 내려다본다',
    photographer: '조선시대 · 작자 미상',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Tiger_and_Magpie,_72x59.4_cm,_priviate_collection,_Japan.jpg',
    license: PD_OLD,
    usedAt: '랜딩 한류 구간 — 지금 세계가 보는 것이 어디서 왔는지',
  },

  /*
   * 특정 가수의 공연이 아니다. 그 점이 중요하다.
   *
   * 이 구간의 문장에는 BTS 와 케이팝 데몬 헌터스가 이름으로 나오지만
   * 그들의 공연 사진 · 스틸컷 · 로고는 남의 저작물이고 개인의 초상이다.
   * 그래서 어느 공연인지 알 수 없는 객석 사진을 골랐고,
   * 설명도 특정 가수를 가리키지 않는다. 캡션에 이름을 붙이는 순간 위반이 된다.
   */
  'hallyu-lightsticks': {
    id: 'hallyu-lightsticks',
    src: '/photos/hallyu-lightsticks.jpg',
    width: 1400,
    height: 762,
    alt: '어두운 공연장 객석을 응원봉 불빛이 가득 채우고 있다',
    photographer: 'Teddy',
    sourceUrl: 'https://www.pexels.com/photo/2167381/',
    license: PEXELS,
    usedAt: '랜딩 한류 구간 — 가사를 따라 부르다 문법을 찾게 되는 자리',
  },
});

/** 화면에서 이렇게 꺼내 쓴다. 경로를 손으로 적으면 파일명이 바뀔 때 조용히 깨진다. */
export function photo(id: PhotoId): Photo {
  return PHOTOS[id];
}

/** 출처 화면이 훑는 목록. 등록 순서를 유지한다. */
export const PHOTO_LIST: readonly Photo[] = Object.freeze(Object.values(PHOTOS));
