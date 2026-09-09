import { ALL_UNITS, unitByNo } from '@hangyeol/content';
import type { Prisma } from '@hangyeol/db';
import { z } from 'zod';
import { db } from './guard.js';
import { apiError } from './errors.js';
import { nextUnitNo } from './lesson-progress.js';

const KIND = 'learning_adjustment';
export const observationSchema = z.object({ reading:z.number().int().min(0).max(2), listening:z.number().int().min(0).max(2), speaking:z.number().int().min(0).max(2) });
export type Observation = z.infer<typeof observationSchema>;
export type Adjustment = { assessedLessonId?:string; teacherId?:string; decision?:'keep'|'supplement'|'reassign'; mode:'keep'|'supplement'|'reassign'; targetUnitNo:number; resumeUnitNo:number; anchorLessonId:string; reason:string; observations:Observation; requestId:string };
type Client = Pick<Prisma.TransactionClient,'studentActivity'>;
export async function latestAdjustment(client:Client, studentId:bigint) {
  const row=await client.studentActivity.findFirst({where:{studentId,kind:KIND},orderBy:{id:'desc'}});
  return row ? { revision:String(row.id), ...row.meta as unknown as Adjustment } : null;
}
export function adjustedNextUnit(normal:number,last:{id:bigint;lessonNo:number;outcome:string|null;reportSubmittedAt:Date|null}|null,adjustment:Adjustment|null) {
  if(!adjustment || !last || adjustment.mode==='keep')return normal;
  if(String(last.id)===adjustment.anchorLessonId)return adjustment.targetUnitNo;
  if(adjustment.mode==='supplement' && last.lessonNo===adjustment.targetUnitNo) {
    return last.reportSubmittedAt && last.outcome==='pass' ? adjustment.resumeUnitNo : adjustment.targetUnitNo;
  }
  return normal;
}
export function recommendAdjustment(current:number,observations:Observation,focus='') {
  const scores=Object.values(observationSchema.parse(observations));
  const previousLevel=ALL_UNITS.filter(u=>u.unitNo<current && u.levelCode!==unitByNo(current)?.levelCode).at(-1)?.levelCode;
  const easier=ALL_UNITS.find(u=>u.levelCode===previousLevel)?.unitNo??1;
  const aliases: [RegExp,RegExp][]=[[/과거|past/i,/았|었|어제/],[/숫자|수사|number/i,/숫자|수사/],[/부정|negation/i,/부정|안 |못 /],[/조사|particle/i,/은\/는|이\/가|을\/를/]];
  const expression=aliases.find(([alias])=>alias.test(focus))?.[1];
  const match=focus.trim().length>=2 ? ALL_UNITS.find(u=>u.unitNo<current && [u.title,...u.targetForms,...u.targetVocab].some(t=>expression?expression.test(t):t.includes(focus.trim()))) : null;
  if(scores.every(s=>s===2))return {mode:'keep' as const,targetUnitNo:current,explanation:'세 영역을 혼자 수행했습니다. 현재 진도를 유지하세요.'};
  if(current===1 || scores.filter(s=>s===0).length>=2 || scores.every(s=>s<2))return {mode:'reassign' as const,targetUnitNo:easier,explanation:'여러 영역에서 도움이 필요합니다. 더 쉬운 단원에서 실제 수행을 다시 확인하세요.'};
  return {mode:'supplement' as const,targetUnitNo:match?.unitNo??easier,explanation:'취약한 부분을 먼저 연습한 뒤 원래 진도로 돌아갑니다. 표현과 단원 목표를 보고 보충 단원을 확인하세요.'};
}
export async function adaptiveOverview(teacherId:bigint,studentId:bigint) {
  const prisma=db();const student=await prisma.student.findUnique({where:{id:studentId}});
  if(!student || student.teacherId!==teacherId)throw apiError('NOT_FOUND');
  const last=await prisma.lesson.findFirst({where:{studentId},orderBy:[{startedAt:'desc'},{id:'desc'}]});
  const adjustment=await latestAdjustment(prisma,studentId);
  const normal=nextUnitNo(student.currentLessonNo,last?.outcome,student.levelCode);
  const history=await prisma.studentActivity.findMany({where:{studentId,kind:KIND},orderBy:{id:'desc'},take:10});
  return {anchorLessonId:last?String(last.id):null,revision:adjustment?.revision??null,canAdjust:!!last?.reportSubmittedAt,currentUnitNo:last?.lessonNo??normal,nextUnitNo:adjustedNextUnit(normal,last,adjustment),adjustment,
    units:ALL_UNITS.filter(u=>u.unitNo<=(last?.lessonNo??normal)).map(u=>({unitNo:u.unitNo,title:u.title,goal:u.goalStatement})),
    history:history.map(r=>({id:String(r.id),at:r.occurredAt.toISOString(),...r.meta as unknown as Adjustment}))};
}
const inputSchema=z.object({action:z.enum(['recommend','apply']),observations:observationSchema,focus:z.string().max(100).default(''),mode:z.enum(['keep','supplement','reassign']).optional(),targetUnitNo:z.number().int().min(1).max(250).optional(),reason:z.string().trim().min(5).max(1000),anchorLessonId:z.string().regex(/^\d+$/),revision:z.string().nullable(),requestId:z.string().uuid()});
export async function adjustLearning(teacherId:bigint,studentId:bigint,body:unknown) {
  const parsed=inputSchema.safeParse(body);if(!parsed.success)throw apiError('VALIDATION_FAILED','세 영역 평가와 관찰 근거를 모두 입력해 주세요.');const input=parsed.data;
  return db().$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${teacherId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM students WHERE id = ${studentId} FOR UPDATE`;
    const student=await tx.student.findUnique({where:{id:studentId},include:{teacher:true}});
    if(!student || student.teacherId!==teacherId)throw apiError('NOT_FOUND');
    if(student.status==='locked'||student.teacher.billingStatus==='locked')throw apiError('TEACHER_LOCKED');
    const previous=await latestAdjustment(tx,studentId);
    if(input.action==='apply' && previous?.requestId===input.requestId)return previous;
    const last=await tx.lesson.findFirst({where:{studentId},orderBy:[{startedAt:'desc'},{id:'desc'}]});
    if(!last?.reportSubmittedAt)throw apiError('VALIDATION_FAILED','진행 중인 수업의 리포트를 먼저 저장해 주세요.');
    if(String(last.id)!==input.anchorLessonId || (previous?.revision??null)!==input.revision)throw apiError('VALIDATION_FAILED','수업이나 조정 내용이 변경되었습니다. 화면을 새로고침해 주세요.');
    const recommendation=recommendAdjustment(last.lessonNo,input.observations,input.focus);
    if(input.action==='recommend')return recommendation;
    if(!input.mode || !input.targetUnitNo)throw apiError('VALIDATION_FAILED');
    const normal=nextUnitNo(student.currentLessonNo,last.outcome,student.levelCode);
    const resume=adjustedNextUnit(normal,last,previous);
    // Replacing a supplement must retain its original return point.
    const resumeUnitNo=previous?.mode==='supplement' && (String(last.id)===previous.anchorLessonId || last.lessonNo===previous.targetUnitNo)?previous.resumeUnitNo:resume;
    if(!unitByNo(input.targetUnitNo)||input.targetUnitNo>last.lessonNo || (input.mode==='supplement' && (input.targetUnitNo>=resumeUnitNo || !unitByNo(resumeUnitNo))))throw apiError('VALIDATION_FAILED','현재보다 쉬운 보충 단원을 선택해 주세요.');
    const preserve=input.mode==='keep' && previous && (String(last.id)===previous.anchorLessonId || (previous.mode==='supplement' && last.lessonNo===previous.targetUnitNo));
    const meta:Adjustment={assessedLessonId:String(last.id),teacherId:String(teacherId),decision:input.mode,mode:preserve?previous.mode:input.mode,targetUnitNo:preserve?previous.targetUnitNo:input.targetUnitNo,resumeUnitNo:preserve?previous.resumeUnitNo:resumeUnitNo,anchorLessonId:preserve?previous.anchorLessonId:String(last.id),reason:input.reason,observations:input.observations,requestId:input.requestId};
    const row=await tx.studentActivity.create({data:{studentId,kind:KIND,meta:meta as unknown as Prisma.InputJsonValue}});
    return {revision:String(row.id),...meta};
  });
}
