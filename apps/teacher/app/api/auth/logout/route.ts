import { clearCookie, handle, json, TEACHER_COOKIE, TEACHER_REFRESH_COOKIE } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/*
 * POST /api/auth/logout
 *
 * 쿠키를 지우는 것이 전부다. 서버에 세션 저장소가 없으므로
 * 토큰 무효화는 못 한다 — access 는 30분이라 그 안에 만료된다.
 * refresh 를 서버에서 폐기하는 건 세션 테이블이 생긴 뒤의 일이다.
 */
export function POST() {
  return handle(async () => {
    const headers = new Headers();
    headers.append('set-cookie', clearCookie(TEACHER_COOKIE));
    headers.append('set-cookie', clearCookie(TEACHER_REFRESH_COOKIE));
    return json({ ok: true }, { headers });
  });
}
