import { apiError, db, handle, readJson, requireAdmin, requireFields } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/*
 * 강사 승인 — 관리자 전용.
 *
 * 09번 문서의 IP 허용목록 + 2FA 게이트가 아직 없다. 그래서 여기서는
 * 승인 판단에 필요한 최소한만 내려보낸다. 전화번호·결제 정보는 뺀다.
 *
 * 다만 이메일과 신청 사유는 뺄 수 없다 — 그게 없으면 승인할 근거가 없다.
 * 게이트가 붙기 전까지는 이 엔드포인트가 가장 민감한 자리다.
 */

/** GET /api/admin/teachers?status=pending */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);

    const status = new URL(req.url).searchParams.get('status') ?? 'pending';
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw apiError('VALIDATION_FAILED', '없는 상태입니다');
    }

    const rows = await db().teacher.findMany({
      where: { approvalStatus: status },
      orderBy: { createdAt: 'asc' }, // 먼저 신청한 사람이 먼저 기다렸다
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        countryCode: true,
        applyNote: true,
        createdAt: true,
        approvedAt: true,
        rejectedReason: true,
      },
    });

    return {
      status,
      teachers: rows.map((r) => ({
        ...r,
        id: String(r.id),
        createdAt: r.createdAt.toISOString(),
        approvedAt: r.approvedAt?.toISOString() ?? null,
      })),
    };
  });
}

interface DecideBody {
  teacherId: string;
  decision: 'approved' | 'rejected';
  reason?: string;
}

/** POST /api/admin/teachers — 승인 또는 거절. */
export function POST(req: Request) {
  return handle(async () => {
    await requireAdmin(req);

    const body = await readJson<DecideBody>(req);
    requireFields(body, ['teacherId', 'decision']);

    if (body.decision !== 'approved' && body.decision !== 'rejected') {
      throw apiError('VALIDATION_FAILED', '승인 또는 거절만 가능합니다');
    }
    // 거절은 이유를 반드시 남긴다. 강사에게 그대로 보여 주기 때문이다.
    if (body.decision === 'rejected' && !body.reason?.trim()) {
      throw apiError('VALIDATION_FAILED', '거절 사유를 적어 주세요. 강사에게 그대로 보입니다');
    }

    const id = BigInt(body.teacherId);
    const current = await db().teacher.findUnique({
      where: { id },
      select: { approvalStatus: true },
    });
    if (!current) throw apiError('NOT_FOUND', '없는 강사입니다');

    // 이미 처리된 신청을 다시 뒤집지 않는다. 승인 후 거절은 계정 정지이지 거절이 아니다.
    if (current.approvalStatus !== 'pending') {
      throw apiError('VALIDATION_FAILED', '이미 처리된 신청입니다');
    }

    const teacher = await db().teacher.update({
      where: { id },
      data: {
        approvalStatus: body.decision,
        approvedAt: body.decision === 'approved' ? new Date() : null,
        rejectedReason: body.decision === 'rejected' ? body.reason!.trim() : null,
      },
      select: { id: true, email: true, name: true, approvalStatus: true },
    });

    /*
     * 알림은 큐에 넣는다. 발송기는 아직 없다(12번 문서 D-004).
     * 여기서 직접 보내지 않는 이유는 메일 서버가 느릴 때 승인 자체가
     * 실패한 것처럼 보이기 때문이다. 승인은 이미 끝났다.
     */
    await db().notification.create({
      data: {
        targetType: 'teacher',
        targetId: teacher.id,
        kind: body.decision === 'approved' ? 'signup_approved' : 'signup_rejected',
        channel: 'email',
        // 지금 보내야 하는 알림이다. 예약이 아니다.
        scheduledAt: new Date(),
        payload: {
          to: teacher.email,
          name: teacher.name,
          ...(body.decision === 'rejected' ? { reason: body.reason!.trim() } : {}),
        },
      },
    });

    return { teacher: { ...teacher, id: String(teacher.id) } };
  });
}
