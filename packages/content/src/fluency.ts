/*
 * 4·3·2 유창성 주제 — 08번 문서 §7.
 *
 * 같은 이야기를 4분 → 3분 → 2분으로 세 번. 내용은 같고 시간만 압축한다.
 * 새 언어를 다루지 않는다. 아는 것만 쓴다. 그래서 "쓸 표현"은
 * 반드시 해당 레벨에서 이미 배운 것만 넣는다.
 *
 * 강사 개입이 없다. 앱에서 혼자 한다. 한계비용 0.
 */

export interface FluencyTopic {
  id: number;
  levelCode: string;
  /** 그 레벨에서 이 주제를 열려면 최소 몇 차시를 지나야 하는가. */
  unlockAfterUnit: number;
  prompt: string;
  /** 이미 배운 표현만. 새 표현을 넣으면 4·3·2 가 아니게 된다. */
  useExpressions: string[];
}

let n = 0;
const t = (levelCode: string, unlockAfterUnit: number, prompt: string, useExpressions: string[]): FluencyTopic => ({
  id: (n += 1),
  levelCode,
  unlockAfterUnit,
  prompt,
  useExpressions,
});

export const FLUENCY_TOPICS: FluencyTopic[] = [
  // 1급 — 현재형만 아는 구간
  t('topik1', 8, '보통 하루에 뭐 해요?', ['-아/어요', '보통', '그리고']),
  t('topik1', 11, '가족을 소개해 주세요', ['-이에요/예요', '이/가', '있어요']),
  t('topik1', 14, '좋아하는 음식이 뭐예요?', ['을/를', '좋아하다', '맛있다']),
  t('topik1', 17, '어디에서 공부해요?', ['에서', '에', '도']),
  t('topik1', 19, '못 하는 게 뭐예요?', ['못', '안', '-아/어요']),

  // 과거형 이후
  t('topik1', 22, '주말에 뭐 했어요?', ['-았/었어요', '-고', '그런데']),
  t('topik1', 22, '어제 뭐 먹었어요?', ['-았/었어요', '을/를', '맛있다']),
  t('topik1', 24, '한국 돈으로 얼마예요?', ['한자어 수사', '원', '이에요/예요']),
  t('topik1', 26, '왜 한국어를 배워요?', ['왜', '-고 싶어요', '-아/어서']),
  t('topik1', 28, '다음 주에 뭐 할 거예요?', ['-(으)ㄹ 거예요', '-고 싶어요']),

  // 2급 — 08번 문서의 예시 주제
  t('topik2', 35, '한국에 온 이유가 뭐예요?', ['-아/어서', '-기 때문에', '-았/었어요']),
  t('topik2', 42, '기억에 남는 여행 이야기해 주세요', ['-았/었어요', '-(으)ㄴ 후에', '그때']),
  t('topik2', 50, '요즘 가장 자주 하는 일은?', ['요즘', '보통', '-는 편이에요']),
  t('topik2', 58, '친구와 어떻게 만났어요?', ['-았/었어요', '처음', '-(으)ㄹ 때']),
  t('topik2', 66, '가장 좋아하는 계절과 이유', ['-아/어서', '왜냐하면', '-(으)ㄴ데']),

  // 3급
  t('topik3', 75, '내 나라와 한국의 다른 점', ['-(으)ㄴ데', '-에 비해', '-는 것 같아요']),
  t('topik3', 88, '최근에 본 영화나 드라마', ['-았/었는데', '-(으)ㄹ 줄', '인상적이다']),
  t('topik3', 100, '스트레스를 어떻게 풀어요?', ['-(으)면', '-곤 해요', '주로']),
  t('topik3', 112, '10년 후의 나는?', ['-(으)ㄹ 것 같아요', '-고 싶어요', '아마']),
];

export const FLUENCY_ROUNDS = [
  { round: 1, seconds: 240, label: '4분' },
  { round: 2, seconds: 180, label: '3분' },
  { round: 3, seconds: 120, label: '2분' },
] as const;

/** Four Strands 집계에서 4·3·2 는 9분 고정으로 센다 (03번 문서 §8). */
export const FLUENCY_MINUTES_PER_SESSION = 9;

export const FLUENCY_STATUS = {
  drafted: FLUENCY_TOPICS.length,
  target: 100,
  note: '레벨별 주제 100개가 목표. "쓸 표현"은 해당 차시까지 배운 것만 넣어야 한다',
} as const;
