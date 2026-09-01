import { handle, handlePgWebhook, verifyPgSignature, type PgWebhookPayload } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/pg/payment — 04번 문서 J.
 *
 * 멱등키는 pg_tid. 중복 수신은 무시한다. 서명 검증은 필수다.
 * 본문을 파싱하기 전에 서명부터 본다 — 검증 못 한 데이터를 해석하지 않는다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const raw = await req.text();
    verifyPgSignature(raw, req.headers.get('x-pg-signature'));
    return handlePgWebhook(JSON.parse(raw) as PgWebhookPayload);
  });
}
