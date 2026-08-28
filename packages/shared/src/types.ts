/** 03번 문서의 상태값을 타입으로 고정한다. 문자열 오타로 과금이 새는 걸 막는다. */

export type RateTier = 'A' | 'B' | 'C' | 'D';

export type StudentStatus =
  | 'pending'
  | 'active'
  | 'dormant'
  | 'locked'
  | 'completed';

export type CycleStatus =
  | 'open'
  | 'billable'
  | 'waived_dormant'
  | 'invoiced'
  | 'paid'
  | 'failed';

export type InvoiceStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'grace'
  | 'locked'
  | 'void';

export type BillingStatus = 'none' | 'ok' | 'failed' | 'locked';

export type Platform = 'italki' | 'preply' | 'direct';

/** 활성 판정 (B) 조건에 쓰이는 학생 활동 종류. */
export type ActivityKind =
  | 'verify'
  | 'srs'
  | 'hvpt'
  | 'fluency'
  | 'listen'
  | 'worksheet'
  | 'note_open';

/** 정수 KRW. 부동소수 금지. */
export type Krw = number;
