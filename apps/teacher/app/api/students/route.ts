import { createStudent, handle, json, listStudents, readJson, requireFields, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/** GET /api/students?status= */
export function GET(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const status = new URL(req.url).searchParams.get('status') ?? undefined;
    return { items: await listStudents(ctx.teacherId, status) };
  });
}

interface Body {
  name: string;
  nameKo?: string;
  email: string;
  l1Code: string;
  countryCode?: string;
  platform: 'italki' | 'preply' | 'direct';
  platformUrl?: string;
  goalTrack?: string;
}

/**
 * POST /api/students — 30초 안에 끝나야 하는 화면(T-06)의 뒷단.
 * 동일 이메일이면 409 로 기존 레코드를 돌려준다. 새 과금은 발생하지 않는다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const body = await readJson<Body>(req);
    requireFields(body, ['name', 'email', 'l1Code', 'platform']);

    const result = await createStudent({ teacherId: ctx.teacherId, ...body });

    return json(
      {
        id: String(result.id),
        status: result.status,
        noteUrl: result.noteUrl,
        billing: { chargedNow: result.billing.chargedNow, firstChargeAtLesson: result.billing.firstChargeAtLessonNo },
        ...(result.duplicate
          ? { note: '이미 등록된 학생입니다. 이어서 진행합니다. 추가 요금은 없습니다' }
          : {}),
      },
      { status: result.duplicate ? 409 : 201 },
    );
  });
}
