import { describe, expect, it } from 'vitest';
import {
  addDays,
  billingMonthKey,
  CYCLE_MS,
  cycleEnd,
  isWithin,
  kstMonthStartUtc,
  localDayStartUtc,
  MS_PER_DAY,
  weekStartUtc,
} from '@hangyeol/shared';

describe('28일 = 정확히 28×24시간 (DST 무관)', () => {
  it('서머타임 전환을 가로질러도 길이가 같다', () => {
    // 미국 DST 종료(2026-11-01)를 가로지르는 구간
    const start = new Date('2026-10-20T12:00:00Z');
    expect(cycleEnd(start).getTime() - start.getTime()).toBe(CYCLE_MS);
    expect(cycleEnd(start).toISOString()).toBe('2026-11-17T12:00:00.000Z');
  });

  it('addDays 는 달력이 아니라 24시간 단위다', () => {
    expect(addDays(new Date('2026-02-27T00:00:00Z'), 2).toISOString()).toBe(
      '2026-03-01T00:00:00.000Z',
    );
  });
});

describe('주기 경계는 반열린 구간 [start, end)', () => {
  const start = new Date('2026-08-01T00:00:00Z');
  const end = cycleEnd(start);

  it('시작 시각은 포함한다', () => {
    expect(isWithin(start, start, end)).toBe(true);
  });

  it('종료 시각은 다음 주기 몫이다 — 경계에서 이중 계상되면 안 된다', () => {
    expect(isWithin(end, start, end)).toBe(false);
    expect(isWithin(new Date(end.getTime() - 1), start, end)).toBe(true);
  });
});

describe('KST 월 경계 (월 합산 청구 배치)', () => {
  it('9월 1일 KST 00:00 은 8월 31일 15:00 UTC 다', () => {
    const now = new Date('2026-09-01T00:00:00+09:00');
    expect(kstMonthStartUtc(now).toISOString()).toBe('2026-08-31T15:00:00.000Z');
    expect(billingMonthKey(now)).toBe('2026-09-01');
  });

  it('UTC 로는 8월 31일이지만 KST 로는 이미 9월인 시각을 9월로 센다', () => {
    // UTC 2026-08-31T16:00Z = KST 2026-09-01T01:00
    const now = new Date('2026-08-31T16:00:00Z');
    expect(billingMonthKey(now)).toBe('2026-09-01');
  });

  it('KST 로 아직 8월인 시각은 8월로 센다', () => {
    // UTC 2026-08-31T14:59Z = KST 2026-08-31T23:59
    const now = new Date('2026-08-31T14:59:00Z');
    expect(billingMonthKey(now)).toBe('2026-08-01');
  });
});

describe('학생 로컬 자정 — 화면의 "오늘의 학습"', () => {
  it('브라질(UTC-3) 학생의 오늘은 UTC 기준 오늘이 아니다', () => {
    const at = new Date('2026-08-28T01:00:00Z'); // 상파울루는 아직 8/27 22:00
    expect(localDayStartUtc(at, -180).toISOString()).toBe('2026-08-27T03:00:00.000Z');
  });

  it('UTC 오프셋 0 이면 그대로 UTC 자정', () => {
    expect(localDayStartUtc(new Date('2026-08-28T13:00:00Z'), 0).toISOString()).toBe(
      '2026-08-28T00:00:00.000Z',
    );
  });
});

describe('주간 집계는 월요일에 시작한다', () => {
  it('금요일을 넣으면 그 주 월요일이 나온다', () => {
    // 2026-08-28 은 금요일
    expect(weekStartUtc(new Date('2026-08-28T10:00:00Z')).toISOString()).toBe(
      '2026-08-24T00:00:00.000Z',
    );
  });

  it('일요일은 지난 월요일에 붙는다 (주의 끝)', () => {
    expect(weekStartUtc(new Date('2026-08-30T23:00:00Z')).toISOString()).toBe(
      '2026-08-24T00:00:00.000Z',
    );
  });

  it('월요일은 자기 자신', () => {
    expect(weekStartUtc(new Date('2026-08-31T00:00:00Z')).toISOString()).toBe(
      '2026-08-31T00:00:00.000Z',
    );
  });
});

describe('상수', () => {
  it('CYCLE_MS 는 28일', () => {
    expect(CYCLE_MS).toBe(28 * MS_PER_DAY);
  });
});
