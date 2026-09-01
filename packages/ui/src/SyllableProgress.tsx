/*
 * SyllableProgress — 06번 문서 §4.7, 이 제품의 시그니처.
 *
 * 오늘 과제 4개가 '한' 글자를 획 단위로 완성한다.
 * 왜 링이 아닌가: 한글이 조립되는 문자라는 사실 자체가 진도 표시가 된다.
 * 부수 효과로 학생이 매일 초성·중성·종성 구조를 본다. 다른 제품은 이걸 못 쓴다.
 */

/** 6획을 4과제에 매핑한다. 과제 하나가 획 하나 이상을 그을 수 있다. */
const STROKE_TO_TASK = [0, 0, 1, 2, 2, 3];

interface Stroke {
  d?: string;
  circle?: { cx: number; cy: number; r: number };
  length: number;
}

const STROKES: Stroke[] = [
  { d: 'M30 13 H44', length: 14 }, // ㅎ 꼭지
  { d: 'M16 26 H56', length: 40 }, // ㅎ 가로획
  { circle: { cx: 36, cy: 41, r: 13 }, length: 2 * Math.PI * 13 }, // ㅎ 원
  { d: 'M76 8 V60', length: 52 }, // ㅏ 세로획
  { d: 'M63 34 H76', length: 13 }, // ㅏ 짧은획
  { d: 'M16 66 V90 H84', length: 24 + 68 }, // ㄴ
];

export function SyllableProgress({ done, size = 118 }: { done: number; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`오늘 과제 ${done}개 완료 · 총 4개`}
    >
      {/* 자모 블록 은유 — 글자가 네모 칸 안에 조립된다 */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="10"
        fill="none"
        stroke="var(--hanji-rule)"
        strokeWidth="1.5"
      />

      {STROKES.map((stroke, i) => {
        const complete = STROKE_TO_TASK[i]! < done;
        const common = {
          stroke: complete ? 'var(--ink)' : 'var(--hanji-rule)',
          strokeWidth: 7,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          fill: 'none',
          opacity: complete ? 1 : 0.5,
          strokeDasharray: stroke.length,
          // 미완료 획은 아예 그려지지 않은 상태로 둔다.
          strokeDashoffset: complete ? 0 : stroke.length,
          style: complete
            ? {
                animation: `hg-write .5s ease-out ${STROKE_TO_TASK[i]! * 0.06}s both`,
              }
            : undefined,
        };

        return stroke.circle ? (
          <circle key={i} {...stroke.circle} {...common} />
        ) : (
          <path key={i} d={stroke.d} {...common} />
        );
      })}
    </svg>
  );
}
