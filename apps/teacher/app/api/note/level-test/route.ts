import { apiError, db, handle, readJson, requireStudentSession, replayLevelAnswers, saveLevelResult, startTest } from '@hangyeol/core';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function studentContext(req: Request) {
  const claims = await requireStudentSession(req);
  const student = await db().student.findUnique({ where: { id: BigInt(claims.studentId) }, include: { teacher: true } });
  if (!student || student.teacherId !== BigInt(claims.teacherId)) throw apiError('NOT_FOUND');
  if (!student.verifiedAt) throw apiError('STUDENT_NOT_VERIFIED');
  if (student.status === 'locked' || student.teacher.billingStatus === 'locked') throw apiError('TEACHER_LOCKED');
  return student;
}
export function GET(req: Request) { return handle(async () => { await studentContext(req); return startTest(); }); }
export function POST(req: Request) { return handle(async () => {
  const student = await studentContext(req);
  const body = await readJson<{ answers: unknown }>(req);
  const step = replayLevelAnswers(body.answers);
  if (!step.done) return step;
  const result = await saveLevelResult(student.id, step.state);
  return { ...step, result, placementApplied: student.currentLessonNo === 0 };
}); }
