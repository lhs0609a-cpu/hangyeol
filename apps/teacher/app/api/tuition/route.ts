import { apiError, confirmTuition, db, handle, magicLinkUrl, ownTuitionOrder, paymentConfiguration, readJson, refundTuition, requireStudentSession } from '@hangyeol/core';
export const dynamic='force-dynamic';
export const maxDuration=180;
export function GET(req:Request){return handle(async()=>{
  const claims=await requireStudentSession(req);const studentId=BigInt(claims.studentId);
  const id=new URL(req.url).searchParams.get('id');
  if(id){const order=await ownTuitionOrder(studentId,id);return {id:order.id,name:order.name,amount:order.amount,status:order.status,...paymentConfiguration()};}
  const [orders,enrollments]=await Promise.all([
    db().paymentOrder.findMany({where:{studentId,kind:'tuition'},orderBy:{createdAt:'desc'},select:{id:true,name:true,amount:true,status:true,createdAt:true,paidAt:true},take:100}),
    db().tuitionEnrollment.findMany({where:{studentId},select:{id:true,orderId:true,sessions:true,used:true,status:true,refundAmount:true},take:100}),
  ]);
  return {orders,enrollments,noteUrl:await magicLinkUrl(studentId,BigInt(claims.teacherId)),...paymentConfiguration()};
});}
export function POST(req:Request){return handle(async()=>{
  const {studentId}=await requireStudentSession(req);
  const body=await readJson<Record<string,unknown>>(req);
  if(body.action==='confirm')return confirmTuition(BigInt(studentId),body);
  if(body.action==='refund' && typeof body.orderId==='string')return refundTuition(BigInt(studentId),body.orderId);
  throw apiError('VALIDATION_FAILED');
});}
