import { handle, readJson, registerBillingKey, requireFields, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  pgBillingKey: string;
  cardLast4?: string;
}

/**
 * POST /api/billing/card
 * 카드번호는 우리에게 오지 않는다. PG 위젯이 발급한 빌링키만 받는다 (09번 §4).
 */
export function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const body = await readJson<Body>(req);
    requireFields(body, ['pgBillingKey']);
    return registerBillingKey({ teacherId: ctx.teacherId, ...body });
  });
}
