/**
 * 09번 문서 §6 — 전 구간 HTTPS · HSTS · CSP.
 *
 *   CSP: script-src 'self' 지정 CDN만, unsafe-inline 금지
 *
 * 스크립트에 unsafe-inline 을 허용하면 XSS 하나가 그대로 실행된다.
 * 학생 학습노트에는 매직링크 세션 쿠키가, 강사 앱에는 학생 개인정보가 있다.
 *
 * 그런데 Next 는 하이드레이션 데이터를 인라인 <script> 로 심는다.
 * 그래서 요청마다 nonce 를 만들어 그 스크립트에만 통행증을 준다 —
 * 우리가 심은 스크립트는 돌고, 주입된 스크립트는 통행증이 없어 죽는다.
 *
 * style-src 는 'unsafe-inline' 을 남긴다. 화면 전체가 style={{...}} 속성으로
 * 짜여 있고(06번 디자인 시스템이 토큰을 인라인으로 쓴다), 문서가 금지한 것도
 * script-src 쪽이다. 여기 적어 두지 않으면 나중에 "왜 스타일만 열어 뒀나" 를
 * 다시 조사하게 된다.
 *
 * 두 앱이 같은 규칙을 쓴다. 각자 적으면 한쪽만 고치는 날이 온다.
 */

/** 이미지·폰트가 나가는 곳. R2 서명 URL 은 배포 환경마다 호스트가 다르다. */
function assetHosts(): string {
  const account = process.env.R2_ACCOUNT_ID;
  const custom = process.env.ASSET_BASE_URL;

  return [
    account ? `https://${account}.r2.cloudflarestorage.com` : '',
    custom ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function contentSecurityPolicy(nonce: string): string {
  const assets = assetHosts();

  const directives = [
    `default-src 'self'`,
    // 우리 스크립트만. 인라인은 이 요청의 nonce 를 가진 것만 돈다.
    `script-src 'self' 'nonce-${nonce}'`,
    // 인라인 style 속성 — 06번 디자인 시스템이 쓰는 방식이다.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:${assets ? ` ${assets}` : ''}`,
    `font-src 'self' data:`,
    `connect-src 'self'${assets ? ` ${assets}` : ''}`,
    // 외부 스크립트도, 광고도, 임베드도 없다. 전부 닫는다.
    `frame-src 'none'`,
    `object-src 'none'`,
    `media-src 'self'`,
    `worker-src 'self' blob:`,
    // 09번 §1 R6 — 우리 화면이 남의 폼으로 값을 보내는 경로를 만들지 않는다.
    `form-action 'self'`,
    // 클릭재킹. X-Frame-Options 의 최신 형태다.
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    // http 로 남은 자원이 있으면 조용히 https 로 올린다.
    `upgrade-insecure-requests`,
  ];

  return directives.join('; ');
}

/**
 * CSP 를 뺀 나머지. 요청마다 달라지지 않는 값들이다.
 *
 * next.config 에 두지 않은 이유: 그 파일은 Node 가 직접 읽는다.
 * 워크스페이스의 TS 모듈을 가져오지 못하므로 두 앱에 각각 복사하게 되고,
 * 복사하면 한쪽만 고치는 날이 온다. 그래서 CSP 와 같은 자리(미들웨어)에서 건다.
 *
 * HSTS 는 2년 · 서브도메인 포함. 학생 학습노트가 note.* 서브도메인으로 가므로
 * includeSubDomains 가 빠지면 정작 보호해야 할 쪽이 빠진다.
 */
export const STATIC_SECURITY_HEADERS: Record<string, string> = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  // frame-ancestors 를 모르는 낡은 브라우저용. CSP 와 같은 말을 한 번 더 한다.
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  // 쓰지 않는 장치는 꺼 둔다. 발화 비율(02번 C-09)이 마이크만 같은 출처로 쓴다.
  'permissions-policy': 'camera=(), geolocation=(), payment=(), microphone=(self)',
};

/**
 * 요청 하나에 붙는 보안 헤더 전부 — CSP 와 고정 헤더를 한 번에 돌려준다.
 *
 * 두 앱의 미들웨어가 이것만 부른다. 한 앱에만 헤더를 추가하는 일이
 * 생기지 않게 하려고 목록을 여기서 완성해서 내보낸다.
 */
export function securityHeaders(nonce: string): Record<string, string> {
  return {
    ...STATIC_SECURITY_HEADERS,
    'content-security-policy': contentSecurityPolicy(nonce),
  };
}

/** Edge 런타임에서도 도는 난수. 요청 하나에 하나씩 쓴다. */
export function cspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
