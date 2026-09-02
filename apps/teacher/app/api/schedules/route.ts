import { createSchedule, handle, json, readJson, requireFields, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  studentId: string;
  scheduledAt: string;
  durationMin?: number;
}

/**
 * POST /api/schedules — 수업 예약.
 *
 * 예약은 수업이 아니다. lessons 는 실제로 시작해야 생기고,
 * 그 INSERT 가 2차시에서 과금 주기를 연다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const body = await readJson<Body>(req);
    requireFields(body, ['studentId', 'scheduledAt']);

    const at = new Date(body.scheduledAt);
    if (Number.isNaN(at.getTime())) {
      throw new Error('예약 시각이 올바르지 않습니다');
    }

    return json(
      await createSchedule({
        teacherId: ctx.teacherId,
        studentId: BigInt(body.studentId),
        scheduledAt: at,
        ...(body.durationMin === undefined ? {} : { durationMin: body.durationMin }),
      }),
      { status: 201 },
    );
  });
}
