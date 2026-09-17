import { adminDashboard, handle, requireAdmin } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/metrics — 05번 §10 · 11번 핵심 지표 + SaaS 표준(MRR·ARPU).
 *
 * requireAdmin 이 09번 §6 의 세 겹(이메일 허용목록 · IP 허용목록 · 2단계 인증)을
 * 모두 지나게 한다. 그럼에도 개인정보는 일절 내보내지 않는다 — 전부 집계값이다.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return adminDashboard();
  });
}
