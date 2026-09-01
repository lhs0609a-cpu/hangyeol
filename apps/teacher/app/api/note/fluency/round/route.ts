import { handle, readJson, recordFluencyRound, requireStudentSession } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/note/fluency/round — 4·3·2 라운드 완료. */
export function POST(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const body = await readJson<{ round: 1 | 2 | 3; topicId?: number }>(req);
    return recordFluencyRound(BigInt(claims.studentId), body.round, body.topicId ?? null);
  });
}
