import { handle, readJson, requireTeacher, submitReport } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

interface Body {
  expressions: string[];
  errors?: string[];
  outcome: 'pass' | 'repeat';
}

/**
 * POST /api/lessons/:id/report — 3분 리포트.
 *
 * 07번 문서 T-03 수용기준: 저장 시 외부 API 호출 0건.
 * 이 경로는 네트워크를 전혀 타지 않는다. 응답의 externalApiCalls 가 그 증거다.
 */
export function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const body = await readJson<Body>(req);

    return submitReport({
      teacherId: ctx.teacherId,
      lessonId: BigInt(params.id),
      expressions: body.expressions ?? [],
      errors: body.errors ?? [],
      outcome: body.outcome ?? 'pass',
    });
  });
}
