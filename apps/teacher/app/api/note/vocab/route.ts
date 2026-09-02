import { db, handle, requireStudentSession } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/note/vocab — 02번 문서 D-09 개인 단어장. 수업 표현이 자동 적립된다. */
export function GET(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const size = 40;

    const where = { studentId: BigInt(claims.studentId) };
    const [items, total] = await Promise.all([
      db().vocabCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
        select: {
          id: true,
          term: true,
          glossL1: true,
          example: true,
          state: true,
          reps: true,
          dueAt: true,
        },
      }),
      db().vocabCard.count({ where }),
    ]);

    return { items, page, total, hasMore: page * size < total };
  });
}
