/*
 * 모국어별 발음 시트 — 08번 문서 §5.
 *
 * "개인 강사가 절대 못 만드는 자산." 콘텐츠 우선순위 상위에 둔다.
 * 학습자가 반드시 막히는 6개와, 모국어별로 어느 순서로 교정할지가 핵심이다.
 */

export interface PronunciationItem {
  id: string;
  title: string;
  whyHard: string;
  /** 강사가 수업에서 그대로 시킬 수 있는 활동. */
  activity: string;
  minimalPairs: string[];
}

export const PRONUNCIATION_ITEMS: PronunciationItem[] = [
  {
    id: 'eo-o',
    title: 'ㅓ vs ㅗ',
    whyHard: '영어권에 이 대립이 없다. 둘 다 하나의 소리로 들린다.',
    activity: '입술 둥글기 단면도를 보여주고, 손가락을 입 앞에 두고 ㅗ에서만 입술이 앞으로 나오는지 확인시킨다.',
    minimalPairs: ['서 / 소', '벌 / 볼', '건 / 곤', '너 / 노'],
  },
  {
    id: 'eu',
    title: 'ㅡ',
    whyHard: '영어·일본어에 없는 모음. 대개 ㅜ 또는 슈와로 대체해 버린다.',
    activity: '혀 위치 단면도. "이" 입 모양을 유지한 채 혀만 뒤로 당기게 한다.',
    minimalPairs: ['글 / 굴', '들 / 둘', '슬 / 술', '픈 / 푼'],
  },
  {
    id: 'g3',
    title: 'ㄱ / ㅋ / ㄲ 삼분',
    whyHard: '영어권은 유성·무성 2분으로만 듣는다. 세 갈래가 존재한다는 것 자체를 모른다.',
    // 08번 문서: "3번 종이 실험은 반드시 넣는다"
    activity:
      '종이 실험 — 입 앞에 종이를 대고 발음시킨다. ㅋ은 종이가 크게 흔들리고, ㄲ은 거의 안 흔들린다. ㄱ은 그 중간이다. 영어권 학습자가 평음·격음·경음을 처음으로 몸으로 구분하는 순간이고, 아무도 안 알려준다.',
    minimalPairs: ['개 / 캐 / 깨', '달 / 탈 / 딸', '방 / 팡 / 빵', '자 / 차 / 짜'],
  },
  {
    id: 'coda',
    title: '받침 7종성',
    whyHard: '일본어·중국어권 최대 난관. 불파음(터뜨리지 않고 멈추는 소리) 개념 자체가 없다.',
    activity: '혀 정지 위치를 손으로 짚어 준다. 받침에서 소리를 "끝내는" 게 아니라 "멈추는" 것임을 강조한다.',
    minimalPairs: ['박 / 반 / 밤', '옷 / 온 / 옴', '국 / 군 / 굼'],
  },
  {
    id: 'linking',
    title: '연음',
    whyHard: '한국어[한구거]. 초급 듣기 실패의 최대 원인이다. 글자와 소리가 다르다.',
    activity: '파형과 느린 음원을 함께 보여준다. 받침이 다음 모음으로 넘어가는 것을 눈으로 보게 한다.',
    minimalPairs: ['한국어 → 한구거', '음악 → 으막', '옷이 → 오시', '앉아 → 안자'],
  },
  {
    id: 'nasal',
    title: '비음화 · 유음화',
    whyHard: '신라[실라], 국물[궁물]. 규칙을 모르면 아는 단어도 못 알아듣는다.',
    activity: '2급 이후에 다룬다. 초급에서는 개별 단어로만 외우게 한다.',
    minimalPairs: ['신라 → 실라', '국물 → 궁물', '십리 → 심니'],
  },
];

/**
 * 모국어별 교정 순서 — 08번 문서 §5.
 * 순서가 중요하다. 안 되는 것부터 하면 학생이 무너진다.
 */
export const CORRECTION_ORDER: Record<string, string[]> = {
  en: ['eo-o', 'eu', 'g3', 'linking'],
  ja: ['coda', 'eo-o', 'g3', 'linking'],
  zh: ['coda', 'linking', 'g3'],
  vi: ['eu', 'g3', 'linking'],
  es: ['eu', 'eo-o', 'coda'],
};

/** 모국어별 특기사항. 08번 §1 의 분기 표에서 온 것이다. */
export const L1_NOTES: Record<string, { strength: string; watch: string }> = {
  en: { strength: '없음', watch: '조사 구간을 3차시 더 늘린다. 어순은 별도 설명이 필요하다.' },
  ja: { strength: '조사 개념과 한자어 어휘가 강점. 어휘를 가속할 수 있다.', watch: '받침에 집중한다.' },
  zh: { strength: '한자어 부분 강점.', watch: '조사 구간 최대 확대. ㄹ의 초성·종성을 분리해 가르친다.' },
  vi: { strength: '받침이 강점.', watch: '이중모음과 ㅈ/ㅊ.' },
  es: { strength: '없음', watch: 'ㅡ, ㅓ, 어말 자음.' },
};

export const PRONUNCIATION_STATUS = {
  drafted: PRONUNCIATION_ITEMS.length,
  l1Sheets: Object.keys(CORRECTION_ORDER).length,
  target: 5,
  note: '텍스트 초안 완료. 단면도 이미지와 파형 자료는 별도 제작',
} as const;
