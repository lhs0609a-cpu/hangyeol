import { describe, expect, it } from 'vitest';
import {
  contentSecurityPolicy,
  cspNonce,
  securityHeaders,
  STATIC_SECURITY_HEADERS,
} from '../src/security-headers.js';

/*
 * 09번 문서 §6 의 보안 헤더.
 *
 * 이 검사가 있는 이유: CSP 는 한 줄만 느슨해져도 조용히 무력해진다.
 * "동작하니까 괜찮다" 로는 알 수 없다 — 막혀야 할 것이 막히는지를 봐야 한다.
 */

describe('CSP', () => {
  const csp = contentSecurityPolicy('n0nce');

  it('스크립트는 우리 출처와 이번 요청의 nonce 만 허용한다', () => {
    expect(csp).toContain("script-src 'self' 'nonce-n0nce'");
  });

  it('스크립트에 unsafe-inline 도 unsafe-eval 도 없다 — 문서가 금지한 항목이다', () => {
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src'))!;
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('프레임·오브젝트를 닫고 클릭재킹을 막는다', () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    // 09번 §1 R6 — 우리 화면의 폼이 남의 서버로 값을 보내지 않는다.
    expect(csp).toContain("form-action 'self'");
  });

  it('nonce 는 요청마다 다르다', () => {
    expect(cspNonce()).not.toBe(cspNonce());
  });
});

describe('고정 헤더', () => {
  it('HSTS 가 서브도메인까지 덮는다 — 학생 학습노트가 note.* 에 있다', () => {
    const hsts = STATIC_SECURITY_HEADERS['strict-transport-security']!;
    expect(hsts).toContain('includeSubDomains');
    // 2년. 짧게 잡으면 그 사이에 평문 접속이 한 번 열린다.
    expect(Number(/max-age=(\d+)/.exec(hsts)![1])).toBeGreaterThanOrEqual(31536000);
  });

  it('스니핑과 프레임을 막는다', () => {
    expect(STATIC_SECURITY_HEADERS['x-content-type-options']).toBe('nosniff');
    expect(STATIC_SECURITY_HEADERS['x-frame-options']).toBe('DENY');
  });

  it('두 앱이 거는 목록에 CSP 와 고정 헤더가 모두 들어 있다', () => {
    const all = securityHeaders('abc');
    for (const key of Object.keys(STATIC_SECURITY_HEADERS)) {
      expect(all[key], key).toBeDefined();
    }
    expect(all['content-security-policy']).toContain("'nonce-abc'");
  });
});
