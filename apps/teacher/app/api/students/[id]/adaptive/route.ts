import {adaptiveOverview,adjustLearning,handle,readJson,requireTeacher} from '@hangyeol/core';
export const dynamic='force-dynamic';
export function GET(req:Request,{params}:{params:{id:string}}){return handle(async()=>{const ctx=await requireTeacher(req);return adaptiveOverview(ctx.teacherId,BigInt(params.id));});}
export function POST(req:Request,{params}:{params:{id:string}}){return handle(async()=>{const ctx=await requireTeacher(req);return adjustLearning(ctx.teacherId,BigInt(params.id),await readJson(req));});}
