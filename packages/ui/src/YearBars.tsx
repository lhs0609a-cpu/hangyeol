/*
 * 연도별 막대 — 13번 문서 §4, 그래프 A.
 *
 * 왜 라이브러리를 안 쓰는가.
 *
 * 이 그래프 하나 때문에 차트 라이브러리를 넣으면 랜딩의 자바스크립트가
 * 수백 KB 늘어난다. 로그인하지 않은 방문자가 처음 받는 화면이 그것이다.
 * 막대 아홉 개를 그리는 데 필요한 것은 div 아홉 개와 나눗셈 하나뿐이다.
 * 서버에서 렌더되고 클라이언트 JS 가 0 이다.
 *
 * ── 호버 툴팁이 없는 대신 표가 있다 ──────────────────────
 *
 * 툴팁을 붙이려면 'use client' 가 필요하고, 06번 §6 은 랜딩에서
 * 페이지 모션을 금지한다. 그래서 값을 감추지 않는 쪽을 택했다 —
 * 주요 막대에는 수치를 직접 찍고, 전체 수치는 <details> 안의 표에 둔다.
 * <details> 는 네이티브 HTML 이라 스크립트가 필요 없고,
 * 키보드로 열리고 스크린리더가 읽는다(06번 §7).
 *
 * ── 결측 연도를 잇지 않는다 ─────────────────────────────
 *
 * 빠진 해를 앞뒤로 이어 그리면 없는 데이터가 있는 것처럼 보인다.
 * 이 조각은 받은 점만 순서대로 세우고, 빠진 해가 있다는 사실은
 * 부르는 쪽이 missing 문장으로 화면에 밝힌다.
 */

export interface YearBarPoint {
  year: number;
  value: number;
  /** 그 해에만 붙는 짧은 설명. 있으면 막대 위에 수치를 함께 찍는다. */
  mark?: string;
}

export interface YearBarsProps {
  points: readonly YearBarPoint[];
  /** 값 옆에 붙는 단위. 표 머리글에 쓴다. */
  unit: string;
  /** 표를 여는 줄. 이 그래프가 무엇을 센 것인지 말한다. */
  tableLabel: string;
}

/** 3자리마다 쉼표. 큰 수는 이게 없으면 자릿수를 세게 된다. */
function comma(n: number): string {
  return n.toLocaleString('ko-KR');
}

export function YearBars({ points, unit, tableLabel }: YearBarsProps) {
  const max = Math.max(...points.map((p) => p.value));

  /*
   * 축 눈금은 최댓값 위쪽 하나면 족하다.
   * 격자를 여러 줄 깔면 막대보다 격자가 먼저 보인다 — 06번 §0 의 반대다.
   */
  const ceiling = Math.ceil(max / 100000) * 100000;

  return (
    <figure style={{ margin: 0 }}>
      <div
        role="img"
        aria-label={`${tableLabel}. ${points
          .map((p) => `${p.year}년 ${comma(p.value)}${unit}`)
          .join(', ')}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${points.length}, 1fr)`,
          /* 막대 사이 2px 표면 간격. 붙여 두면 두 막대가 한 덩어리로 읽힌다 */
          gap: 'clamp(4px, 1vw, 10px)',
          alignItems: 'end',
          height: 'clamp(180px, 26vw, 260px)',
          borderBottom: '1px solid var(--rule)',
          /* 눈금선 하나. 최댓값 위에 얇게 */
          borderTop: '1px dashed var(--rule-soft)',
          paddingTop: 6,
        }}
      >
        {points.map((p) => {
          const h = (p.value / ceiling) * 100;
          const strong = Boolean(p.mark);

          return (
            <div
              key={p.year}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                height: '100%',
              }}
            >
              {/*
               * 수치는 표시할 해에만 찍는다. 전부 찍으면 숫자가 그래프를 덮는다.
               * dataviz 규칙 — 직접 라벨은 선택적으로.
               */}
              {strong && (
                <span
                  className="mono"
                  style={{
                    fontSize: 'var(--fs-eyebrow)',
                    color: 'var(--ink-2)',
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {comma(p.value)}
                </span>
              )}

              <span
                aria-hidden="true"
                style={{
                  width: '100%',
                  height: `${h}%`,
                  /* 데이터 끝만 둥글게. 기준선 쪽은 각이 서야 바닥에 붙어 보인다 */
                  borderRadius: '4px 4px 0 0',
                  background: strong ? 'var(--indigo)' : 'var(--indigo-2)',
                  opacity: strong ? 1 : 0.55,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 연도 축. 막대와 같은 격자를 써야 눈금이 막대 가운데에 선다 */}
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${points.length}, 1fr)`,
          gap: 'clamp(4px, 1vw, 10px)',
          marginTop: 8,
        }}
      >
        {points.map((p) => (
          <span
            key={p.year}
            className="mono"
            style={{
              fontSize: 'var(--fs-eyebrow)',
              color: 'var(--ink-4)',
              textAlign: 'center',
            }}
          >
            {String(p.year).slice(2)}
          </span>
        ))}
      </div>

      {/*
       * 이유가 붙은 해만 아래에 한 줄로 모은다.
       * 2020년 급락에 "코로나" 를 안 적으면 수요가 꺾인 것으로 읽힌다.
       */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'clamp(10px, 2vw, 20px)',
          marginTop: 12,
        }}
      >
        {points
          .filter((p) => p.mark)
          .map((p) => (
            <span
              key={p.year}
              style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-3)' }}
            >
              <span className="mono">{p.year}</span> {p.mark}
            </span>
          ))}
      </div>

      <DataTable points={points} unit={unit} label={tableLabel} />
    </figure>
  );
}

/**
 * 숫자 그대로 보기.
 *
 * 그래프는 추세를 보이고 표는 값을 준다. 둘 다 있어야 한다 —
 * 06번 §7 이 요구하는 접근성 항목이면서, 동시에 신뢰의 문제다.
 * 값을 감춘 그래프는 언제나 무언가를 감춘 것처럼 보인다.
 */
function DataTable({
  points,
  unit,
  label,
}: {
  points: readonly YearBarPoint[];
  unit: string;
  label: string;
}) {
  return (
    <details style={{ marginTop: 14 }}>
      <summary
        style={{
          fontSize: 'var(--fs-caption)',
          color: 'var(--ink-3)',
          cursor: 'pointer',
        }}
      >
        숫자로 보기
      </summary>

      <table
        style={{
          borderCollapse: 'collapse',
          marginTop: 10,
          fontSize: 'var(--fs-caption)',
        }}
      >
        <caption
          style={{
            textAlign: 'left',
            color: 'var(--ink-4)',
            paddingBottom: 6,
            fontSize: 'var(--fs-caption)',
          }}
        >
          {label}
        </caption>
        <thead>
          <tr>
            <th style={TH}>연도</th>
            <th style={{ ...TH, textAlign: 'right' }}>{unit}</th>
            <th style={TH}>비고</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.year}>
              <td className="mono" style={TD}>
                {p.year}
              </td>
              <td className="mono" style={{ ...TD, textAlign: 'right' }}>
                {comma(p.value)}
              </td>
              <td style={{ ...TD, color: 'var(--ink-4)' }}>{p.mark ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

const TH = {
  textAlign: 'left',
  fontWeight: 'var(--fw-medium)',
  color: 'var(--ink-3)',
  padding: '4px 14px 4px 0',
  borderBottom: '1px solid var(--rule)',
} as const;

const TD = {
  padding: '4px 14px 4px 0',
  borderBottom: '1px solid var(--rule-soft)',
} as const;
