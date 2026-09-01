import { handle, readJson, recordHvptAttempt, requireStudentSession } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/note/hvpt/attempt
 * 매 호출마다 student_activity(kind='hvpt') 가 남는다 — 과금 활성판정 (B) 조건의 근거.
 */
export function POST(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const body = await readJson<{ tokenId: string; chosen: string; responseMs?: number }>(req);
    return recordHvptAttempt({
      studentId: BigInt(claims.studentId),
      tokenId: BigInt(body.tokenId),
      chosen: body.chosen,
      responseMs: body.responseMs ?? null,
    });
  });
}
