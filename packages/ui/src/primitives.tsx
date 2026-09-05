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
    sm: { padding: '7px 12px', fontSize: 'var(--fs-body-sm)', borderRadius: 7 },
    md: { padding: '10px 16px', fontSize: 'var(--fs-body)', borderRadius: 8 },
    lg: { padding: '14px 16px', fontSize: 'var(--fs-body)', borderRadius: 8 },
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
        fontSize: 'var(--fs-eyebrow)',
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
            style={{ fontSize: 'var(--fs-eyebrow)', marginTop: 6, color: i <= current ? 'var(--ink-2)' : 'var(--ink-4)' }}
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
            <span style={{ fontSize: 'var(--fs-body-sm)', width: 88, color: 'var(--ink-2)' }}>{label}</span>
            <span
              className="mono"
              style={{ fontSize: 'var(--fs-body-sm)', width: 34, color: bad ? 'var(--honghwa)' : 'var(--ink-3)', fontWeight: bad ? 600 : 400 }}
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
      <div className="mono" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--ink-4)', marginTop: 4 }}>
        중앙 획 = 균형점 25%
      </div>
    </div>
  );
}

/*
 * 표식 — 훈민정음 해례본에서 떠 온 通 자.
 *
 * 이 글자를 고른 이유.
 *
 * SAMAT 은 「서르 ᄉᆞᄆᆞᆺ디 아니ᄒᆞᆯᄊᆡ」 의 '사맟다' = 통하다 에서 왔다.
 * 그 구절의 한문 원문이 「不相流通」 이고, 거기 通 이 있다.
 * 즉 이 표식은 이름을 그림으로 옮긴 것이 아니라, 이름이 나온 문장에서
 * 글자 하나를 그대로 떼어 온 것이다. 출처가 표식 안에 들어 있다.
 *
 * ── 어디서 왔는가 ───────────────────────────────────────
 *
 * 서울대 규장각 소장 해례본 스캔(위키미디어 공용, PD-1923 · PD-South Korea).
 * 원 저작물은 1446년이라 저작권이 소멸했고, 평면 저작물을 그대로 찍은
 * 복제물에는 새 저작권이 생기지 않는다. licenses.ts 의
 * hunminjeongeum-haerye-scan 에 확인 기록이 있다.
 *
 * 같은 문서의 국립한글박물관 전시 사진은 해상도가 훨씬 좋지만 CC BY-SA 4.0 이다.
 * 로고에 쓰면 동일조건변경허락이 파생물에 전염되므로 쓰지 않았다.
 *
 * ── 왜 이미지가 아니라 패스인가 ─────────────────────────
 *
 * 원본에서 이 글자가 차지하는 넓이는 74x72px 뿐이다. PNG 로 쓰면
 * 2배 화면에서 뭉개지고, 먹 바닥에 흰색으로 뒤집을 수도 없고,
 * 파비콘 크기로 줄이면 죽는다.
 *
 * 그래서 확대 → 종이 결 제거 → 이진화 → 윤곽 추출 순서로 벡터화했다.
 * 점을 더 줄일 수도 있었지만 그러면 목판 특유의 삐뚤함이 사라져
 * 그냥 명조체 通 처럼 보인다. 그 삐뚤함이 이 표식의 전부라서 남겼다.
 * 뽑아낸 과정은 13번 문서 §6 에 적혀 있다.
 *
 * fillRule 이 evenodd 인 이유: 用 안쪽의 가로획 사이 공간이 구멍이다.
 * nonzero 로 두면 구멍이 메워져 검은 덩어리가 된다.
 */
const TONG_PATH =
  'M19.46,28.89L19.46,29.31L20.00,30.28L21.08,31.39L22.57,32.22L23.65,33.33L24.19,34.72L25.14,34.86L25.68,34.58L26.76,34.58L28.78,35.28L31.49,35.28L32.57,34.72L33.24,33.75L33.24,33.33L33.38,33.19L33.38,31.25L32.84,30.00L32.57,29.72L32.30,29.03L31.49,28.19L29.73,26.94L28.78,26.67L27.30,26.67L27.16,26.53L26.35,26.53L26.22,26.39L24.19,26.53L24.05,26.67L22.84,26.67L22.70,26.81L21.76,26.94L20.68,27.50L19.73,28.33ZM43.24,8.19L40.54,13.75L41.22,19.72L43.24,21.94L49.32,19.86L54.32,29.44L50.14,32.22L42.03,29.03L42.70,41.81L40.14,61.25L41.49,75.42L27.43,72.92L31.22,66.81L28.92,56.81L33.24,49.58L32.30,45.83L27.84,44.44L12.43,51.67L16.62,57.08L23.51,54.44L23.38,61.39L26.76,65.83L19.19,73.47L10.00,77.08L9.59,80.00L14.32,82.36L27.30,78.61L36.62,79.86L51.49,84.86L65.27,94.17L78.24,98.47L94.32,98.61L99.86,96.67L99.86,93.33L75.00,90.00L56.08,80.97L60.27,73.89L71.22,81.53L76.62,76.81L78.51,54.44L75.54,29.58L70.00,24.86L62.57,26.25L60.27,24.17L70.81,16.67L74.46,10.14L67.30,6.11L48.38,13.61ZM51.35,58.89L53.51,58.75L53.92,58.89L54.46,59.58L54.32,67.22L54.73,68.61L54.59,72.78L55.00,75.42L55.00,76.94L54.73,78.06L55.54,79.86L55.41,80.42L54.86,80.69L52.97,80.56L50.00,79.17L48.38,79.17L46.76,78.19L45.14,77.78L44.59,77.22L44.86,76.25L45.81,75.28L48.24,70.97L48.11,69.58L47.43,67.78L47.97,61.67L48.51,60.56L49.19,59.86ZM62.30,56.81L63.24,56.53L64.59,56.53L66.49,55.83L68.51,56.11L69.19,56.81L69.19,57.50L68.78,58.89L69.05,60.14L68.92,63.06L69.46,64.44L69.59,65.69L70.00,66.67L70.00,67.36L69.32,68.61L69.32,70.83L68.92,71.81L68.38,72.36L67.97,72.50L65.54,72.36L62.97,71.11L61.35,70.56L60.81,69.86L60.54,64.31L61.49,60.00L61.35,57.78ZM52.57,46.25L53.38,46.67L53.65,46.94L54.19,47.92L54.19,48.19L54.32,48.33L54.32,49.44L54.19,49.58L54.19,50.42L54.32,50.56L54.32,51.11L55.00,52.50L54.86,53.33L54.59,53.89L53.78,54.72L52.43,55.42L52.03,55.42L51.89,55.56L51.22,55.56L51.08,55.42L50.27,55.42L50.14,55.28L49.32,55.14L48.92,54.72L48.65,54.17L48.65,50.28L48.51,50.14L48.51,48.61L48.65,48.47L48.65,48.19L48.92,47.64L49.73,46.81L50.27,46.53L50.54,46.53L50.68,46.39L51.22,46.39L51.35,46.25ZM68.78,43.33L69.19,44.03L69.19,46.25L69.32,46.39L69.32,48.33L69.19,48.47L69.19,49.86L69.32,50.00L69.32,50.28L69.05,50.83L68.78,51.11L68.11,51.39L67.43,51.39L67.30,51.53L66.76,51.53L66.08,51.81L65.41,51.81L65.27,51.67L64.19,51.53L64.05,51.39L63.65,51.39L63.51,51.53L62.70,51.53L62.03,51.25L61.62,50.83L61.35,50.14L61.35,49.44L61.49,49.31L61.49,47.64L61.35,47.50L61.35,46.94L61.08,46.25L61.08,45.00L61.35,44.44L61.76,44.03L62.57,43.61L62.84,43.61L63.38,43.33L63.78,43.33L64.32,43.06L65.68,42.92L65.81,42.78L67.43,42.78L67.57,42.92L68.38,43.06ZM50.54,35.28L50.81,35.28L50.95,35.42L51.22,35.42L51.35,35.56L51.49,35.56L51.62,35.69L51.89,35.69L52.03,35.83L52.43,35.83L52.57,35.97L53.24,35.97L53.38,36.11L53.65,36.11L54.19,36.67L54.19,36.81L54.32,36.94L54.32,39.44L54.19,39.58L54.19,39.86L54.05,40.00L54.05,40.14L53.24,40.97L52.97,40.97L52.84,41.11L52.57,41.11L52.43,41.25L52.16,41.25L52.03,41.39L51.76,41.39L51.62,41.53L51.35,41.53L51.22,41.67L50.81,41.67L50.68,41.53L50.41,41.53L49.86,40.97L49.86,40.83L49.73,40.69L49.73,39.31L49.86,39.17L49.86,38.33L49.73,38.19L49.73,37.64L49.59,37.50L49.59,36.11L49.73,35.97L49.73,35.83L50.14,35.42L50.41,35.42ZM59.86,33.89L60.41,33.33L61.35,32.92L62.30,32.22L62.57,32.22L62.70,32.08L62.97,32.08L63.92,31.67L64.32,31.67L64.46,31.53L65.14,31.53L65.27,31.39L65.95,31.39L66.08,31.25L67.16,31.25L67.30,31.39L67.57,31.39L68.11,32.08L68.11,32.50L68.24,32.64L68.24,33.33L68.38,33.47L68.38,34.03L68.51,34.17L68.51,34.72L68.65,34.86L68.65,36.67L68.78,36.81L68.78,37.22L68.92,37.36L68.92,38.47L68.78,38.75L68.51,39.03L68.24,39.03L68.11,39.17L67.43,39.17L67.30,39.03L66.76,38.89L66.08,38.33L65.54,38.19L65.41,38.06L65.14,38.06L65.00,37.92L62.97,37.92L62.84,37.78L61.76,37.78L60.81,37.36L60.27,36.81L59.73,35.56L59.73,34.17ZM61.08,14.86L61.08,15.69L60.95,15.83L60.95,16.25L60.68,16.94L59.59,18.06L59.46,18.06L59.19,18.47L57.16,20.56L56.62,20.83L56.35,20.83L55.81,21.11L54.59,21.11L54.46,20.97L53.92,20.97L53.24,20.69L52.57,20.69L52.43,20.56L52.03,20.56L51.89,20.42L51.49,20.42L51.35,20.28L50.95,20.28L50.27,20.00L50.00,20.14L49.86,20.00L49.59,20.00L49.32,19.58L49.32,19.31L49.59,18.75L50.41,18.06L51.22,17.64L51.49,17.64L51.62,17.50L51.89,17.50L52.03,17.36L54.32,16.67L56.22,15.69L58.11,15.14L59.32,14.31L60.27,14.17L60.41,14.31L60.68,14.31Z';

export function Logo({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ display: 'block', flex: 'none' }}
    >
      {/* currentColor 로 칠한다 — 먹 구간에서는 부모가 흰색을 주면 흰 글자가 된다 */}
      <path d={TONG_PATH} fill="currentColor" fillRule="evenodd" />
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
      {note && <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 4 }}>{note}</div>}
    </Panel>
  );
}

/** 빈 화면은 초대다 (06번 §8). */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3)', fontSize: 'var(--fs-body)' }}>
      <p style={{ margin: 0 }}>{message}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
