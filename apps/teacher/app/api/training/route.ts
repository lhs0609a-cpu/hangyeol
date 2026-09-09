import { TEACHER_TRAINING } from '@hangyeol/content';
import { apiError, db, handle, readJson, requireTeacher } from '@hangyeol/core';
export const dynamic = 'force-dynamic';
export function GET(req: Request) { return handle(async () => {
  const { teacherId } = await requireTeacher(req);
  return { completed: (await db().teacherTraining.findUnique({ where: { teacherId } }))?.completed ?? [] };
}); }
export function POST(req: Request) { return handle(async () => {
  const { teacherId } = await requireTeacher(req);
  const body = await readJson<{ moduleId: string; answer: number; rehearsed: boolean }>(req);
  const module = TEACHER_TRAINING.find(m => m.id === body.moduleId);
  if (!module || body.answer !== module.answer || body.rehearsed !== true) throw apiError('VALIDATION_FAILED', '확인 문제와 수업 연습을 마친 후 저장해 주세요');
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${teacherId} FOR UPDATE`;
    const previous = await tx.teacherTraining.findUnique({ where: { teacherId } });
    const completed = [...new Set([...(previous?.completed ?? []), module.id])];
    await tx.teacherTraining.upsert({ where: { teacherId }, create: { teacherId, completed }, update: { completed } });
    return { completed };
  });
}); }
