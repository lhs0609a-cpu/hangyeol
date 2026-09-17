import {
  consentState,
  handle,
  readJson,
  recordConsent,
  requestWithdrawal,
  requireStudentSession,
} from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/*
 * 09번 문서 §4 — 학생 개인정보 동의.
 *
 * 이 경로만 동의 관문(requireConsentedStudent)을 지나지 않는다.
 * 지나게 하면 동의하지 않은 학생이 동의 화면조차 열 수 없다.
 * 대신 세션은 반드시 확인한다 — 남의 동의를 대신 눌러 줄 수는 없다.
 */

/** GET /api/note/consent — 지금 동의가 필요한지, 고지 전문은 무엇인지. */
export function GET(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    return consentState(BigInt(claims.studentId));
  });
}

interface Body {
  action: 'agree' | 'withdraw';
}

/** POST /api/note/consent — 동의 또는 철회 요청. */
export function POST(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const body = await readJson<Body>(req);
    const studentId = BigInt(claims.studentId);

    if (body.action === 'withdraw') return requestWithdrawal(studentId);
    return recordConsent(studentId);
  });
}
