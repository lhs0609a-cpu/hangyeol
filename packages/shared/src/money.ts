import type { Krw } from './types.js';

/** 금액은 정수 KRW 만 허용한다. 부동소수가 들어오면 즉시 터뜨린다. */
export function assertKrw(value: number, label = 'amount'): Krw {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer KRW value, got ${value}`);
  }
  if (value < 0) {
    throw new Error(`${label} must not be negative, got ${value}`);
  }
  return value;
}

/** 퍼센트 차감. 원 단위 절사(floor) — 05번 문서 §3.1 과 동일. */
export function applyDiscountPct(base: Krw, discountPct: number): Krw {
  assertKrw(base, 'base');
  if (discountPct < 0 || discountPct > 100) {
    throw new Error(`discountPct out of range: ${discountPct}`);
  }
  return Math.floor((base * (100 - discountPct)) / 100);
}

export function sum(values: readonly Krw[]): Krw {
  return values.reduce((acc, v) => acc + v, 0);
}
