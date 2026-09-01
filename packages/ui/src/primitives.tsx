import type { CSSProperties, ReactNode } from 'react';

/*
 * 06번 문서의 컴포넌트를 그대로 옮긴 것이다.
 *
 * 두 앱이 같은 타입 시스템을 쓰되 캔버스만 다르다(강사 콕핏 / 학생 다이어리).
 * 그래서 색은 CSS 변수로만 참조한다. 여기에 색을 박으면 두 레지스터가 섞인다.
 */

export type Tone = 'n' | 'i' | 'j' | 'c' | 'h';

const TONE_FG: Record<Tone, string> = {
  n: 'var(--ink-3)',
  i: 'var(--indigo)',
  j: 'var(--jade)',
  c: 'var(--chija)',
  h: 'var(--honghwa)',
};

const TONE_BG: Record<Tone, string> = {
  n: 'var(--rule-soft, #eff0f3)',
  i: 'var(--indigo-w)',
  j: 'var(--jade-w)',
  c: 'var(--chija-w)',
  h: 'var(--honghwa-w)',
};

/** 섹션 라벨. mono · 10px · .16em · uppercase. */
export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="eyebrow" style={style}>
      {children}
    </div>
  );
}

/** 카드에 그림자를 넣지 않는다. 구분은 1px 선으로 한다. */
export function Panel({
  children,
  variant = 'default',
  style,
}: {
  children: ReactNode;
  variant?: 'default' | 'dark' | 'warm';
  style?: CSSProperties;
}) {
  const base: CSSProperties = { borderRadius: 10, padding: 20 };
  const variants: Record<string, CSSProperties> = {
    default: { background: 'var(--surface)', border: '1px solid var(--rule)' },
    dark: { background: 'var(--ink)', border: 'none', color: '#fff' },
    warm: { background: 'var(--hanji-card)', border: '1px solid var(--hanji-rule)' },
  };
  return <section style={{ ...base, ...variants[variant], ...style }}>{children}</section>;
}

export type ButtonKind = 'primary' | 'indigo' | 'ghost' | 'quiet' | 'jade' | 'light';

const BUTTON_KIND: Record<ButtonKind, CSSProperties> = {
  primary: { background: 'var(--ink)', color: '#fff', border: '1px solid var(--ink)' },
  indigo: { background: 'var(--indigo)', color: '#fff', border: '1px solid var(--indigo)' },
  jade: { background: 'var(--jade)', color: '#fff', border: '1px solid var(--jade)' },
  ghost: { background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--rule)' },
  quiet: { background: 'transparent', color: 'var(--ink-3)', border: '1px solid transparent' },
  light: { background: '#fff', color: 'var(--ink)', border: 'none' },
};

export function Button({
  children,
  kind = 'ghost',
  size = 'md',
  full = false,
  disabled = false,
  onClick,
  type = 'button',
  style,
}: {
  children: ReactNode;
  kind?: ButtonKind;
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  style?: CSSProperties;
}) {
  const sizes: Record<string, CSSProperties> = {
    sm: { padding: '7px 12px', fontSize: 12, borderRadius: 7 },
    md: { padding: '10px 16px', fontSize: 13, borderRadius: 8 },
    lg: { padding: '14px 16px', fontSize: 14, borderRadius: 8 },
  };

  // 비활성은 ghost 스타일 + ink-4. disabled 커서를 쓰지 않는다 —
  // 왜 못 누르는지는 커서가 아니라 라벨이 말해야 한다 (06번 §4.2).
  const disabledStyle: CSSProperties = disabled
    ? { ...BUTTON_KIND.ghost, color: 'var(--ink-4)' }
    : BUTTON_KIND[kind];

  return (
    <button
      className="hg-tap"
      type={type}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      style={{
        ...sizes[size],
        ...disabledStyle,
        fontFamily: 'inherit',
        fontWeight: 600,
        cursor: 'pointer',
        width: full ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Tag({ children, tone = 'n' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className="mono"
      style={{
        display: 'inline-block',
        padding: '3px 7px',
        borderRadius: 3,
        fontSize: 10,
        background: TONE_BG[tone],
        color: TONE_FG[tone],
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/**
 * 획 스텝퍼 — 06번 §4.5.
 * 가로 균등 분할. 각 칸은 3px 막대 + mono 라벨. 완료/현재는 ink, 미도달은 rule.
 */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 8 }}>
      {steps.map((label, i) => (
        <div key={label}>
          <div
            style={{
              height: 3,
              borderRadius: 99,
              background: i <= current ? 'var(--ink)' : 'var(--rule)',
              transition: 'background .3s',
            }}
          />
          <div
            className="mono"
            style={{ fontSize: 10, marginTop: 6, color: i <= current ? 'var(--ink-2)' : 'var(--ink-4)' }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Strands {
  input: number;
  output: number;
  form: number;
  fluency: number;
}

/**
 * Four Strands 막대 — 06번 §4.6.
 *
 * 막대 폭 = value × 2 (%). 25%가 중앙에 오도록 한 것이다.
 * 중앙의 1px 세로 획이 균형점 25% 기준선.
 * 경고 기준: form > 25% · fluency < 25% · |input − 25| > 8
 */
export function StrandBars({ strands }: { strands: Strands }) {
  const rows: { key: keyof Strands; label: string; warn: (v: number) => boolean }[] = [
    { key: 'input', label: '의미중심 입력', warn: (v) => Math.abs(v - 25) > 8 },
    { key: 'output', label: '의미중심 출력', warn: (v) => Math.abs(v - 25) > 8 },
    { key: 'form', label: '언어중심 학습', warn: (v) => v > 25 },
    { key: 'fluency', label: '유창성 개발', warn: (v) => v < 25 },
  ];

  return (
    <div>
      {rows.map(({ key, label, warn }) => {
        const value = strands[key];
        const bad = warn(value);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, width: 88, color: 'var(--ink-2)' }}>{label}</span>
            <span
              className="mono"
              style={{ fontSize: 12, width: 34, color: bad ? 'var(--honghwa)' : 'var(--ink-3)', fontWeight: bad ? 600 : 400 }}
            >
              {value}%
            </span>
            <span style={{ position: 'relative', flex: 1, height: 11 }}>
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 0,
                  height: 5,
                  borderRadius: 99,
                  width: `${Math.min(100, value * 2)}%`,
                  background: bad ? 'var(--honghwa)' : 'var(--indigo)',
                }}
              />
              {/* 균형점 25% 기준선 */}
              <span
                style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: 11, background: 'var(--ink-3)' }}
                aria-hidden="true"
              />
            </span>
          </div>
        );
      })}
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 4 }}>
        중앙 획 = 균형점 25%
      </div>
    </div>
  );
}

/** 획으로 그린 로고. 아이콘 세트를 쓰지 않는다 (06번 §9). */
export function Logo({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M22 20 V80 M78 20 V80 M22 50 H78"
        stroke="var(--ink)"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Metric({
  eyebrow,
  value,
  note,
  size = 26,
}: {
  eyebrow: string;
  value: string;
  note?: string;
  size?: number;
}) {
  return (
    <Panel style={{ padding: 18 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mono" style={{ fontSize: size, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 8 }}>
        {value}
      </div>
      {note && <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 4 }}>{note}</div>}
    </Panel>
  );
}

/** 빈 화면은 초대다 (06번 §8). */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3)', fontSize: 13 }}>
      <p style={{ margin: 0 }}>{message}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
