import {
  apiError,
  db,
  decryptSecret,
  encryptSecret,
  enforce,
  handle,
  otpauthUri,
  readJson,
  requireAdminIdentity,
  totpSecret,
  verifyTotp,
} from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  /** 이미 등록된 사람이 기기를 바꿀 때만 필요하다 — 현재 기기의 코드. */
  code?: string;
}

/**
 * POST /api/admin/2fa/enroll — 인증 앱 등록 시작.
 *
 * 시크릿을 만들어 저장하고 otpauth URI 를 한 번 돌려준다.
 * 이 응답 이후로는 어디서도 다시 볼 수 없다 — 다시 보여 주는 경로가 있으면
 * 관리자 세션을 훔친 사람이 2FA 를 그대로 복제할 수 있다.
 *
 * 등록은 이 시점에 끝나지 않는다. /verify 에서 코드가 맞아야 완료된다.
 * 그래야 QR 을 잘못 찍은 채로 잠기는 일이 없다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireAdminIdentity(req);
    enforce('adminTotp', `enroll:${ctx.teacherId}`);

    const prisma = db();
    const teacher = await prisma.teacher.findUnique({
      where: { id: ctx.teacherId },
      select: { email: true, adminTotpSecret: true, adminTotpEnrolledAt: true },
    });
    if (!teacher) throw apiError('NOT_FOUND');

    /*
     * 이미 등록된 계정의 재등록은 현재 기기의 코드를 받아야 한다.
     *
     * 이 확인이 없으면 세션 하나를 훔친 사람이 자기 인증 앱으로 갈아끼우고
     * 원래 관리자를 잠가 버릴 수 있다. 2FA 를 얹은 이유가 사라진다.
     */
    if (teacher.adminTotpEnrolledAt && teacher.adminTotpSecret) {
      const body = await readJson<Body>(req).catch(() => ({}) as Body);
      const current = decryptSecret(teacher.adminTotpSecret);
      if (!body.code || verifyTotp(current, body.code) === null) {
        throw apiError(
          'VALIDATION_FAILED',
          '기기를 바꾸려면 지금 쓰는 인증 앱의 코드를 먼저 입력해 주세요',
        );
      }
    }

    const secret = totpSecret();
    await prisma.teacher.update({
      where: { id: ctx.teacherId },
      data: {
        adminTotpSecret: encryptSecret(secret),
        // 확인 전까지는 등록으로 치지 않는다. 여기서 승급 세션도 나가지 않는다.
        adminTotpEnrolledAt: null,
        adminTotpLastStep: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: ctx.teacherId,
        action: 'admin.totp.enroll_started',
        entity: 'teachers',
        entityId: ctx.teacherId,
      },
    });

    return {
      secret,
      otpauth: otpauthUri(teacher.email, secret),
    };
  });
}
