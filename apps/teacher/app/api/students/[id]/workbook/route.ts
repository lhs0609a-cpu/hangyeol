import { db, handle, requireOwnStudent } from '@hangyeol/core';
export const dynamic = 'force-dynamic';
export function GET(req:Request,{params}:{params:{id:string}}){return handle(async()=>{
  const {student}=await requireOwnStudent(req,params.id);
  return await db().learningProgress.findUnique({where:{studentId:student.id}})??{completed:[],notes:{}};
});}
