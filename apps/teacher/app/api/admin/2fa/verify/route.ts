import {
  ADMIN_COOKIE,
  ADMIN_STEP_UP_TTL_SEC,
  apiError,
  db,
  decryptSecret,
  enforce,
  handle,
  json,
  readJson,
  requireAdminIdentity,
  requireFields,
  sessionCookie,
  signAdminStepUp,
  verifyTotp,
} from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  code: string;
}

/**
 * POST /api/admin/2fa/verify — 코드 확인 후 승급 세션 발급.
 *
 * 등록 직후의 첫 확인과, 이후의 재승급이 같은 경로를 쓴다.
 * 두 벌로 나누면 한쪽에만 재사용 차단을 넣는 날이 온다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireAdminIdentity(req);
    // 여섯 자리를 무한히 던지지 못하게 막는다. 계정 단위로 센다.
    enforce('adminTotp', `verify:${ctx.teacherId}`);

    const body = await readJson<Body>(req);
    requireFields(body, ['code']);

    const prisma = db();
    const teacher = await prisma.teacher.findUnique({
      where: { id: ctx.teacherId },
      select: { adminTotpSecret: true, adminTotpEnrolledAt: true, adminTotpLastStep: true },
    });

    if (!teacher?.adminTotpSecret) {
      throw apiError('ADMIN_TOTP_REQUIRED', '인증 앱을 먼저 등록해 주세요', { stage: 'enroll' });
    }

    const step = verifyTotp(decryptSecret(teacher.adminTotpSecret), body.code);
    if (step === null) {
      throw apiError('VALIDATION_FAILED', '코드가 맞지 않습니다. 앱의 새 코드를 입력해 주세요');
    }

    /*
     * 같은 코드를 두 번 받지 않는다.
     *
     * 코드 하나가 최대 90초(±1칸) 살아 있다. 그 사이에 어깨너머로 본 사람이
     * 같은 숫자로 한 번 더 들어오는 경로를 여기서 닫는다.
     */
    if (teacher.adminTotpLastStep !== null && step <= teacher.adminTotpLastStep) {
      throw apiError('VALIDATION_FAILED', '이미 사용한 코드입니다. 앱의 새 코드를 입력해 주세요');
    }

    const first = !teacher.adminTotpEnrolledAt;

    await prisma.teacher.update({
      where: { id: ctx.teacherId },
      data: {
        adminTotpLastStep: step,
        ...(first ? { adminTotpEnrolledAt: new Date() } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: ctx.teacherId,
        action: first ? 'admin.totp.enrolled' : 'admin.totp.step_up',
        entity: 'teachers',
        entityId: ctx.teacherId,
      },
    });

    const token = await signAdminStepUp(String(ctx.teacherId));
    const headers = new Headers();
    headers.append('set-cookie', sessionCookie(ADMIN_COOKIE, token, ADMIN_STEP_UP_TTL_SEC));

    return json({ enrolled: true, expiresInSec: ADMIN_STEP_UP_TTL_SEC }, { headers });
  });
}
