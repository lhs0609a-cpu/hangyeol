import { db, handle, hashEmail, normalizeEmail, readJson, requireFields } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/langgate/subscribe — 비로그인 허용.
 *
 * 창구가 열리는 순간을 알려주는 것 하나가 리드 자석이 된다(01번 문서 §4).
 * 이메일은 알림 발송에만 쓰고, 해시로 중복만 판정한다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<{ email: string }>(req);
    requireFields(body, ['email']);

    const email = normalizeEmail(body.email);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error('이메일 형식을 확인해 주세요');
    }

    const prisma = db();
    const targetId = BigInt(`0x${hashEmail(email).slice(0, 12)}`);

    const existing = await prisma.notification.findFirst({
      where: { targetType: 'langgate_subscriber', targetId, kind: 'langgate_open' },
    });
    if (existing) return { subscribed: true, duplicate: true };

    await prisma.notification.create({
      data: {
        targetType: 'langgate_subscriber',
        targetId,
        kind: 'langgate_open',
        // 발송 시점은 창구가 열릴 때다. 그때까지 대기한다.
        scheduledAt: new Date('2099-01-01T00:00:00Z'),
        channel: 'email',
        payload: { email },
      },
    });

    return { subscribed: true, duplicate: false };
  });
}
