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
  | 'seoul-night';

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
});

/** 화면에서 이렇게 꺼내 쓴다. 경로를 손으로 적으면 파일명이 바뀔 때 조용히 깨진다. */
export function photo(id: PhotoId): Photo {
  return PHOTOS[id];
}

/** 출처 화면이 훑는 목록. 등록 순서를 유지한다. */
export const PHOTO_LIST: readonly Photo[] = Object.freeze(Object.values(PHOTOS));
