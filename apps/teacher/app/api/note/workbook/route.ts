import { FIRST_STEPS } from '@hangyeol/content';
import { apiError, db, handle, readJson, requireStudentSession } from '@hangyeol/core';
export const dynamic = 'force-dynamic';
export function GET(req: Request){return handle(async()=>{
  const {studentId}=await requireStudentSession(req);
  return await db().learningProgress.findUnique({where:{studentId:BigInt(studentId)}})??{completed:[],notes:{}};
});}
export function POST(req:Request){return handle(async()=>{
  const {studentId}=await requireStudentSession(req);
  const body=await readJson<{lessonId:string;note:string;complete?:boolean;answers?:number[];spoken?:boolean}>(req);
  const lesson=FIRST_STEPS.find(l=>l.id===body.lessonId);
  if(!lesson || typeof body.note!=='string' || body.note.length>2000)throw apiError('VALIDATION_FAILED');
  if(body.complete && (body.spoken !== true || !Array.isArray(body.answers) || lesson.questions.some((q,i)=>q.answer!==body.answers![i])))throw apiError('VALIDATION_FAILED','Check your answers and try speaking first.');
  return db().$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM students WHERE id = ${BigInt(studentId)} FOR UPDATE`;
    const previous=await tx.learningProgress.findUnique({where:{studentId:BigInt(studentId)}});
    const completed=[...new Set([...(previous?.completed??[]),...(body.complete?[lesson.id]:[])])];
    const notes={...(previous?.notes as Record<string,string>??{}),[lesson.id]:body.note};
    return tx.learningProgress.upsert({where:{studentId:BigInt(studentId)},create:{studentId:BigInt(studentId),completed,notes},update:{completed,notes}});
  });
});}
