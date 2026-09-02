import { NextResponse, type NextRequest } from 'next/server';

/*
 * 로그인 게이트.
 *
 * 이게 없으면 /today · /students · /billing 이 로그인 없이 그냥 열린다.
 * 화면이 열리는 것 자체가 문제다 — 데이터가 안 보여도 제품 구조가 다 노출되고,
 * 무엇보다 "로그인했는지 아닌지" 를 앱이 모르는 상태가 된다.
 *
 * 미들웨어에서 막는 이유: 페이지마다 검사를 넣으면 반드시 하나를 빠뜨린다.
 * 새 화면을 추가할 때 아무것도 안 해도 보호되는 쪽이 맞다.
 *
 * 여기서는 쿠키가 있는지만 본다. 서명 검증은 하지 않는다 —
 * 미들웨어는 Edge 런타임이라 jose 의 Node 의존을 끌고 오기 어렵고,
 * 무엇보다 실제 데이터는 API 와 서버 컴포넌트가 다시 검증한다.
 * 여기는 "로그인 화면으로 돌려보내는" 역할까지만 한다.
 */

/** 로그인 없이 볼 수 있는 곳. 이 목록에 없으면 전부 막힌다. */
const PUBLIC = ['/', '/login', '/signup', '/licenses'];

const COOKIE = 'hg_access';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(COOKIE)?.value);

  // 이미 로그인했는데 로그인·가입 화면에 오면 앱으로 보낸다.
  if (hasSession && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/today', req.url));
  }

  if (PUBLIC.includes(pathname)) return NextResponse.next();
  if (hasSession) return NextResponse.next();

  /*
   * 어디로 가려 했는지 기억한다. 로그인 뒤에 그 화면으로 돌려보내야
   * "링크를 눌렀는데 홈으로 떨어지는" 일이 안 생긴다.
   */
  const login = new URL('/login', req.url);
  login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  /*
   * API 는 제외한다. 각 라우트가 requireTeacher / requireAdmin 으로
   * 직접 검증하고, 리다이렉트가 아니라 401 을 줘야 하기 때문이다.
   * 정적 자산과 파비콘도 제외한다.
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
