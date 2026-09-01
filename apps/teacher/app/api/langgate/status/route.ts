import { check, shouldNotify } from '@hangyeol/langgate';
import { db, handle } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/langgate/status — 04번 문서 H. 비로그인도 허용한다(리드 자석).
 *
 * 11번 문서: "반나절 작업으로 Phase 1 내내 쓸 강사 리드가 쌓인다."
 */
export function GET() {
  return handle(async () => {
    const prisma = db();

    const previous = await prisma.langGateSnapshot.findFirst({
      where: { platform: 'italki', langCode: 'ko' },
      orderBy: { checkedAt: 'desc' },
    });

    const current = await check();

    await prisma.langGateSnapshot.create({
      data: { platform: 'italki', langCode: 'ko', isOpen: current.isOpen },
    });

    const history = await prisma.langGateSnapshot.findMany({
      where: { platform: 'italki', langCode: 'ko' },
      orderBy: { checkedAt: 'desc' },
      take: 12,
      select: { isOpen: true, checkedAt: true },
    });

    const lastOpen = history.find((h) => h.isOpen);

    return {
      platform: 'italki',
      lang: 'ko',
      isOpen: current.isOpen,
      checkedAt: current.checkedAt,
      lastOpenAt: lastOpen?.checkedAt ?? null,
      changed: shouldNotify(
        previous ? { ...current, isOpen: previous.isOpen, checkedAt: previous.checkedAt } : null,
        current,
      ),
      history: history.map((h) => ({ date: h.checkedAt.toISOString().slice(0, 10), open: h.isOpen })),
    };
  });
}
