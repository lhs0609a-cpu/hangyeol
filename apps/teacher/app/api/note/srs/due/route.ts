import { dueCards, handle, requireStudentSession } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/** GET /api/note/srs/due — 오늘 복습할 카드. */
export function GET(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    return { items: await dueCards(BigInt(claims.studentId)) };
  });
}
