import {
  adminCookieFrom,
  adminIpRules,
  db,
  handle,
  requireAdminIdentity,
  verifyAdminStepUp,
} from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/2fa — 관리자 보안 상태.
 *
 * 화면이 "무엇을 해야 하는지" 를 판단할 근거만 준다.
 * 시크릿도, 코드도, 허용목록의 실제 주소도 내보내지 않는다 —
 * 관리자 화면이 털렸을 때 다음 관문의 설정까지 같이 새면 안 된다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const ctx = await requireAdminIdentity(req);

    const teacher = await db().teacher.findUnique({
      where: { id: ctx.teacherId },
      select: { adminTotpSecret: true, adminTotpEnrolledAt: true },
    });

    const token = adminCookieFrom(req);

    return {
      email: ctx.claims.email,
      enrolled: Boolean(teacher?.adminTotpEnrolledAt),
      // 등록을 시작해 두고 코드 확인을 안 한 상태. 화면이 "이어서 확인" 을 안내한다.
      pending: Boolean(teacher?.adminTotpSecret) && !teacher?.adminTotpEnrolledAt,
      stepUp: Boolean(token && (await verifyAdminStepUp(token, String(ctx.teacherId)))),
      // 몇 개가 걸려 있는지만 말한다. 주소 자체는 환경변수 밖으로 내보내지 않는다.
      ipAllowlist: adminIpRules().length,
    };
  });
}
