import {
  apiError,
  handle,
  json,
  signStudentSession,
  STUDENT_COOKIE,
  STUDENT_SESSION_TTL_SEC,
  verifyStudent,
  verifyStudentToken,
} from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/**
 * GET /api/note/verify?t=... — 매직링크 착지점.
 *
 * 학생에게는 비밀번호가 없다. 이 링크가 곧 신원이다.
 * 그래서 TTL 15분이고, 성공하면 세션 쿠키(HttpOnly·Secure·SameSite=Lax)로 바꿔 단다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const token = new URL(req.url).searchParams.get('t');
    if (!token) throw apiError('UNAUTHENTICATED');

    const claims = await verifyStudentToken(token, 'magic');
    await verifyStudent(BigInt(claims.studentId));

    const session = await signStudentSession(claims);

    return json(
      { verified: true },
      {
        headers: {
          'set-cookie': [
            `${STUDENT_COOKIE}=${session}`,
            'Path=/',
            'HttpOnly',
            'Secure',
            'SameSite=Lax',
            `Max-Age=${STUDENT_SESSION_TTL_SEC}`,
          ].join('; '),
        },
      },
    );
  });
}
