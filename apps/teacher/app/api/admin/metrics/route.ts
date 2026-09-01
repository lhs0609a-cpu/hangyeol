import { adminMetrics, handle, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/metrics — 05번 문서 §10 관측 지표.
 *
 * 09번 문서는 관리자에 IP 화이트리스트 + 2FA 를 요구한다.
 * 그 게이트가 붙기 전까지는 강사 인증만으로 열어 두되, 개인정보는 내보내지 않는다.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireTeacher(req);
    return adminMetrics();
  });
}
