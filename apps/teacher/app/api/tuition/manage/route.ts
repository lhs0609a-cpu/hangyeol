import { db, handle, requireTeacher } from '@hangyeol/core';
export const dynamic='force-dynamic';
export function GET(req:Request){return handle(async()=>{
  const {teacherId}=await requireTeacher(req);
  const [enrollments,usage,payouts,students]=await Promise.all([
    db().tuitionEnrollment.findMany({where:{teacherId},orderBy:{createdAt:'desc'},take:200}),
    db().tuitionUsage.findMany({where:{teacherId},orderBy:{completedAt:'desc'},take:200}),
    db().teacherPayout.findMany({where:{teacherId},orderBy:{createdAt:'desc'},take:200}),
    db().student.findMany({where:{teacherId},select:{id:true,name:true},take:1000}),
  ]);return {enrollments,usage,payouts,students};
});}
