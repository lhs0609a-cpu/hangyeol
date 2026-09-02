import { cancelSchedule, handle, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** DELETE /api/schedules/:id — 예약 취소. 기록은 남긴다. */
export function DELETE(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    return cancelSchedule(ctx.teacherId, BigInt(params.id));
  });
}
