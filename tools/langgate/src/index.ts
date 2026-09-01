/*
 * italki 창구 모니터 — 02번 문서 A-08, 10번 문서 §6.
 *
 * 11번 문서: "B7은 반나절이면 된다. Phase 1 중에라도 먼저 띄워 리드를 모으기 시작한다."
 * "3주차 항목을 미루지 마라. 반나절 작업으로 Phase 1 내내 쓸 강사 리드가 쌓인다."
 *
 * italki 는 언어별로 신규 강사 지원 창구를 열고 닫는다. 한국어 창구가 닫혀
 * 있으면 신청 자체가 불가능한데 대부분의 강사가 그 사실을 모르고 포기한다.
 * 열리는 순간을 알려주는 것 하나가 리드 자석이 된다.
 */

export interface GateSnapshot {
  platform: 'italki';
  langCode: string;
  isOpen: boolean;
  checkedAt: Date;
  /** 판정 근거. 구조가 바뀌었을 때 무엇을 보고 판단했는지 남긴다. */
  evidence: string;
}

export const ITALKI_TEACHER_APPLY_URL = 'https://teach.italki.com/application';

/**
 * 오픈 언어 목록에서 한국어를 찾는다.
 *
 * 크롤링 대상의 구조는 언제든 바뀐다(10번 문서 §12 미결 1번).
 * 그래서 파싱을 좁게 만들지 않고, 여러 신호를 함께 본다.
 * 하나만 보면 마크업이 조금 바뀔 때마다 오탐이 난다.
 */
export function detectKoreanOpen(html: string): { isOpen: boolean; evidence: string } {
  const normalized = html.replace(/\s+/g, ' ');

  // 부정 신호를 먼저 본다. "지금은 안 받는다"가 명시돼 있으면 그게 답이다.
  const closedSignals = [
    /korean[^<]{0,80}(currently|temporarily)[^<]{0,40}(closed|not accepting|unavailable)/i,
    /not accepting[^<]{0,40}korean/i,
    /한국어[^<]{0,40}(마감|중단)/,
  ];
  for (const re of closedSignals) {
    const m = normalized.match(re);
    if (m) return { isOpen: false, evidence: `closed-signal: ${m[0].slice(0, 120)}` };
  }

  // 긍정 신호 — 선택 가능한 언어 목록 안에 한국어가 있는가.
  const openSignals = [
    /<option[^>]*value="[^"]*"[^>]*>\s*korean\s*<\/option>/i,
    /"language"\s*:\s*"korean"/i,
    /data-language="korean"[^>]*(?!disabled)/i,
  ];
  for (const re of openSignals) {
    const m = normalized.match(re);
    if (m) return { isOpen: true, evidence: `open-signal: ${m[0].slice(0, 120)}` };
  }

  // 어느 쪽 신호도 없으면 닫힌 것으로 본다.
  // 잘못 열렸다고 알리는 쪽이 잘못 닫혔다고 알리는 쪽보다 훨씬 나쁘다 —
  // 강사가 헛되이 지원 절차를 밟게 만든다.
  return { isOpen: false, evidence: 'no-signal' };
}

export async function check(
  fetchImpl: typeof fetch = fetch,
  now = new Date(),
): Promise<GateSnapshot> {
  const res = await fetchImpl(ITALKI_TEACHER_APPLY_URL, {
    headers: {
      // 정직한 식별자를 보낸다. 위장하지 않는다.
      'user-agent': 'hangyeol-langgate/0.1 (+https://github.com/lhs0609a-cpu/hangyeol)',
      accept: 'text/html',
    },
  });

  if (!res.ok) {
    return {
      platform: 'italki',
      langCode: 'ko',
      isOpen: false,
      checkedAt: now,
      evidence: `http-${res.status}`,
    };
  }

  const { isOpen, evidence } = detectKoreanOpen(await res.text());
  return { platform: 'italki', langCode: 'ko', isOpen, checkedAt: now, evidence };
}

/**
 * 스냅샷 비교 — 상태가 바뀐 순간에만 알린다.
 *
 * 매주 "여전히 닫혀 있습니다"를 보내면 구독자가 나간다.
 * 닫힘 → 열림 전이만 알림 가치가 있다.
 */
export function shouldNotify(previous: GateSnapshot | null, current: GateSnapshot): boolean {
  if (!previous) return current.isOpen;
  return !previous.isOpen && current.isOpen;
}

/**
 * 알림 문구 — 02번 문서 A-08 수용 기준.
 * "보통 며칠 내 닫힙니다" 경고와 서류 체크리스트 링크를 반드시 포함한다.
 */
export function notificationBody(): { subject: string; body: string } {
  return {
    subject: 'italki 한국어 강사 창구가 열렸습니다',
    body: [
      'italki 한국어 강사 지원 창구가 방금 열렸습니다.',
      '',
      '보통 며칠 안에 다시 닫힙니다. 지금 신청하세요.',
      '',
      '준비 서류',
      '  · 신분증',
      '  · 본인 셀피',
      '  · 소개 영상 (1~3분)',
      '  · 자격 증빙 (한국어교원 자격증 · 학위 · 경력)',
      '',
      `지원 페이지: ${ITALKI_TEACHER_APPLY_URL}`,
    ].join('\n'),
  };
}
