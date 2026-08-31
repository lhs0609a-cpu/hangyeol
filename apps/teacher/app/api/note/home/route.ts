import { handle, noteHome, requireStudentSession } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/**
 * GET /api/note/home — 화이트라벨.
 * 응답 어디에도 서비스명이 들어가면 안 된다. 강사 이름만 나간다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    return noteHome(BigInt(claims.studentId));
  });
}
