/**
 * 04번 문서 §공통 에러 — 코드와 HTTP 상태를 여기서 한 번만 정한다.
 * 핸들러가 각자 상태코드를 정하면 반드시 어긋난다.
 */

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'STUDENT_NOT_VERIFIED'
  | 'TEACHER_LOCKED'
  | 'STUDENT_REQUIRED'
  | 'NOT_FOUND'
  | 'DUPLICATE_STUDENT'
  | 'REPORT_LIMIT'
  | 'RATE_LIMITED'
  | 'DB_UNAVAILABLE'
  | 'INTERNAL';

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  STUDENT_NOT_VERIFIED: 403,
  TEACHER_LOCKED: 403,
  STUDENT_REQUIRED: 403,
  NOT_FOUND: 404,
  DUPLICATE_STUDENT: 409,
  REPORT_LIMIT: 422,
  RATE_LIMITED: 429,
  DB_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly detail: Record<string, unknown>;

  constructor(code: ApiErrorCode, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS[code];
    this.detail = detail;
  }

  toBody() {
    return { error: { code: this.code, message: this.message, detail: this.detail } };
  }
}

/** 오류는 사과하지 않고 다음 행동을 말한다 (06번 §8). */
export const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  UNAUTHENTICATED: '다시 로그인해 주세요',
  STUDENT_NOT_VERIFIED: '학생 이메일 인증이 필요합니다. 인증 링크를 다시 보내세요',
  TEACHER_LOCKED: '결제가 확인되지 않아 새 차시가 열리지 않습니다',
  STUDENT_REQUIRED: '수업 자료는 학생을 선택해야 열립니다',
  DUPLICATE_STUDENT: '이미 등록된 학생입니다. 이어서 진행합니다. 추가 요금은 없습니다',
  REPORT_LIMIT: '표현은 5개, 오답은 3개까지 넣을 수 있습니다',
  DB_UNAVAILABLE: '데이터베이스가 연결되지 않았습니다',
};

export function apiError(code: ApiErrorCode, message?: string, detail?: Record<string, unknown>) {
  return new ApiError(code, message ?? MESSAGES[code] ?? code, detail);
}
