import { NextResponse, type NextRequest } from 'next/server';
import { cspNonce, securityHeaders } from '@hangyeol/shared';

/*
 * 학생 학습노트의 보안 헤더 — 09번 문서 §6.
 *
 * 강사 앱과 달리 여기에는 로그인 게이트가 없다. 학생은 비밀번호가 없고,
 * 매직링크가 세션 쿠키로 바뀌면 그 쿠키가 신원이다(API 가 다시 검증한다).
 * 그래서 이 미들웨어가 하는 일은 하나다 — 요청마다 CSP 를 건다.
 *
 * 학생 화면이 더 중요하다. 여기 쿠키 하나가 그 학생의 학습 기록 전부를 연다.
 */
export function middleware(req: NextRequest) {
  const nonce = cspNonce();
  const applied = securityHeaders(nonce);

  const headers = new Headers(req.headers);
  headers.set('x-nonce', nonce);
  // Next 가 자기 인라인 스크립트에 이 nonce 를 붙인다. 요청 헤더에 넣어야 읽는다.
  headers.set('content-security-policy', applied['content-security-policy']!);

  const res = NextResponse.next({ request: { headers } });
  for (const [key, value] of Object.entries(applied)) res.headers.set(key, value);
  return res;
}

export const config = {
  /*
   * API 는 JSON 만 돌려주므로 CSP 를 걸 대상이 아니다.
   * 정적 자산도 뺀다 — 이미지마다 헤더를 붙일 이유가 없고,
   * 학생 화면의 교재 그림이 여기 걸려 안 뜨는 일이 강사 앱에서 실제로 있었다.
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|photos).*)'],
};
