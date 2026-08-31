import { apiError, handle, runCycleClose, runInvoiceCreate, runLockEnforce } from '@hangyeol/core';
import { safeEqual } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 배치 엔드포인트 — 10번 문서 §6.
 *
 * Vercel Cron 이 호출한다. 전부 멱등하므로 중복 호출이 결과를 바꾸지 않는다.
 * job 파라미터로 어떤 배치를 돌릴지 고른다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const secret = process.env.CRON_SECRET;
    const auth = req.headers.get('authorization') ?? '';
    if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
      throw apiError('UNAUTHENTICATED', '크론 인증에 실패했습니다');
    }

    const job = new URL(req.url).searchParams.get('job') ?? 'cycle-close';

    switch (job) {
      case 'cycle-close':
        return { job, ...(await runCycleClose()) };
      case 'invoice-create':
        return { job, ...(await runInvoiceCreate()) };
      case 'lock-enforce':
        return { job, ...(await runLockEnforce()) };
      default:
        throw apiError('VALIDATION_FAILED', `알 수 없는 배치: ${job}`);
    }
  });
}
