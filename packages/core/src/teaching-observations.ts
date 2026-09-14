import { z } from 'zod';
import { SKILLS, unitByNo } from '@hangyeol/content';
import type { Prisma } from '@hangyeol/db';
import { db } from './guard.js';
import { apiError } from './errors.js';

export const TEACHING_OBSERVATION_KIND = 'teaching_observation';
export const observationEntrySchema = z.object({
  skill: z.enum(SKILLS), outcome: z.enum(['unknown', 'support', 'independent']),
  evidence: z.string().trim().max(1000),
  retest: z.enum(['not_checked', 'support', 'independent']).default('not_checked'),
  retestEvidence: z.string().trim().max(1000).default(''),
}).superRefine((entry, ctx) => {
  if (entry.outcome !== 'unknown' && entry.evidence.length < 5) ctx.addIssue({code:'custom',message:'관찰한 학생 답변과 도움을 기록해 주세요.'});
  if (entry.retest !== 'not_checked' && (entry.outcome === 'unknown' || entry.retestEvidence.length < 5)) ctx.addIssue({code:'custom',message:'첫 관찰과 재확인 근거를 함께 기록해 주세요.'});
});
export const teachingObservationSchema = z.object({
  unitNo: z.number().int().min(1).max(250), revision: z.string().nullable(), requestId: z.string().uuid(),
  entries: z.array(observationEntrySchema).length(SKILLS.length),
}).refine(input => new Set(input.entries.map(e => e.skill)).size === SKILLS.length, '영역별로 한 번씩 기록해 주세요.');
export type TeachingObservationEntry = z.infer<typeof observationEntrySchema>;
export type TeachingObservationRecord = { unitNo: number; teacherId: string; requestId: string; lessonId: string | null; entries: TeachingObservationEntry[] };
export async function observationHistory(studentId: bigint, unitNo: number) {
  const rows = await db().studentActivity.findMany({where:{studentId,kind:TEACHING_OBSERVATION_KIND,meta:{path:['unitNo'],equals:unitNo}},orderBy:{id:'desc'},take:10});
  return rows.map(row => ({id:String(row.id),at:row.occurredAt.toISOString(),...(row.meta as unknown as TeachingObservationRecord)}));
}
export async function recentTeachingNeeds(studentId: bigint) {
  const rows = await db().studentActivity.findMany({where:{studentId,kind:TEACHING_OBSERVATION_KIND},orderBy:{id:'desc'},take:30});
  const seen = new Set<number>();
  return rows.flatMap(row => {
    const record = row.meta as unknown as TeachingObservationRecord;
    if (seen.has(record.unitNo)) return [];
    seen.add(record.unitNo);
    return record.entries.filter(entry=>entry.retest==='support'||(entry.outcome==='support'&&entry.retest!=='independent')).map(entry=>({unitNo:record.unitNo,at:row.occurredAt.toISOString(),skill:entry.skill,evidence:entry.retest==='support'?entry.retestEvidence:entry.evidence}));
  }).slice(0,12);
}
export async function saveTeachingObservation(teacherId: bigint, studentId: bigint, body: unknown) {
  const parsed = teachingObservationSchema.safeParse(body);
  if (!parsed.success) throw apiError('VALIDATION_FAILED', '평가한 영역의 관찰 근거와 재확인 근거를 입력해 주세요.');
  const input = parsed.data;
  if (!unitByNo(input.unitNo)) throw apiError('NOT_FOUND');
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM teachers WHERE id = ${teacherId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM students WHERE id = ${studentId} FOR UPDATE`;
    const student = await tx.student.findUnique({where:{id:studentId},include:{teacher:true}});
    if (!student || student.teacherId !== teacherId) throw apiError('NOT_FOUND');
    if (student.status === 'locked' || student.teacher.billingStatus === 'locked') throw apiError('TEACHER_LOCKED');
    const last = await tx.studentActivity.findFirst({where:{studentId,kind:TEACHING_OBSERVATION_KIND,meta:{path:['unitNo'],equals:input.unitNo}},orderBy:{id:'desc'}});
    if ((last?.meta as unknown as TeachingObservationRecord)?.requestId === input.requestId) return {id:String(last!.id)};
    if ((last ? String(last.id) : null) !== input.revision) throw apiError('VALIDATION_FAILED', '다른 화면에서 관찰 기록이 변경되었습니다. 새로 불러온 후 확인해 주세요.');
    const lesson = await tx.lesson.findFirst({where:{studentId,lessonNo:input.unitNo},orderBy:[{startedAt:'desc'},{id:'desc'}]});
    const meta: TeachingObservationRecord = {unitNo:input.unitNo,teacherId:String(teacherId),requestId:input.requestId,lessonId:lesson ? String(lesson.id) : null,entries:input.entries};
    const row = await tx.studentActivity.create({data:{studentId,kind:TEACHING_OBSERVATION_KIND,meta:meta as unknown as Prisma.InputJsonValue}});
    return {id:String(row.id)};
  });
}
