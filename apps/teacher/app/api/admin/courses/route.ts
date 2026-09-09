import { apiError, createPayout, db, decideApplication, handle, readJson, recordPayout, requireAdmin, saveOffer } from '@hangyeol/core';
export const dynamic='force-dynamic';
export function GET(req:Request){return handle(async()=>{
  await requireAdmin(req);
  const [offers,applications,enrollments,payouts,teachers]=await Promise.all([
    db().courseOffer.findMany({orderBy:{createdAt:'desc'},take:200}),
    db().courseApplication.findMany({orderBy:{createdAt:'desc'},take:200,select:{id:true,offerId:true,name:true,language:true,timezone:true,goal:true,status:true,studentId:true,createdAt:true}}),
    db().tuitionEnrollment.findMany({orderBy:{createdAt:'desc'},take:200}),
    db().teacherPayout.findMany({orderBy:{createdAt:'desc'},take:200}),
    db().teacher.findMany({where:{approvalStatus:'approved'},select:{id:true,name:true},take:500}),
  ]);
  return {offers,applications,enrollments,payouts,teachers};
});}
export function POST(req:Request){return handle(async()=>{
  const {teacherId:actorId}=await requireAdmin(req);
  const body=await readJson<Record<string,unknown>>(req);
  if(body.action==='offer')return saveOffer(body,actorId);
  if(body.action==='decide' && typeof body.id==='string' && (body.decision==='approved'||body.decision==='rejected'))return decideApplication(body.id,body.decision,actorId);
  if(body.action==='payout' && typeof body.teacherId==='string' && /^\d+$/.test(body.teacherId))return createPayout(BigInt(body.teacherId),actorId);
  if(body.action==='paid' && typeof body.id==='string' && typeof body.reference==='string' && body.transferred===true)return recordPayout(body.id,body.reference,actorId);
  if(body.action==='publish' && typeof body.id==='string' && typeof body.published==='boolean')return db().$transaction(async tx=>{
    const offer=await tx.courseOffer.update({where:{id:body.id as string},data:{published:body.published as boolean}});
    await tx.auditLog.create({data:{actorType:'admin',actorId,action:'course.publish',meta:{offerId:offer.id,published:offer.published}}});
    return offer;
  });
  throw apiError('VALIDATION_FAILED');
});}
