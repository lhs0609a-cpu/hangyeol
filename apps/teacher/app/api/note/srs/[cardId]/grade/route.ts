import { applyGrade, handle, readJson, requireStudentSession, type SrsGrade } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/**
 * POST /api/note/srs/:cardId/grade
 *
 * 매 채점마다 student_activity(kind='srs') 가 남는다.
 * 그 기록이 과금 활성판정 (B) 조건의 근거가 된다 — 학생이 실제로 쓰는지의 증거다.
 */
export function POST(req: Request, { params }: { params: { cardId: string } }) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const body = await readJson<{ grade: SrsGrade }>(req);
    return applyGrade(BigInt(claims.studentId), BigInt(params.cardId), body.grade);
  });
}
