import { handle, json, readJson, requireFields, requireTeacher, startLesson } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

interface Body {
  studentId: string;
  unitId?: string;
}

/**
 * POST /api/lessons — 수업 시작.
 *
 * 2차시에 들어서면 여기서 과금 주기가 열린다. 매출의 시작점이다.
 * 응답의 billing.cycleOpened 를 화면이 그대로 보여준다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const body = await readJson<Body>(req);
    requireFields(body, ['studentId']);

    const result = await startLesson({
      teacherId: ctx.teacherId,
      studentId: BigInt(body.studentId),
      unitId: body.unitId ? BigInt(body.unitId) : null,
    });

    return json(
      {
        lessonId: String(result.lessonId),
        lessonNo: result.lessonNo,
        unitId: result.unitId ? String(result.unitId) : null,
        billing: result.billing,
      },
      { status: 201 },
    );
  });
}
