import { handle, nextHvptToken, requireStudentSession } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/note/hvpt/next?contrast=&last_talker= — 동일 화자 연속 2회를 막는다. */
export function GET(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const url = new URL(req.url);
    const contrast = url.searchParams.get('contrast') ?? 'g3';
    const last = url.searchParams.get('last_talker');
    return nextHvptToken(
      BigInt(claims.studentId),
      contrast,
      last === null ? undefined : Number(last),
    );
  });
}
