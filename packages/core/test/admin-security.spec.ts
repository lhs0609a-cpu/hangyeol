import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  currentStep,
  ipMatches,
  otpauthUri,
  parseIpAllowlist,
  totpCode,
  totpSecret,
  TOTP_STEP_SEC,
  verifyTotp,
} from '../src/admin-security.js';

/*
 * 09번 문서 §6 — 관리자 2단계 인증과 IP 허용목록.
 *
 * TOTP 는 RFC 6238 의 시험 벡터로 검증한다. 우리가 만든 코드끼리만
 * 맞춰 보면 인증 앱과 어긋나도 테스트는 통과한다 — 그게 제일 나쁜 실패다.
 */

describe('Base32 (RFC 4648)', () => {
  // RFC 4648 §10 시험 벡터.
  const VECTORS: [string, string][] = [
    ['f', 'MY'],
    ['fo', 'MZXQ'],
    ['foo', 'MZXW6'],
    ['foob', 'MZXW6YQ'],
    ['fooba', 'MZXW6YTB'],
    ['foobar', 'MZXW6YTBOI'],
  ];

  it('RFC 4648 시험 벡터와 일치한다', () => {
    for (const [plain, encoded] of VECTORS) {
      expect(base32Encode(new TextEncoder().encode(plain)), plain).toBe(encoded);
      expect(new TextDecoder().decode(base32Decode(encoded)), encoded).toBe(plain);
    }
  });

  it('사람이 옮겨 적은 형태(공백·소문자·패딩)를 받아 준다', () => {
    expect(new TextDecoder().decode(base32Decode('mzxw 6ytb-oi==='))).toBe('foobar');
  });
});

describe('TOTP (RFC 6238)', () => {
  /*
   * RFC 6238 Appendix B 의 SHA-1 시험 벡터.
   * 시크릿은 ASCII "12345678901234567890" 이고, 표에는 8자리로 적혀 있다.
   * 우리는 6자리를 쓰므로 뒤 6자리와 비교한다.
   */
  const SECRET = base32Encode(new TextEncoder().encode('12345678901234567890'));
  const VECTORS: [number, string][] = [
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ];

  it('RFC 6238 시험 벡터와 일치한다', () => {
    for (const [unixSec, expected] of VECTORS) {
      const step = BigInt(Math.floor(unixSec / TOTP_STEP_SEC));
      expect(totpCode(SECRET, step), String(unixSec)).toBe(expected.slice(-6));
    }
  });

  it('맞으면 어느 칸의 코드였는지를 돌려준다 — 재사용 차단의 근거다', () => {
    const now = Date.UTC(2026, 8, 17, 3, 0, 0);
    const step = currentStep(now);
    expect(verifyTotp(SECRET, totpCode(SECRET, step), now)).toBe(step);
  });

  it('앞뒤 한 칸까지만 받는다 — 시계가 밀려도 열리고, 두 칸 전 코드는 죽는다', () => {
    const now = Date.UTC(2026, 8, 17, 3, 0, 0);
    const step = currentStep(now);

    expect(verifyTotp(SECRET, totpCode(SECRET, step - 1n), now)).toBe(step - 1n);
    expect(verifyTotp(SECRET, totpCode(SECRET, step + 1n), now)).toBe(step + 1n);
    expect(verifyTotp(SECRET, totpCode(SECRET, step - 2n), now)).toBeNull();
    expect(verifyTotp(SECRET, totpCode(SECRET, step + 2n), now)).toBeNull();
  });

  it('여섯 자리 숫자가 아니면 계산도 하지 않는다', () => {
    const now = Date.now();
    expect(verifyTotp(SECRET, '12345', now)).toBeNull();
    expect(verifyTotp(SECRET, '1234567', now)).toBeNull();
    expect(verifyTotp(SECRET, 'abcdef', now)).toBeNull();
    expect(verifyTotp(SECRET, '', now)).toBeNull();
  });

  it('시크릿은 매번 다르고 Base32 로만 이뤄진다', () => {
    const a = totpSecret();
    const b = totpSecret();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Z2-7]{32}$/);
  });

  it('otpauth URI 에 앱이 읽어야 하는 값이 전부 들어 있다', () => {
    const uri = otpauthUri('admin@example.com', 'MZXW6YTBOI');
    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(uri).toContain('secret=MZXW6YTBOI');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
    // 라벨에 계정이 있어야 인증 앱에서 무엇의 코드인지 구분된다.
    expect(decodeURIComponent(uri)).toContain('admin@example.com');
  });
});

describe('IP 허용목록', () => {
  it('단일 주소·CIDR·IPv6 을 함께 읽는다', () => {
    const rules = parseIpAllowlist('203.0.113.7, 198.51.100.0/24, 2001:db8::/32');
    expect(rules).toHaveLength(3);

    expect(ipMatches('203.0.113.7', rules)).toBe(true);
    expect(ipMatches('203.0.113.8', rules)).toBe(false);
    expect(ipMatches('198.51.100.255', rules)).toBe(true);
    expect(ipMatches('198.51.101.1', rules)).toBe(false);
    expect(ipMatches('2001:db8:1234::1', rules)).toBe(true);
    expect(ipMatches('2001:db9::1', rules)).toBe(false);
  });

  it('::ffff: 로 감싼 IPv4 도 같은 주소로 본다 — 프록시가 이 표기로 넘긴다', () => {
    const rules = parseIpAllowlist('203.0.113.7');
    expect(ipMatches('::ffff:203.0.113.7', rules)).toBe(true);
  });

  it('빈 목록은 아무도 통과시키지 않는다 — 통과 판정은 호출부가 따로 한다', () => {
    expect(ipMatches('203.0.113.7', parseIpAllowlist(''))).toBe(false);
    expect(ipMatches('203.0.113.7', parseIpAllowlist(undefined))).toBe(false);
  });

  it('주소를 모르면 막는다', () => {
    const rules = parseIpAllowlist('0.0.0.0/0');
    expect(ipMatches(null, rules)).toBe(false);
    expect(ipMatches('알 수 없음', rules)).toBe(false);
  });

  it('읽을 수 없는 항목은 건너뛰고 나머지는 살린다 — 오타 하나로 목록이 비면 안 된다', () => {
    const rules = parseIpAllowlist('203.0.113.7, 999.1.1.1, 198.51.100.0/99, 198.51.100.0/24');
    expect(rules).toHaveLength(2);
    expect(ipMatches('198.51.100.9', rules)).toBe(true);
  });

  it('IPv4 규칙에 IPv6 주소가 걸리지 않는다', () => {
    const rules = parseIpAllowlist('0.0.0.0/0');
    expect(ipMatches('2001:db8::1', rules)).toBe(false);
  });
});
