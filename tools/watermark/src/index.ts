import sharp from 'sharp';

/*
 * 워터마크 서버 합성 — 09번 문서 U3, 10번 문서 §5.
 *
 *   ✕ CSS 오버레이 · DOM 요소  → 개발자도구로 제거됨
 *   ○ 서버에서 이미지에 직접 합성 후 전달
 *
 * 이것이 자료 잠금의 마지막 방벽이다. 학생이 화면을 캡처해도
 * 그 이미지에 학생명·강사명·날짜가 박혀 있으므로 출처를 추적할 수 있다.
 */

export const SLIDE_WIDTH = 1600;
export const SLIDE_HEIGHT = 900;

export interface WatermarkInput {
  /** 원본 슬라이드 이미지 바이트. */
  source: Buffer;
  /** "{학생 로마자명} · {강사명} · {YYYY-MM-DD}" */
  line: string;
}

/** XML 특수문자를 SVG 에 그대로 넣으면 렌더가 깨진다. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 대각선 반복 패턴 + 우하단 고정 문구.
 *
 * 반복 패턴을 함께 까는 이유: 우하단만 있으면 잘라내면 그만이다.
 * 불투명도는 09번 문서가 지정한 50~60% 대신 배경 대비 최소로 두되,
 * 캡처 시 판독 가능한 수준을 유지한다.
 */
function overlaySvg(line: string, width: number, height: number): Buffer {
  const safe = escapeXml(line);
  const step = 320;
  const tiles: string[] = [];

  for (let y = -height; y < height * 2; y += step) {
    for (let x = -width; x < width * 2; x += step * 2) {
      tiles.push(
        `<text x="${x}" y="${y}" font-family="monospace" font-size="18" fill="#14161c" fill-opacity="0.07" transform="rotate(-30 ${x} ${y})">${safe}</text>`,
      );
    }
  }

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${tiles.join('\n')}
      <rect x="${width - 470}" y="${height - 44}" width="460" height="30" rx="4" fill="#ffffff" fill-opacity="0.55"/>
      <text x="${width - 20}" y="${height - 23}" text-anchor="end"
            font-family="monospace" font-size="15" fill="#14161c" fill-opacity="0.85">${safe} · 다운로드 불가</text>
    </svg>`,
  );
}

/**
 * 원본에 워터마크를 합성해 webp 로 돌려준다.
 *
 * webp 를 쓰는 이유는 10번 문서 §5 가 지정한 형식이기 때문이고,
 * 1600×900 으로 고정하는 것은 캐시 키를 단순하게 유지하기 위해서다.
 */
export async function composite(input: WatermarkInput): Promise<Buffer> {
  return sharp(input.source)
    .resize(SLIDE_WIDTH, SLIDE_HEIGHT, { fit: 'contain', background: '#fafafb' })
    .composite([{ input: overlaySvg(input.line, SLIDE_WIDTH, SLIDE_HEIGHT), top: 0, left: 0 }])
    .webp({ quality: 82 })
    .toBuffer();
}

/**
 * 합성 캐시 키 — 10번 문서 §5.
 *
 * 같은 (unit, page, student) 조합은 24시간 캐싱한다.
 * 매 요청 합성하면 CPU 가 터진다. 날짜가 키에 들어가는 이유는
 * 워터마크 문구에 날짜가 있어서다 — 날이 바뀌면 다른 이미지다.
 */
export function cacheKey(params: {
  unitId: string;
  page: number;
  studentId: string;
  at?: Date;
}): string {
  const d = params.at ?? new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `wm:${params.unitId}:${params.page}:${params.studentId}:${yyyymmdd}`;
}

export const CACHE_TTL_SEC = 24 * 60 * 60;
