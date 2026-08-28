/**
 * 시각 유틸 — 제약 C4: 저장·계산은 전부 UTC.
 *
 * 여기서 버그가 나면 곧바로 과금 분쟁이 된다.
 * 그래서 이 파일의 모든 함수는 부수효과가 없고, `now` 를 인자로 받는다.
 * 내부에서 Date.now() 를 부르는 함수는 하나도 없어야 한다.
 */

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** 과금 주기 길이. DST 와 무관하게 정확히 28 × 24시간. */
export const CYCLE_DAYS = 28;
export const CYCLE_MS = CYCLE_DAYS * MS_PER_DAY;

/** KST 는 고정 오프셋(+09:00). 한국은 서머타임을 쓰지 않는다. */
export const KST_OFFSET_MS = 9 * MS_PER_HOUR;

/** 일수를 더한다. 달력 날짜가 아니라 정확히 n×24시간. */
export function addDays(at: Date, days: number): Date {
  return new Date(at.getTime() + days * MS_PER_DAY);
}

export function addMs(at: Date, ms: number): Date {
  return new Date(at.getTime() + ms);
}

/** 주기 종료 시각. period_start + 28일. */
export function cycleEnd(periodStart: Date): Date {
  return addMs(periodStart, CYCLE_MS);
}

/** [start, end) 반열린 구간 판정. 경계 중복 청구를 막는다. */
export function isWithin(at: Date, start: Date, end: Date): boolean {
  const t = at.getTime();
  return t >= start.getTime() && t < end.getTime();
}

/** KST 기준 달력 필드를 UTC 시각에서 뽑아낸다. */
function kstParts(at: Date): { year: number; month: number; day: number } {
  const shifted = new Date(at.getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/**
 * KST 기준 그 달 1일 00:00 을 UTC 시각으로 돌려준다.
 * 월 합산 청구 배치(매월 1일 KST 00:00)의 경계값.
 */
export function kstMonthStartUtc(at: Date): Date {
  const { year, month } = kstParts(at);
  return new Date(Date.UTC(year, month - 1, 1) - KST_OFFSET_MS);
}

/** billing_month 표기용 'YYYY-MM-01' (KST 기준 달). */
export function billingMonthKey(at: Date): string {
  const { year, month } = kstParts(at);
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/** 임의 오프셋(분) 타임존에서의 '그 날 자정'을 UTC 로. 학생 화면의 '오늘'. */
export function localDayStartUtc(at: Date, tzOffsetMinutes: number): Date {
  const offsetMs = tzOffsetMinutes * MS_PER_MINUTE;
  const shifted = new Date(at.getTime() + offsetMs);
  const midnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(midnight - offsetMs);
}

/** 주간 집계(strand_weekly)용 월요일 00:00. */
export function weekStartUtc(at: Date, tzOffsetMinutes = 0): Date {
  const dayStart = localDayStartUtc(at, tzOffsetMinutes);
  const shifted = new Date(dayStart.getTime() + tzOffsetMinutes * MS_PER_MINUTE);
  const dow = shifted.getUTCDay(); // 0=일
  const backDays = (dow + 6) % 7; // 월요일까지 되감기
  return addDays(dayStart, -backDays);
}

/** 'YYYY-MM-DD' (UTC). 알림·리포트 표기용. */
export function isoDate(at: Date): string {
  return at.toISOString().slice(0, 10);
}
