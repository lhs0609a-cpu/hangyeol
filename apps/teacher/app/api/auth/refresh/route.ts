import {
  apiError,
  assertApproved,
  db,
  handle,
  readJson,
  requireFields,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/refresh — 04번 문서 A.
 *
 * refresh 도 함께 새로 발급한다(회전). 09번 문서 §6 이 요구하는 형태다.
 * 회전하지 않으면 탈취된 refresh 가 30일 내내 유효하다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<{ refresh: string }>(req);
    requireFields(body, ['refresh']);

    const claims = await verifyRefreshToken(body.refresh);

    /*
     * 승인 상태를 다시 본다.
     *
     * 여기가 비어 있었다. 승인 검사가 로그인에만 있으면 게이트는
     * 로그인하는 순간에만 존재한다 — 한 번 통과한 계정은 자격이 사라진 뒤에도
     * refresh 로 30일 동안 새 access 를 계속 찍어 낼 수 있었다.
     * 토큰은 서명만 보고 발급되니 서명은 여전히 맞기 때문이다.
     *
     * 갱신할 때마다 원장을 다시 읽으면 늦어도 30분(access 수명) 안에 끊긴다.
     * 요청마다 확인하지 않는 이유는 모든 API 에 조회가 한 번씩 더 붙기 때문이고,
     * 30분이면 승인을 되돌린 관리자가 기다릴 만한 시간이다.
     */
    const teacher = await db().teacher.findUnique({
      where: { id: BigInt(claims.teacherId) },
      select: { approvalStatus: true, rejectedReason: true },
    });
    // 계정이 지워졌는데 토큰만 남아 있는 경우.
    if (!teacher) throw apiError('UNAUTHENTICATED', '다시 로그인해 주세요');

    assertApproved(teacher);

    return {
      access: await signAccessToken(claims),
      refresh: await signRefreshToken(claims),
    };
  });
}
