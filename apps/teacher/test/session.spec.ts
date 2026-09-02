import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sessionCookie, clearCookie, TEACHER_COOKIE } from '@hangyeol/core';

/*
 * 세션 배선 검사.
 *
 * 전에는 토큰이 localStorage 에 있었다. 그러면 서버가 요청자를 모른다 —
 * 서버 컴포넌트도 미들웨어도 localStorage 를 못 읽기 때문이다.
 * 그 결과 화면은 로그인 여부와 무관하게 열렸고, 데이터는 "첫 번째 강사" 를
 * 집어 왔다. 강사가 두 명이 되는 순간 남의 학생 목록이 보이는 구조였다.
 */

const read = (p: string) => readFileSync(p, 'utf8');

describe('세션 쿠키', () => {
  it('HttpOnly 다 — JS 가 못 읽는다', () => {
    expect(sessionCookie(TEACHER_COOKIE, 'tok', 60)).toContain('HttpOnly');
  });

  it('SameSite=Lax 다 — CSRF 를 막으면서 외부 링크 진입은 유지한다', () => {
    expect(sessionCookie(TEACHER_COOKIE, 'tok', 60)).toContain('SameSite=Lax');
  });

  it('삭제 쿠키는 Max-Age 가 0 이다', () => {
    expect(clearCookie(TEACHER_COOKIE)).toContain('Max-Age=0');
  });

  it('개발 환경에서는 Secure 를 붙이지 않는다', () => {
    // localhost 는 http 라 Secure 를 붙이면 쿠키가 저장되지 않는다.
    expect(sessionCookie(TEACHER_COOKIE, 'tok', 60)).not.toContain('Secure');
  });
});

describe('로그인 게이트', () => {
  const mw = read('apps/teacher/middleware.ts');

  it('미들웨어가 있다', () => {
    expect(mw.length).toBeGreaterThan(0);
  });

  it('공개 화면은 명시적 허용목록이다 — 빠뜨리면 막히는 쪽이 맞다', () => {
    expect(mw).toMatch(/const PUBLIC = \[/);
  });

  it('API 는 미들웨어에서 제외한다 — 리다이렉트가 아니라 401 을 줘야 한다', () => {
    expect(mw).toMatch(/\(\?!api\|/);
  });

  it('로그인 뒤 원래 가려던 곳으로 돌려보낸다', () => {
    expect(mw).toMatch(/searchParams\.set\('next'/);
  });

  it('로그인 화면은 외부 주소로 튕기지 않는다', () => {
    const login = read('apps/teacher/app/login/page.tsx');
    // //evil.com 은 프로토콜 상대 주소라 외부로 나간다. 반드시 막는다.
    expect(login).toMatch(/startsWith\('\/'\)/);
    expect(login).toMatch(/!next\.startsWith\('\/\/'\)/);
  });
});

describe('데이터는 로그인한 강사의 것이어야 한다', () => {
  const data = read('apps/teacher/app/data.ts');

  it('findFirst 로 아무 강사나 집지 않는다', () => {
    expect(data).not.toMatch(/teacher\.findFirst/);
  });

  it('쿠키에서 강사를 식별한다', () => {
    expect(data).toMatch(/TEACHER_COOKIE/);
    expect(data).toMatch(/verifyAccessToken/);
  });
});

describe('클라이언트는 토큰을 들고 다니지 않는다', () => {
  const client = read('apps/teacher/app/api-client.ts');

  it('localStorage 에 토큰을 쓰지 않는다', () => {
    expect(client).not.toMatch(/localStorage\.setItem/);
  });

  it('Authorization 헤더를 직접 붙이지 않는다', () => {
    expect(client).not.toMatch(/authorization: `Bearer/);
  });

  it('401 이면 로그인으로 보낸다', () => {
    // 화면마다 처리하면 반드시 빠뜨리고, 이유 없이 빈 화면이 남는다.
    expect(client).toMatch(/res\.status === 401/);
  });

  it('앱 어디에도 토큰 저장이 남아 있지 않다', () => {
    for (const f of [
      'apps/teacher/app/login/page.tsx',
      'apps/teacher/app/settings/page.tsx',
      'apps/teacher/app/admin/images/page.tsx',
    ]) {
      expect(read(f), f).not.toMatch(/setToken|getToken|clearToken/);
    }
  });
});

describe('중복 헤더가 사라지지 않는다', () => {
  it('json 은 Headers 로 합친다', () => {
    // 객체 스프레드로 합치면 set-cookie 두 개 중 하나가 조용히 사라진다.
    const http = read('packages/core/src/http.ts');
    expect(http).toMatch(/new Headers\(init\?\.headers\)/);
  });
});
