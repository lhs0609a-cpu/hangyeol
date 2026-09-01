/*
 * 시나리오 말하기 드릴 — 08번 문서 §4.
 *
 * 자유 대화 AI 를 쓰지 않는다. 사전 제작 분기 트리 + 캐싱 음원이다.
 * 비용 때문만이 아니다. 초급자는 "아무 말이나 해보세요"에서 얼어붙고,
 * AI 는 학생 레벨 밖 표현을 쓴다. 시나리오는 그 문형을 8번 쓰게 만든다.
 * 안 쓰면 진행이 안 된다.
 */

export interface ScenarioNode {
  id: string;
  speaker: 'ai';
  text: string;
  audioKey: string;
  hint?: string;
  expect: { match: string[]; next: string; kind: 'exact' | 'fallback' }[];
}

export interface ScenarioDraft {
  unitNo: number;
  title: string;
  targetForms: string[];
  nodes: ScenarioNode[];
}

const key = (unit: number, id: string) => `sc/u${unit}/${id}.mp3`;

export const SCENARIOS: ScenarioDraft[] = [
  {
    unitNo: 15,
    title: '카페에서 주문하기',
    targetForms: ['-아/어 주세요', '-고 싶어요'],
    nodes: [
      {
        id: 'n1',
        speaker: 'ai',
        text: '어서 오세요. 뭐 드릴까요?',
        audioKey: key(15, 'n1'),
        expect: [
          { match: ['아메리카노', '커피', '라떼'], next: 'n2', kind: 'exact' },
          { match: ['*'], next: 'n1_retry', kind: 'fallback' },
        ],
      },
      {
        id: 'n1_retry',
        speaker: 'ai',
        text: '천천히 말해도 괜찮아요. 뭐 드릴까요?',
        audioKey: key(15, 'n1r'),
        hint: '아메리카노 주세요',
        expect: [{ match: ['*'], next: 'n2', kind: 'fallback' }],
      },
      {
        id: 'n2',
        speaker: 'ai',
        text: '따뜻한 거요, 차가운 거요?',
        audioKey: key(15, 'n2'),
        expect: [
          { match: ['따뜻', '뜨거운'], next: 'n3', kind: 'exact' },
          { match: ['차가운', '아이스', '시원'], next: 'n3', kind: 'exact' },
          { match: ['*'], next: 'n2_retry', kind: 'fallback' },
        ],
      },
      {
        id: 'n2_retry',
        speaker: 'ai',
        text: '따뜻한 거요, 차가운 거요?',
        audioKey: key(15, 'n2r'),
        hint: '따뜻한 거 주세요',
        expect: [{ match: ['*'], next: 'n3', kind: 'fallback' }],
      },
      {
        id: 'n3',
        speaker: 'ai',
        text: '사이즈는 어떻게 해 드릴까요?',
        audioKey: key(15, 'n3'),
        expect: [
          { match: ['큰', '라지', '작은', '스몰', '보통'], next: 'n4', kind: 'exact' },
          { match: ['*'], next: 'n4', kind: 'fallback' },
        ],
      },
      {
        id: 'n4',
        speaker: 'ai',
        text: '더 필요하신 거 있으세요?',
        audioKey: key(15, 'n4'),
        // 여기서 -아/어 주세요를 한 번 더 쓰게 만든다. 목표 문형 반복이 목적이다.
        expect: [
          { match: ['빨대', '얼음', '컵', '주세요'], next: 'n5', kind: 'exact' },
          { match: ['없어요', '괜찮아요'], next: 'n5', kind: 'exact' },
          { match: ['*'], next: 'n4_retry', kind: 'fallback' },
        ],
      },
      {
        id: 'n4_retry',
        speaker: 'ai',
        text: '더 필요하신 거 있으세요?',
        audioKey: key(15, 'n4r'),
        hint: '빨대 주세요 / 괜찮아요',
        expect: [{ match: ['*'], next: 'n5', kind: 'fallback' }],
      },
      {
        id: 'n5',
        speaker: 'ai',
        text: '네, 4,500원입니다. 잠시만 기다려 주세요.',
        audioKey: key(15, 'n5'),
        expect: [],
      },
    ],
  },
  {
    unitNo: 22,
    title: '주말에 뭐 했어요?',
    targetForms: ['-았/었어요', '-고'],
    nodes: [
      {
        id: 'n1',
        speaker: 'ai',
        text: '주말 잘 보냈어요? 뭐 했어요?',
        audioKey: key(22, 'n1'),
        expect: [
          { match: ['했어요', '갔어요', '봤어요', '먹었어요', '쉬었어요'], next: 'n2', kind: 'exact' },
          { match: ['*'], next: 'n1_retry', kind: 'fallback' },
        ],
      },
      {
        id: 'n1_retry',
        speaker: 'ai',
        text: '괜찮아요. 어제 뭐 했어요?',
        audioKey: key(22, 'n1r'),
        hint: '친구를 만났어요',
        expect: [{ match: ['*'], next: 'n2', kind: 'fallback' }],
      },
      {
        id: 'n2',
        speaker: 'ai',
        text: '누구하고 갔어요?',
        audioKey: key(22, 'n2'),
        expect: [
          { match: ['친구', '가족', '혼자', '동생'], next: 'n3', kind: 'exact' },
          { match: ['*'], next: 'n3', kind: 'fallback' },
        ],
      },
      {
        id: 'n3',
        speaker: 'ai',
        text: '어땠어요? 재미있었어요?',
        audioKey: key(22, 'n3'),
        expect: [
          { match: ['재미있었어요', '좋았어요', '별로'], next: 'n4', kind: 'exact' },
          { match: ['*'], next: 'n4', kind: 'fallback' },
        ],
      },
      {
        id: 'n4',
        speaker: 'ai',
        text: '다음 주말에는 뭐 할 거예요?',
        audioKey: key(22, 'n4'),
        expect: [],
      },
    ],
  },
];

/**
 * 판정 로직 — 08번 §4 "비용 통제 핵심".
 *
 *   1차  룰 기반 문자열 매칭 → 약 90% 처리, 비용 0
 *   2차  1차 실패 시에만 LLM 판정 → 세션당 1~2회
 *
 * 이 함수가 1차다. 여기서 90%를 처리해야 종량과금이 0에 수렴한다.
 */
export function matchNode(node: ScenarioNode, answer: string): { next: string | null; matched: boolean } {
  // 정규화: 공백 제거. 조사 변이는 부분 일치로 흡수한다.
  const normalized = answer.replace(/\s+/g, '');

  for (const rule of node.expect) {
    if (rule.kind === 'fallback') continue;
    if (rule.match.some((m) => normalized.includes(m.replace(/\s+/g, '')))) {
      return { next: rule.next, matched: true };
    }
  }

  const fallback = node.expect.find((r) => r.kind === 'fallback');
  return { next: fallback?.next ?? null, matched: false };
}

export const SCENARIO_STATUS = {
  drafted: SCENARIOS.length,
  target: 60,
  note: '초급 30차시분 60개가 목표. 개당 3시간(AI 초안 → 전문가 검수) 소요',
} as const;
