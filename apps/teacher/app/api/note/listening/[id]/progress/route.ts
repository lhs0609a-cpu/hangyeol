import { handle, readJson, recordListening, requireStudentSession } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/note/listening/:id/progress */
export function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const body = await readJson<{ playedSec: number; completed: boolean }>(req);
    return recordListening(BigInt(claims.studentId), BigInt(params.id), body.playedSec, body.completed);
  });
}
