import { beforeEach, describe, expect, it } from 'vitest';
import { check, enforce, reset, RULES } from '@hangyeol/core';

/*
 * 레이트 리밋 — 04번 문서 §K.
 * 창이 안 지나는데 풀리거나, 창이 지났는데 안 풀리면 둘 다 사고다.
 */

beforeEach(() => reset());

describe('창 안에서는 상한을 지킨다', () => {
  it('로그인은 10회까지 허용한다', () => {
    for (let i = 0; i < RULES.login.limit; i += 1) {
      expect(check('login', '1.2.3.4').allowed, `${i + 1}번째`).toBe(true);
    }
    expect(check('login', '1.2.3.4').allowed).toBe(false);
  });

  it('식별자가 다르면 따로 센다', () => {
    for (let i = 0; i < RULES.login.limit; i += 1) check('login', 'a');
    expect(check('login', 'a').allowed).toBe(false);
    expect(check('login', 'b').allowed).toBe(true);
  });

  it('규칙이 다르면 따로 센다', () => {
    for (let i = 0; i < RULES.login.limit; i += 1) check('login', 'x');
    expect(check('login', 'x').allowed).toBe(false);
    expect(check('assetSign', 'x').allowed).toBe(true);
  });
});

describe('창이 지나면 풀린다', () => {
  it('10분 뒤에 다시 된다', () => {
    const t0 = Date.now();
    for (let i = 0; i < RULES.login.limit; i += 1) check('login', 'ip', t0);
    expect(check('login', 'ip', t0).allowed).toBe(false);

    const later = t0 + RULES.login.windowSec * 1000 + 1;
    expect(check('login', 'ip', later).allowed).toBe(true);
  });

  it('창이 끝나기 직전에는 아직 막혀 있다', () => {
    const t0 = Date.now();
    for (let i = 0; i < RULES.login.limit; i += 1) check('login', 'ip', t0);
    const almost = t0 + RULES.login.windowSec * 1000 - 1;
    expect(check('login', 'ip', almost).allowed).toBe(false);
  });
});

describe('enforce 는 429 로 막는다', () => {
  it('상한 안에서는 통과한다', () => {
    expect(() => enforce('login', 'ok')).not.toThrow();
  });

  it('넘으면 재시도 시각을 알려 준다', () => {
    const t0 = Date.now();
    for (let i = 0; i < RULES.login.limit; i += 1) check('login', 'over', t0);

    try {
      enforce('login', 'over', t0);
      throw new Error('막았어야 한다');
    } catch (e) {
      const err = e as { code?: string; detail?: { retryAfterSec?: number } };
      expect(err.code).toBe('RATE_LIMITED');
      expect(err.detail?.retryAfterSec).toBeGreaterThan(0);
    }
  });
});

describe('04번 §K 의 수치와 일치한다', () => {
  it.each([
    ['login', 10, 600],
    ['magicLink', 5, 3600],
    ['assetSign', 120, 60],
    ['general', 600, 60],
  ] as const)('%s: %i회 / %i초', (rule, limit, windowSec) => {
    expect(RULES[rule].limit).toBe(limit);
    expect(RULES[rule].windowSec).toBe(windowSec);
  });
});
