import { apiError } from './errors.js';

/*
 * 레이트 리밋 — 04번 문서 §K.
 *
 *   로그인            10회 / 10분 / IP
 *   매직링크 발송      5회 / 시간 / 학생
 *   자산 서명 URL     120회 / 분 / 강사
 *   일반              600회 / 분 / 토큰
 *
 * 지금은 프로세스 메모리에 센다. 서버리스에서는 인스턴스마다 따로 세므로
 * 실효 상한이 인스턴스 수만큼 늘어난다 — 무제한보다는 낫지만 정확하지 않다.
 * Redis(10번 문서 §2)가 붙으면 그쪽으로 옮긴다. 그 전까지의 한계를 여기 적어 둔다.
 */

export interface RateRule {
  /** 허용 횟수. */
  limit: number;
  /** 창 길이(초). */
  windowSec: number;
  label: string;
}

export const RULES = {
  login: { limit: 10, windowSec: 600, label: '로그인' },
  magicLink: { limit: 5, windowSec: 3600, label: '매직링크 발송' },
  assetSign: { limit: 120, windowSec: 60, label: '자료 서명 URL 발급' },
  general: { limit: 600, windowSec: 60, label: '일반 요청' },
} as const satisfies Record<string, RateRule>;

export type RuleName = keyof typeof RULES;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** 창이 지난 항목을 치운다. 안 그러면 맵이 무한히 자란다. */
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function check(rule: RuleName, identity: string, now = Date.now()): RateResult {
  const { limit, windowSec } = RULES[rule];
  const key = `${rule}:${identity}`;

  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowSec * 1000 };
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/** 넘으면 429 로 막는다. 재시도 가능한 시각을 알려 준다. */
export function enforce(rule: RuleName, identity: string, now = Date.now()): void {
  const result = check(rule, identity, now);
  if (result.allowed) return;

  const seconds = Math.ceil((result.resetAt - now) / 1000);
  throw apiError('RATE_LIMITED', `${RULES[rule].label} 요청이 너무 많습니다. ${seconds}초 후 다시 시도하세요`, {
    retryAfterSec: seconds,
  });
}

/** 테스트에서 상태를 비운다. 프로세스 전역이라 테스트 간 오염이 생긴다. */
export function reset(): void {
  buckets.clear();
}

/** 요청에서 식별자를 뽑는다. IP 가 없으면 막지 않고 통과시킨다 — 오탐이 더 나쁘다. */
export function identityFrom(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
