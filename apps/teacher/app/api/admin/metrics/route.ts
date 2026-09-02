import { adminDashboard, handle, requireAdmin } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/metrics — 05번 §10 · 11번 핵심 지표 + SaaS 표준(MRR·ARPU).
 *
 * 09번 문서는 관리자에 IP 화이트리스트 + 2FA 를 요구한다.
 * 그 게이트가 붙기 전까지는 강사 인증만으로 열어 두되,
 * 개인정보는 일절 내보내지 않는다 — 전부 집계값이다.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return adminDashboard();
  });
}
