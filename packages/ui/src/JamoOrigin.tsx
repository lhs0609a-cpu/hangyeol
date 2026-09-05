/*
 * 자모 상형 표 — 세종이 글자를 만든 방법을 표 하나로 보인다.
 *
 * 왜 이 조각이 따로 있는가.
 *
 * 랜딩의 한글 구간에서 "한글은 위대하다" 를 문장으로 쓰면 자화자찬이 된다.
 * 그런데 만든 방법을 그대로 보여 주면 읽는 사람이 스스로 결론을 낸다 —
 * ㄱ 이 혀뿌리 모양이고, 소리가 세지면 획이 하나 붙어 ㅋ 이 된다는 것을
 * 표에서 보고 나면 설명이 더 필요 없다. 그래서 형용사를 쓰지 않고 표를 놓는다.
 *
 * 06번 §0: "이 인터페이스는 장식이 아니라 획으로 짓는다."
 * 이 구간은 그 명제가 문자 그대로 맞는 유일한 자리다. 글자 자체가 획이다.
 *
 * ── 자음은 글꼴로, 모음은 그림으로 ──────────────────────
 *
 * 자음 기본자 다섯(ㄱㄴㅁㅅㅇ)과 가획자는 전부 현대 한글 호환 자모라
 * 어느 글꼴에서도 그려진다. 그래서 글자로 찍는다.
 *
 * 모음 기본자는 사정이 다르다. 아래아(ㆍ)가 현대 한글에 없어서
 * 글꼴에 따라 네모가 뜬다 — 한글을 설명하는 화면에서 한글이 깨지는 것보다
 * 나쁜 것은 없다. 마침 이 셋은 점 하나 · 가로선 하나 · 세로선 하나라
 * 그릴 수 있는 것을 굳이 글꼴에 맡길 이유가 없다. 화면이 직접 그린다.
 */

export interface JamoRow {
  base: string;
  shape: string;
  derived: readonly string[];
  note?: string;
}

export interface SamjaeRow {
  mark: 'dot' | 'horizontal' | 'vertical';
  means: string;
  became: string;
}

export interface JamoOriginProps {
  rows: readonly JamoRow[];
  samjae: readonly SamjaeRow[];
  /** 표 아래에 붙는 한 줄. 이 표가 어디서 나온 것인지 말한다. */
  caption?: string;
}

export function JamoOrigin({ rows, samjae, caption }: JamoOriginProps) {
  return (
    <div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {rows.map((row, i) => (
          <li
            key={row.base}
            style={{
              display: 'grid',
              /* 글자칸은 폭을 고정한다 — 자모마다 폭이 달라서 흐르게 두면 설명 줄이 어긋난다 */
              gridTemplateColumns: 'clamp(44px, 7vw, 62px) 1fr auto',
              gap: 'clamp(14px, 2.6vw, 28px)',
              alignItems: 'center',
              padding: 'clamp(12px, 1.8vw, 18px) 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--hanji-rule)',
            }}
          >
            <Glyph char={row.base} strong />

            <span>
              <span style={{ fontSize: 'var(--fs-body)', lineHeight: 1.6 }}>{row.shape}</span>
              {row.note && (
                <span
                  style={{
                    display: 'block',
                    fontSize: 'var(--fs-caption)',
                    color: 'var(--ink-4)',
                    lineHeight: 1.6,
                    marginTop: 4,
                  }}
                >
                  {row.note}
                </span>
              )}
            </span>

            {/*
             * 가획. 화살표 대신 획이 붙는 순서를 글자로만 보인다.
             * 화살표를 쓰면 "변환" 처럼 읽히는데, 실제로 일어난 일은
             * 앞 글자에 선을 하나 더한 것이라 글자를 나란히 두는 편이 정확하다.
             */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.4vw, 14px)' }}>
              <Tick />
              {row.derived.map((d) => (
                <Glyph key={d} char={d} />
              ))}
            </span>
          </li>
        ))}
      </ul>

      {/* ── 모음 삼재 ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'clamp(12px, 2vw, 20px)',
          marginTop: 'clamp(18px, 2.6vw, 28px)',
          paddingTop: 'clamp(18px, 2.6vw, 28px)',
          borderTop: '1px solid var(--hanji-rule)',
        }}
      >
        {samjae.map((s) => (
          <div key={s.mark} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SamjaeMark mark={s.mark} />
            <span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 'var(--fw-medium)',
                }}
              >
                {s.means}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--ink-4)',
                  marginTop: 2,
                }}
              >
                {s.became}
              </span>
            </span>
          </div>
        ))}
      </div>

      {caption && (
        <p
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--ink-4)',
            lineHeight: 1.7,
            margin: '14px 0 0',
          }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

/**
 * 자모 한 글자.
 *
 * 본문 글꼴(IBM Plex Sans KR)로 찍는다. 획이 각져서 상형 원리가 눈에 잡힌다 —
 * 둥근 글꼴로 찍으면 ㄱ 이 혀뿌리 모양이라는 말이 안 보인다.
 */
function Glyph({ char, strong = false }: { char: string; strong?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        fontSize: strong ? 'var(--fs-display)' : 'var(--fs-h1)',
        fontWeight: 'var(--fw-regular)',
        lineHeight: 1,
        color: strong ? 'var(--ink)' : 'var(--ink-2)',
        letterSpacing: 'var(--ls-display)',
      }}
    >
      {char}
    </span>
  );
}

/** 획이 하나 더해진다는 표시. 짧은 선 하나면 족하다. */
function Tick() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width: 'clamp(12px, 2vw, 20px)',
        height: 1,
        background: 'var(--ink-4)',
      }}
    />
  );
}

/**
 * 하늘 · 땅 · 사람.
 *
 * 아래아를 글자로 찍지 않고 그린다. 이유는 파일 머리에 적었다.
 * 원본 크기를 24 로 두고 폭을 clamp 로 준다 — 옆의 글자와 눈높이가 맞아야 한다.
 */
function SamjaeMark({ mark }: { mark: SamjaeRow['mark'] }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      style={{ flex: 'none', width: 'clamp(22px, 3vw, 28px)', height: 'auto' }}
    >
      {mark === 'dot' && <circle cx="12" cy="12" r="4" fill="var(--ink)" />}
      {mark === 'horizontal' && (
        <line x1="3" y1="12" x2="21" y2="12" stroke="var(--ink)" strokeWidth="2.5" />
      )}
      {mark === 'vertical' && (
        <line x1="12" y1="3" x2="12" y2="21" stroke="var(--ink)" strokeWidth="2.5" />
      )}
    </svg>
  );
}
