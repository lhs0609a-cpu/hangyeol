/**
 * 04번 문서 §공통 에러 — 코드와 HTTP 상태를 여기서 한 번만 정한다.
 * 핸들러가 각자 상태코드를 정하면 반드시 어긋난다.
 */

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'STUDENT_NOT_VERIFIED'
  | 'TEACHER_LOCKED'
  // 가입은 됐지만 관리자가 아직 승인하지 않았다. 잠금(TEACHER_LOCKED)과 다르다 —
  // 잠금은 미납이고 이건 아직 시작도 안 한 상태다. 화면 문구가 달라야 한다.
  | 'TEACHER_NOT_APPROVED'
  | 'STUDENT_REQUIRED'
  // 관리자 이메일 허용목록은 통과했지만 2단계 인증이 아직이다(09번 §6).
  // 여기까지 온 사람은 이미 관리자 본인이므로 "2FA 가 필요하다" 를 숨기지 않는다 —
  // 허용목록 밖 요청은 이 코드를 보지 못하고 NOT_FOUND 로 끝난다.
  | 'ADMIN_TOTP_REQUIRED'
  // 학생이 개인정보 고지에 아직 동의하지 않았다(09번 §4 필수 동의).
  // 인증(UNAUTHENTICATED)과 다르다 — 학생이 누구인지는 안다. 동의가 없을 뿐이다.
  | 'STUDENT_CONSENT_REQUIRED'
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
  TEACHER_NOT_APPROVED: 403,
  STUDENT_REQUIRED: 403,
  ADMIN_TOTP_REQUIRED: 403,
  STUDENT_CONSENT_REQUIRED: 403,
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
  ADMIN_TOTP_REQUIRED: '관리자 화면은 2단계 인증이 필요합니다. 인증 앱의 코드를 입력해 주세요',
  // 학생 화면에 그대로 뜨는 문장이다. 화이트라벨이라 서비스명을 쓰지 않는다.
  STUDENT_CONSENT_REQUIRED: '학습 기록 안내를 먼저 확인해 주세요',
  DUPLICATE_STUDENT: '이미 등록된 학생입니다. 이어서 진행합니다. 추가 요금은 없습니다',
  REPORT_LIMIT: '표현은 5개, 오답은 3개까지 넣을 수 있습니다',
  // 방문자가 읽는 문장이다. 무엇이 없는지가 아니라 무엇을 하면 되는지를 말한다.
  DB_UNAVAILABLE: '지금은 처리할 수 없어요. 잠시 후 다시 시도해 주세요',
};

export function apiError(code: ApiErrorCode, message?: string, detail?: Record<string, unknown>) {
  return new ApiError(code, message ?? MESSAGES[code] ?? code, detail);
}
