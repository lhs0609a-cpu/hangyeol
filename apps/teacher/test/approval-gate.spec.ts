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
    expect(src).toMatch(/assertApproved\(teacher\)/);
  });

  it('승인 검사가 비밀번호 검증보다 뒤에 온다', () => {
    // 순서가 반대면 아무 이메일이나 넣어 가입 여부를 알아낼 수 있다.
    const pw = src.indexOf('verifyPassword');
    const gate = src.indexOf('assertApproved(teacher)');
    expect(pw).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(pw);
  });

  it('승인 실패 시 토큰을 만들지 않는다', () => {
    const gate = src.indexOf('assertApproved(teacher)');
    // import 줄이 아니라 호출부를 본다.
    const sign = src.indexOf('await signAccessToken(');
    expect(sign).toBeGreaterThan(-1);
    expect(sign).toBeGreaterThan(gate);
  });
});

/*
 * 승인 게이트가 로그인에만 있으면 로그인하는 순간에만 존재한다.
 *
 * 한 번 통과한 계정은 자격이 사라진 뒤에도 refresh 로 30일 동안
 * 새 access 를 계속 찍어 낼 수 있었다. 서명은 여전히 맞기 때문이다.
 */
describe('토큰 갱신도 승인을 다시 본다', () => {
  const src = read('apps/teacher/app/api/auth/refresh/route.ts');

  it('원장에서 approvalStatus 를 다시 읽는다', () => {
    expect(src).toMatch(/approvalStatus:\s*true/);
  });

  it('승인 검사를 거친다', () => {
    expect(src).toMatch(/assertApproved\(teacher\)/);
  });

  it('승인 검사보다 뒤에서 토큰을 만든다', () => {
    const gate = src.indexOf('assertApproved(teacher)');
    const sign = src.indexOf('await signAccessToken(');
    expect(gate).toBeGreaterThan(-1);
    expect(sign).toBeGreaterThan(gate);
  });

  it('로그인과 같은 판단을 쓴다 — 문구가 갈리면 한쪽만 고치게 된다', () => {
    const login = read('apps/teacher/app/api/auth/login/route.ts');
    for (const s of [login, src]) {
      expect(s).toMatch(/assertApproved/);
      // 각자 approved 문자열을 비교하고 있으면 판단이 두 벌이라는 뜻이다.
      expect(s).not.toMatch(/approvalStatus !== 'approved'/);
    }
  });
});

/*
 * 발송기가 없다(docs/12 D-004). 승인해도 notification 행만 쌓인다.
 * 화면이 "메일로 알려 드릴게요" 라고 말하면 기다리는 사람은
 * 오지 않는 메일을 기다리다 승인이 안 난 줄 안다.
 */
describe('보내지 않는 메일을 약속하지 않는다', () => {
  const screens = [
    'apps/teacher/app/signup/page.tsx',
    'apps/teacher/app/login/page.tsx',
    'apps/teacher/app/api/auth/login/route.ts',
    'packages/core/src/guard.ts',
  ];

  /*
   * 주석은 뺀다. 왜 그 문구를 지웠는지 적어 두려면 옛 문구를 그대로 인용해야 하는데,
   * 인용까지 잡으면 기록을 남기지 못하게 된다. 화면에 나가는 것만 본다.
   */
  const withoutComments = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('승인 결과를 메일로 보낸다고 적지 않는다', () => {
    for (const f of screens) {
      expect(withoutComments(read(f)), f).not.toMatch(/이메일로 알려|메일로 알려|주소로 보냅니다/);
    }
  });

  it('신청 완료 화면은 관리자 승인과 로그인을 말한다', () => {
    const signup = read('apps/teacher/app/signup/page.tsx');
    expect(signup).toMatch(/관리자가 신청 내용을 확인한 뒤 승인/);
    expect(signup).toMatch(/로그인할 수 있어요/);
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
