import {
  apiError,
  clearCookie,
  handle,
  json,
  readJson,
  requireTeacher,
  TEACHER_COOKIE,
  TEACHER_REFRESH_COOKIE,
  withdrawTeacher,
} from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  /** 되돌릴 수 없는 요청이다. 실수로 눌리지 않게 이메일을 다시 받는다. */
  confirmEmail: string;
}

/**
 * POST /api/me/withdraw — 강사 탈퇴 (09번 문서 §4).
 *
 * 계정은 이 순간부터 막힌다. 데이터는 즉시 지우지 않는다 —
 * 학생 학습 기록은 90일 더 살아 있고(파기 배치가 처리한다),
 * 청구·정산 기록은 거래 근거라 더 오래 남는다(09번 §5 L2·L4).
 */
export function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const body = await readJson<Body>(req);

    if ((body.confirmEmail ?? '').trim().toLowerCase() !== ctx.claims.email.toLowerCase()) {
      throw apiError('VALIDATION_FAILED', '확인을 위해 로그인한 이메일을 그대로 입력해 주세요');
    }

    const result = await withdrawTeacher(ctx.teacherId);

    // 세션을 끊는다. 남겨 두면 탈퇴한 계정으로 화면이 계속 열린다.
    const headers = new Headers();
    headers.append('set-cookie', clearCookie(TEACHER_COOKIE));
    headers.append('set-cookie', clearCookie(TEACHER_REFRESH_COOKIE));

    return json(result, { headers });
  });
}
