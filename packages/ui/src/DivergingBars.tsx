/*
 * 다이버징 막대 — 13번 문서 §4, 그래프 B.
 *
 * 이 랜딩에서 가장 센 한 장이다.
 *
 * 다른 구간은 "한국어가 인기 있다" 를 말한다. 방문자가 이미 아는 말이다.
 * 이 그래프만 "다른 언어는 전부 무너지는 중인데 한국어만 올라간다" 를 말한다.
 * 아는 사실을 반복하는 화면은 안 읽히고, 모르던 사실을 주는 화면에서 스크롤이 멈춘다.
 *
 * ── 형식을 이렇게 고른 이유 ─────────────────────────────
 *
 * 데이터의 일이 '극성' 이다 — 기준선 위인가 아래인가.
 * 극성에는 다이버징 막대를 쓴다. 세로 막대로 그리면 음수가 아래로 뻗어
 * 라벨 자리가 없어지므로 가로로 눕힌다.
 *
 * ── 색만으로 말하지 않는다 ──────────────────────────────
 *
 * 증가는 청자, 감소는 홍화다. 그런데 이 두 색은 색각 이상에서
 * ΔE 8.4 로 구분이 아슬아슬하다(13번 §4.2). 그래서 모든 줄에
 * 부호(+/−)와 수치를 직접 찍는다 — 색이 안 보여도 표가 읽힌다.
 * 06번 §1: "색만으로 의미를 전달하지 않는다."
 *
 * ── 강조와 편집의 차이 ──────────────────────────────────
 *
 * 한 줄만 진하게 하는 것은 강조지만, 불리한 줄을 빼는 것은 편집이다.
 * 이 조각은 강조만 하고, 무엇이 빠졌는지는 부르는 쪽이 캡션으로 밝힌다.
 */

export interface DivergingBar {
  label: string;
  /** 백분율 증감. 양수는 증가, 음수는 감소. */
  percent: number;
  /** 이야기의 주인공. 하나만 true 다. */
  emphasis?: boolean;
}

export interface DivergingBarsProps {
  bars: readonly DivergingBar[];
  /** 그래프 전체를 한 문장으로. 스크린리더가 이것을 읽는다. */
  ariaLabel: string;
}

export function DivergingBars({ bars, ariaLabel }: DivergingBarsProps) {
  /*
   * 양쪽 폭을 같은 척도로 잡는다.
   * 증가 쪽과 감소 쪽에 다른 척도를 쓰면 +38% 와 −34% 가 같은 길이로 보인다.
   * 그건 그래프가 아니라 거짓말이다.
   */
  const span = Math.max(...bars.map((b) => Math.abs(b.percent)));

  return (
    <div role="img" aria-label={ariaLabel}>
      {bars.map((b, i) => {
        const up = b.percent > 0;
        const width = (Math.abs(b.percent) / span) * 50; // 반쪽이 100%

        return (
          <div
            key={b.label}
            style={{
              display: 'grid',
              /* 이름칸을 고정한다 — 흐르게 두면 기준선이 줄마다 어긋난다 */
              gridTemplateColumns: 'clamp(72px, 12vw, 104px) 1fr clamp(58px, 9vw, 72px)',
              gap: 'clamp(10px, 1.6vw, 16px)',
              alignItems: 'center',
              padding: 'clamp(9px, 1.4vw, 13px) 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--fs-body-sm)',
                fontWeight: b.emphasis ? 'var(--fw-medium)' : 'var(--fw-regular)',
                color: b.emphasis ? 'var(--ink)' : 'var(--ink-2)',
              }}
            >
              {b.label}
            </span>

            {/* 막대 자리. 가운데가 0 이고 좌우로 뻗는다 */}
            <span
              aria-hidden="true"
              style={{ position: 'relative', display: 'block', height: 14 }}
            >
              {/* 기준선. 이 획이 없으면 0 이 어디인지 알 수 없다 */}
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: -3,
                  width: 1,
                  height: 20,
                  background: 'var(--rule)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 1,
                  height: 12,
                  width: `${width}%`,
                  ...(up
                    ? { left: '50%', borderRadius: '0 4px 4px 0' }
                    : { right: '50%', borderRadius: '4px 0 0 4px' }),
                  background: up ? 'var(--jade-chart)' : 'var(--honghwa-chart)',
                  opacity: b.emphasis ? 1 : 0.72,
                }}
              />
            </span>

            {/*
             * 부호와 수치. 색이 안 보여도 이 칸만으로 증감이 읽혀야 한다.
             * 부호를 생략하고 색으로만 말하면 색각 이상에서 그래프가 죽는다.
             */}
            <span
              className="mono"
              style={{
                fontSize: 'var(--fs-caption)',
                fontWeight: b.emphasis ? 'var(--fw-medium)' : 'var(--fw-regular)',
                color: b.emphasis ? 'var(--ink)' : 'var(--ink-3)',
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {up ? '+' : '−'}
              {Math.abs(b.percent).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
