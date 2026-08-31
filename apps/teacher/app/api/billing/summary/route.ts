import { billingSummary, handle, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/** GET /api/billing/summary — 화면은 07번 T-05. 휴면 학생도 0원으로 함께 낸다. */
export function GET(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    return billingSummary(ctx.teacherId);
  });
}
