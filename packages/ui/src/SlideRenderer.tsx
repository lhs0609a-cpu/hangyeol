import type { CSSProperties } from 'react';

/*
 * 슬라이드 렌더러 — 06번 문서의 시각 언어로 그린다.
 *
 * 장식이 없다. 그라디언트도, 그림자도, 아이콘도 없다.
 * 선은 전부 의미를 갖고, 강조는 색 하나로만 한다.
 *
 * 한 화면에 한 가지만 둔다. 수업 중에 학생이 보는 화면이라
 * 정보가 두 개면 둘 다 안 읽힌다.
 */

export type SlideKind =
  | 'cover'
  | 'goal'
  | 'review'
  | 'dialogue'
  | 'form'
  | 'vocab'
  | 'drill'
  | 'roleplay'
  | 'expand'
  | 'wrap';

export interface SlideView {
  no: number;
  kind: SlideKind;
  eyebrow: string;
  headline?: string;
  lines?: string[];
  chips?: string[];
  imageAssetId?: string;
  teacherNote?: string;
}

/** 종류별 강조색. 06번 §1 의 의미 매핑을 그대로 따른다. */
const ACCENT: Record<SlideKind, string> = {
  cover: 'var(--ink)',
  goal: 'var(--jade)',
  review: 'var(--chija)',
  dialogue: 'var(--ink-2)',
  form: 'var(--indigo)',
  vocab: 'var(--indigo)',
  drill: 'var(--indigo)',
  roleplay: 'var(--indigo)',
  expand: 'var(--jade)',
  wrap: 'var(--ink-2)',
};

export interface SlideRendererProps {
  slide: SlideView;
  /** 워터마크 문구. 서버 합성이 붙기 전까지 화면에도 표시한다. */
  watermark?: string;
  /** 업로드된 이미지 URL. 없으면 글자만으로 성립한다. */
  imageUrl?: string;
}

export function SlideRenderer({ slide, watermark, imageUrl }: SlideRendererProps) {
  const accent = ACCENT[slide.kind];

  return (
    <div
      // 자료는 못 빼간다 — 09번 §3. 선택·드래그·우클릭을 막는다.
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        background: 'var(--surface)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: '5.5% 6%',
      }}
    >
      {imageUrl && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            // 글자가 읽혀야 한다. 그림은 배경이다.
            opacity: 0.14,
          }}
        />
      )}

      {/* 좌측 획 — 종류를 색 하나로 알린다 */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }}
      />

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="t-eyebrow" style={{ color: accent }}>
          {slide.eyebrow}
        </div>

        <Body slide={slide} accent={accent} />
      </div>

      {/* 09번 §3 U3 — 최종 형태는 서버 합성이다. 이건 화면 표시용이다. */}
      {watermark && (
        <div
          className="t-caption"
          style={{ position: 'absolute', right: '2.5%', bottom: '3%', opacity: 0.75 }}
        >
          {watermark} · 다운로드 불가
        </div>
      )}

      <div className="t-eyebrow" style={{ position: 'absolute', left: '2.5%', bottom: '3%' }}>
        {String(slide.no).padStart(2, '0')}
      </div>
    </div>
  );
}

function Body({ slide, accent }: { slide: SlideView; accent: string }) {
  const center: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  // 표지·목표는 한 문장만 크게. 이 화면에서 다른 걸 읽게 하지 않는다.
  if (slide.kind === 'cover' || slide.kind === 'goal') {
    return (
      <div style={center}>
        <div
          style={{
            fontSize: 'var(--fs-h1)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.35,
            color: slide.kind === 'goal' ? accent : 'var(--ink)',
          }}
        >
          {slide.headline}
        </div>
      </div>
    );
  }

  if (slide.chips && slide.chips.length > 0) {
    return (
      <div style={{ ...center, gap: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {slide.chips.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 'var(--fs-h2)',
                fontWeight: 500,
                padding: '8px 14px',
                borderRadius: 'var(--r-md)',
                border: `1px solid ${accent}`,
                color: accent,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...center, gap: 8 }}>
      {slide.headline && (
        <div
          style={{
            fontSize: 'var(--fs-h1)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: accent,
            marginBottom: 4,
          }}
        >
          {slide.headline}
        </div>
      )}

      {slide.lines?.map((line, i) => (
        <div
          key={i}
          style={{
            fontSize: 'var(--fs-h2)',
            lineHeight: 1.6,
            // 대화는 화자가 번갈아 나온다. 들여쓰기로 구분한다.
            paddingLeft: slide.kind === 'dialogue' && i % 2 === 1 ? '8%' : 0,
            color: slide.kind === 'dialogue' && i % 2 === 1 ? 'var(--ink-2)' : 'var(--ink)',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

/** 강사에게만 보이는 진행 지시. 학생 화면에는 나가지 않는다. */
export function TeacherNote({ note }: { note: string }) {
  return (
    <div
      className="t-body-sm"
      style={{
        marginTop: 10,
        padding: '9px 12px',
        background: 'var(--chija-w)',
        color: 'var(--chija)',
        borderRadius: 'var(--r-sm)',
      }}
    >
      {note}
    </div>
  );
}
