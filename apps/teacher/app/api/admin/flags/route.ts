import { bypassFlags, handle, requireAdmin } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/flags — 04번 문서 §I · 02번 G-03.
 *
 * 우회 의심 목록. 자동 제재는 없다 — 두 문서가 같은 문장을 적어 뒀다.
 * 응답에 개인정보를 넣지 않는다(09번 §6). 학생·강사 id 와 신호만 나간다.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return bypassFlags();
  });
}
