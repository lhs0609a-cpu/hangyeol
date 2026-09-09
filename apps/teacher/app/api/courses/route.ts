import { apiError, applyForCourse, clientIp, db, enforce, handle, hashEmail, readJson } from '@hangyeol/core';
export const dynamic = 'force-dynamic';
export function GET() { return handle(async () => {
  const offers = await db().courseOffer.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 100, select: { id:true,teacherId:true,title:true,description:true,sessions:true,minutes:true,amount:true } });
  const teachers = await db().teacher.findMany({ where: { id: { in: offers.map(o=>o.teacherId) }, approvalStatus:'approved' }, select: { id:true,name:true,nameEn:true,spokenLangs:true } });
  return { offers: offers.filter(o=>teachers.some(t=>t.id===o.teacherId)).map(({teacherId,...o})=>({ ...o, teacher: teachers.find(t=>t.id===teacherId)?.nameEn || teachers.find(t=>t.id===teacherId)?.name, languages: teachers.find(t=>t.id===teacherId)?.spokenLangs })) };
}); }
export function POST(req:Request) { return handle(async () => {
  enforce('magicLink', `course:${clientIp(req)}`);
  const body=await readJson<Record<string,unknown>>(req);
  if(body.action==='access') {
    if(typeof body.email!=='string' || body.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw apiError('VALIDATION_FAILED');
    const students=await db().student.findMany({where:{emailHash:hashEmail(body.email)},select:{id:true},take:10});
    for(const student of students) {
      if(!await db().tuitionEnrollment.count({where:{studentId:student.id}})) continue;
      const existing=await db().notification.findFirst({where:{targetType:'student',targetId:student.id,kind:'course_ready',scheduledAt:{gte:new Date(Date.now()-15*60_000)}}});
      if(!existing) await db().notification.create({data:{targetType:'student',targetId:student.id,kind:'course_ready',channel:'email',scheduledAt:new Date()}});
    }
    return {message:'If you have an approved course, a private access link will be emailed to you.'};
  }
  return applyForCourse(body);
}); }
