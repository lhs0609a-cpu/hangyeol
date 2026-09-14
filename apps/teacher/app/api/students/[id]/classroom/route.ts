import { buildStudentBook, buildTeacherGuide, SKILLS } from '@hangyeol/content';
import { handle, readJson, requireStudentContext, db, observationHistory, recentTeachingNeeds, saveTeachingObservation, apiError, recordAssetView, clientIp } from '@hangyeol/core';
export const dynamic = 'force-dynamic';
export function GET(req: Request, {params}: {params:{id:string}}) {
  return handle(async () => {
    const ctx = await requireStudentContext(req, params.id);
    const url = new URL(req.url), unitNo = Number(url.searchParams.get('unit'));
    const book = buildStudentBook(unitNo);
    if (!book) throw apiError('NOT_FOUND');
    await recordAssetView({teacherId:ctx.teacherId,studentId:ctx.student.id,unitId:BigInt(unitNo),ip:clientIp(req),ua:req.headers.get('user-agent')});
    // Projection happens on the server: presentation responses contain no guide or records.
    if (url.searchParams.get('view') === 'student') return {book};
    const [history, progress, previous, recentNeeds] = await Promise.all([
      observationHistory(ctx.student.id, unitNo),
      db().learningProgress.findUnique({where:{studentId:ctx.student.id}}),
      db().lesson.findFirst({where:{studentId:ctx.student.id,reportSubmittedAt:{not:null}},orderBy:[{startedAt:'desc'},{id:'desc'}],select:{lessonNo:true,reportItems:{select:{kind:true,body:true},orderBy:{ord:'asc'}},reportSubmittedAt:true}}),
      recentTeachingNeeds(ctx.student.id),
    ]);
    const notes = progress?.notes as Record<string,string> | null;
    const help = (notes?.[`help-unit-${unitNo}`] ?? '').split(',').filter(s => SKILLS.some(skill => skill === s));
    return {book,guide:buildTeacherGuide(unitNo),history,recentNeeds,studentWork:notes?.[`unit-${unitNo}`] ?? '',help,previous:previous?{lessonNo:previous.lessonNo,reportSubmittedAt:previous.reportSubmittedAt,errors:previous.reportItems.filter(i=>i.kind==='error').map(i=>i.body),expressions:previous.reportItems.filter(i=>i.kind==='expression').map(i=>i.body)}:null};
  });
}
export function POST(req: Request, {params}: {params:{id:string}}) {
  return handle(async () => {
    const ctx = await requireStudentContext(req, params.id);
    return saveTeachingObservation(ctx.teacherId,ctx.student.id,await readJson(req));
  });
}
