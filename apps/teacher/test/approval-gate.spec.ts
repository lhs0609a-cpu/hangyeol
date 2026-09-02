import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/*
 * 승인 게이트 회귀 검사.
 *
 * 이건 실행 검사가 아니라 소스 검사다. DB 없이 라우트를 부를 수 없어서다.
 * 그래도 두는 이유: 이 게이트가 뚫리면 교재가 승인 없이 통째로 나간다.
 * 되돌릴 방법이 없는 종류의 사고라, 약한 검사라도 있는 게 낫다.
 *
 * DB 가 붙으면 실제 요청으로 바꾼다.
 */

const read = (p: string) => readFileSync(p, 'utf8');

describe('가입은 토큰을 주지 않는다', () => {
  const src = read('apps/teacher/app/api/auth/signup/route.ts');

  it('가입 응답에 access/refresh 토큰이 없다', () => {
    // 가입 즉시 로그인시키면 승인제가 이름만 남는다.
    expect(src).not.toMatch(/signAccessToken|signRefreshToken/);
  });

  it('승인 상태를 pending 으로 만든다', () => {
    expect(src).toMatch(/approvalStatus:\s*'pending'/);
  });
});

describe('로그인은 승인 전 계정을 막는다', () => {
  const src = read('apps/teacher/app/api/auth/login/route.ts');

  it('approvalStatus 를 조회한다', () => {
    expect(src).toMatch(/approvalStatus:\s*true/);
  });

  it('approved 가 아니면 던진다', () => {
    expect(src).toMatch(/approvalStatus !== 'approved'/);
  });

  it('승인 검사가 비밀번호 검증보다 뒤에 온다', () => {
    // 순서가 반대면 아무 이메일이나 넣어 가입 여부를 알아낼 수 있다.
    const pw = src.indexOf('verifyPassword');
    const gate = src.indexOf("approvalStatus !== 'approved'");
    expect(pw).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(pw);
  });

  it('승인 실패 시 토큰을 만들지 않는다', () => {
    const gate = src.indexOf("approvalStatus !== 'approved'");
    // import 줄이 아니라 호출부를 본다.
    const sign = src.indexOf('await signAccessToken(');
    expect(sign).toBeGreaterThan(-1);
    expect(sign).toBeGreaterThan(gate);
  });
});

describe('관리자 API 는 전부 관리자만 통과한다', () => {
  const routes = [
    'apps/teacher/app/api/admin/teachers/route.ts',
    'apps/teacher/app/api/admin/metrics/route.ts',
    'apps/teacher/app/api/admin/images/route.ts',
    'apps/teacher/app/api/admin/images/[assetId]/route.ts',
  ];

  it('모든 관리자 라우트가 requireAdmin 을 부른다', () => {
    // requireTeacher 로는 부족하다. 그건 "로그인한 강사" 까지만 본다.
    // 강사 아무나 통과하면 자기 계정을 스스로 승인할 수 있다.
    for (const r of routes) {
      expect(read(r), r).toMatch(/await requireAdmin\(req\)/);
    }
  });

  it('관리자 라우트에 requireTeacher 가 남아 있지 않다', () => {
    for (const r of routes) {
      expect(read(r), r).not.toMatch(/requireTeacher/);
    }
  });

  it('허용목록이 비면 전부 거부한다 — 열어 두는 쪽으로 실패하지 않는다', () => {
    const guard = read('packages/core/src/guard.ts');
    expect(guard).toMatch(/allowed\.size === 0 \|\|/);
  });
});

describe('관리자 승인 API', () => {
  const src = read('apps/teacher/app/api/admin/teachers/route.ts');

  it('거절에는 사유를 강제한다', () => {
    // 사유가 강사에게 그대로 간다. 빈 문자열이 나가면 안 된다.
    expect(src).toMatch(/decision === 'rejected' && !body\.reason/);
  });

  it('이미 처리된 신청을 다시 뒤집지 않는다', () => {
    expect(src).toMatch(/approvalStatus !== 'pending'/);
  });

  it('승인 판단에 필요 없는 개인정보를 내려보내지 않는다', () => {
    // 09번 문서의 관리자 게이트(IP 허용목록 + 2FA)가 아직 없다.
    const selectBlock = src.slice(src.indexOf('select: {'), src.indexOf('});'));
    for (const field of ['phone', 'passwordHash', 'hourlyRateUsd']) {
      expect(selectBlock, field).not.toContain(field);
    }
  });
});
