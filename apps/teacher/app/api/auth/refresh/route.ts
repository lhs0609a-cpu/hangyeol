import {
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

    return {
      access: await signAccessToken(claims),
      refresh: await signRefreshToken(claims),
    };
  });
}
