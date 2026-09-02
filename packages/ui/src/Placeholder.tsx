/*
 * 목업 · 플레이스홀더 — 06번 문서 §0, §9.
 *
 * "이 인터페이스도 장식이 아니라 획(劃)으로 짓는다."
 * "전용 아이콘 세트를 쓰지 않는다. 필요한 것은 획으로 그린다."
 *
 * 아직 이미지가 없는 자리를 회색 상자로 두면 미완성으로 읽힌다.
 * 획으로 그린 도형을 두면 의도된 자리로 읽힌다 —
 * 그 차이가 제품이 완성돼 보이는지를 가른다.
 *
 * 여기 그리는 것은 전부 stroke 다. 채우지 않는다.
 */

export type PlaceholderKind = 'slide' | 'diagram' | 'photo' | 'empty';

/**
 * 슬라이드 자리 — 16:9.
 *
 * 자모 블록(네모)과 획 세 개를 흐리게 그린다.
 * 한글이 조립되는 문자라는 사실이 이 제품의 시각 언어이므로
 * 빈 자리에서도 같은 언어를 쓴다.
 */
export function SlidePlaceholder({
  label,
  tone = 'default',
}: {
  label?: string;
  tone?: 'default' | 'warm';
}) {
  const line = tone === 'warm' ? 'var(--hanji-rule)' : 'var(--rule)';
  const bg = tone === 'warm' ? 'var(--hanji-card)' : 'var(--canvas)';

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        background: bg,
        border: `1px solid ${line}`,
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 160 90"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <g stroke={line} strokeWidth="1.4" fill="none" strokeLinecap="round">
          {/* 자모 블록 */}
          <rect x="54" y="22" width="52" height="46" rx="5" />
          {/* ㅎ 계열 획 */}
          <path d="M68 32 H84" />
          <path d="M62 40 H90" />
          <circle cx="72" cy="52" r="8" />
          {/* ㅏ */}
          <path d="M97 30 V60" />
          <path d="M90 44 H97" />
        </g>
      </svg>

      {label && (
        <div
          className="t-caption"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center' }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

/** 발음 단면도 자리 — 4:3. 옆얼굴 윤곽만 획으로. */
export function DiagramPlaceholder({ label }: { label?: string }) {
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '4 / 3',
        background: 'var(--canvas)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 120 90"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <g stroke="var(--rule)" strokeWidth="1.4" fill="none" strokeLinecap="round">
          {/* 옆얼굴 윤곽 */}
          <path d="M40 18 Q66 16 74 34 Q78 46 70 52 Q72 60 64 62 L64 70 Q50 74 40 68" />
          {/* 입 */}
          <path d="M52 56 H64" />
          {/* 혀 */}
          <path d="M48 60 Q56 56 62 59" />
        </g>
      </svg>

      {label && (
        <div
          className="t-caption"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center' }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

/**
 * 빈 화면 — 06번 §8: "빈 화면은 초대다."
 *
 * 아무것도 없다고 말하지 않는다. 다음에 무엇을 하면 되는지 말한다.
 */
export function EmptyInvite({
  message,
  action,
  kind = 'empty',
}: {
  message: string;
  action?: React.ReactNode;
  kind?: PlaceholderKind;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '38px 20px' }}>
      <svg width="52" height="52" viewBox="0 0 100 100" aria-hidden="true" style={{ opacity: 0.5 }}>
        <g stroke="var(--rule)" strokeWidth="6" fill="none" strokeLinecap="round">
          {kind === 'slide' ? (
            <>
              <rect x="16" y="26" width="68" height="48" rx="6" />
              <path d="M30 46 H58" />
            </>
          ) : (
            <>
              <path d="M28 26 H72" />
              <path d="M28 50 H62" />
              <path d="M28 74 H48" />
            </>
          )}
        </g>
      </svg>

      <p className="t-body" style={{ color: 'var(--ink-3)', margin: '14px 0 0' }}>
        {message}
      </p>

      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
