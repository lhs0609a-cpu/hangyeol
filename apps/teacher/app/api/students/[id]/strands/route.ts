import { handle, requireOwnStudent, weeklyStrands } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/students/:id/strands — 주간 Four Strands 집계. */
export function GET(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = await requireOwnStudent(req, params.id);
    return { report: await weeklyStrands(ctx.student.id) };
  });
}
