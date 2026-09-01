/*
 * 다청 라이브러리 — 08번 문서 §6, 의미중심 입력 스트랜드.
 *
 * "공부하지 마세요. 95% 알아들을 수 있는 것만 골라뒀습니다."
 * 학습이 아니라 노출이다. 그래서 문제도 없고 채점도 없다.
 *
 * 저작권: 외부 콘텐츠를 복제하지 않는다. 전부 자체 제작 대본이다.
 */

export interface ListeningItem {
  id: number;
  levelCode: string;
  title: string;
  /** 3~5분. i+1 이하가 되도록 어휘를 제한한다. */
  durationSec: number;
  /** 자체 제작 대본 요약. 실제 녹음은 별도 트랙. */
  synopsis: string;
  audioKey: string;
}

let n = 0;
const l = (levelCode: string, title: string, durationSec: number, synopsis: string): ListeningItem => {
  n += 1;
  return { id: n, levelCode, title, durationSec, synopsis, audioKey: `listen/${levelCode}/${n}.mp3` };
};

export const LISTENING_ITEMS: ListeningItem[] = [
  // 초급 — 일상 장면. 문장이 짧고 반복이 많다.
  l('topik1', '카페에서 주문해요', 180, '손님이 아메리카노를 주문하고 사이즈를 고른다. 같은 문형이 세 번 반복된다.'),
  l('topik1', '지하철 안내방송', 200, '다음 역 안내와 환승 안내. 실제 방송 리듬을 따르되 속도를 늦춘다.'),
  l('topik1', '자기소개', 190, '이름·나라·직업·취미 순서. 초급 학습자가 그대로 따라 쓸 수 있는 틀.'),
  l('topik1', '편의점에서', 175, '물건을 고르고 계산한다. 숫자와 "주세요"가 반복된다.'),
  l('topik1', '오늘 날씨', 165, '날씨 표현과 옷차림. 형용사 위주.'),
  l('topik1', '우리 가족', 195, '가족 구성원을 소개한다. "있어요/없어요" 반복.'),
  l('topik1', '주말에 한 일', 210, '과거형 노출. 22차시 이후 배정.'),
  l('topik1', '길 묻기', 185, '"어디예요?"와 방향 표현.'),

  // 2급 — 문장이 길어지고 연결어미가 들어온다.
  l('topik2', '브이로그 — 아침 루틴', 240, '일상 동작을 시간 순으로 나열. -고, -아/어서 노출.'),
  l('topik2', '친구와의 통화', 260, '약속을 잡는 대화. 반말과 존댓말이 섞인다.'),
  l('topik2', '식당 리뷰', 230, '음식 맛과 분위기를 평가한다. 형용사 확장.'),
  l('topik2', '한국 사계절', 250, '계절별 특징. 비교 표현 노출.'),
  l('topik2', '취미 이야기', 245, '취미를 시작한 계기와 이유. -아/어서 반복.'),
  l('topik2', '병원에서', 235, '증상을 설명한다. 신체 어휘.'),

  // 3급 — 라디오·인터뷰 톤
  l('topik3', '라디오 사연', 300, '청취자 사연과 진행자 반응. 자연스러운 속도.'),
  l('topik3', '직장 동료와의 대화', 280, '업무 상황. 완곡 표현과 존댓말.'),
  l('topik3', '여행 후기', 290, '경험을 시간 순으로 회상한다. -았/었는데 노출.'),
  l('topik3', '뉴스 — 생활 정보', 270, '짧은 생활 뉴스. 한자어 어휘 밀도가 높다.'),
];

export const LISTENING_STATUS = {
  drafted: LISTENING_ITEMS.length,
  target: 200,
  recordedAudio: 0,
  note: '대본 개요만. 실제 오디오 녹음은 별도 트랙 — 저작권상 전부 자체 제작이어야 한다',
} as const;
