import type { CSSProperties } from 'react';

/*
 * 사진 틀 — 06번 문서 §3.
 *
 * 사진을 <img> 로 그냥 놓으면 세 가지가 매번 어긋난다.
 *   1. 비율. 원본 비율대로 흐르면 옆 칸과 밑선이 안 맞는다.
 *   2. 자리. width/height 없이 놓으면 사진이 뜨는 순간 아래 글이 밀린다.
 *   3. 테두리. 종이색 배경 위에서 밝은 사진은 경계가 사라진다.
 *
 * 그래서 틀을 하나만 두고 전부 여기를 지난다.
 * 그림자는 쓰지 않는다 — 06번 §3 이 구분은 1px 선으로 하라고 정했다.
 *
 * caption 은 장식이 아니다. 사진이 왜 거기 있는지 한 줄로 말한다.
 * 없으면 읽는 사람이 "이건 왜 있지" 를 스스로 물어야 한다.
 */

export type PhotoTone = 'paper' | 'ink';

export interface PhotoFrameProps {
  src: string;
  alt: string;
  /** 저장된 실제 화소. 자리를 미리 잡는 데 쓴다. */
  width: number;
  height: number;
  /** 틀의 비율. 원본과 달라도 된다 — 잘라서 채운다. */
  aspect?: string;
  /** 잘릴 때 어디를 남길지. 얼굴이 위에 있으면 'center top'. */
  focus?: string;
  /** 사진이 놓이는 바닥. 먹 구간에서는 테두리가 밝으면 안 된다. */
  tone?: PhotoTone;
  /** 히어로 사진만 true. 나머지는 스크롤해야 보이므로 미리 받지 않는다. */
  eager?: boolean;
  caption?: string;
  style?: CSSProperties;
}

export function PhotoFrame({
  src,
  alt,
  width,
  height,
  aspect,
  focus = 'center',
  tone = 'paper',
  eager = false,
  caption,
  style,
}: PhotoFrameProps) {
  const line = tone === 'ink' ? 'var(--on-ink-rule)' : 'var(--rule)';

  return (
    <figure style={{ margin: 0, ...style }}>
      {/* alt 를 첫 속성으로 둔다 — design-check 가 여는 태그와 같은 줄에서만 찾는다 */}
      <img alt={alt}
        src={src}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{
          display: 'block',
          width: '100%',
          height: aspect ? '100%' : 'auto',
          aspectRatio: aspect,
          objectFit: 'cover',
          objectPosition: focus,
          borderRadius: 'var(--r-lg)',
          border: `1px solid ${line}`,
          /* 사진이 도착하기 전 흰 구멍이 뚫리지 않도록 자리를 채워 둔다 */
          background: tone === 'ink' ? 'var(--on-ink-rule)' : 'var(--rule-soft)',
        }}
      />

      {caption && (
        <figcaption
          style={{
            fontSize: 'var(--fs-caption)',
            lineHeight: 1.7,
            color: tone === 'ink' ? 'var(--on-ink-2)' : 'var(--ink-4)',
            margin: '10px 0 0',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
