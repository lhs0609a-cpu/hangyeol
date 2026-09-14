import {ALL_UNITS, LESSON_PLANS, LEARNING_SCENES, buildStudentBook, SKILLS} from '@hangyeol/content';
import {apiError,db,handle,readJson,requireStudentSession,latestAdjustment,adjustedNextUnit} from '@hangyeol/core';
export const dynamic='force-dynamic';
async function context(req:Request){
  const claims=await requireStudentSession(req);
  const student=await db().student.findUnique({where:{id:BigInt(claims.studentId)},include:{teacher:{select:{billingStatus:true}}}});
  if(!student||student.teacherId!==BigInt(claims.teacherId))throw apiError('NOT_FOUND');
  if(!student.verifiedAt)throw apiError('STUDENT_NOT_VERIFIED');
  if(student.status==='locked'||student.teacher.billingStatus==='locked')throw apiError('TEACHER_LOCKED');
  if(student.currentLessonNo===0 && !await db().levelTest.findFirst({where:{studentId:student.id},select:{id:true}}))throw apiError('VALIDATION_FAILED','Complete your level check in the learning notebook before opening your first coursebook.');
  return student;
}
async function availableUnits(student:{id:bigint;currentLessonNo:number;levelCode:string|null}) {
  const prisma=db();
  const [last,highest,adjustment]=await Promise.all([
    prisma.lesson.findFirst({where:{studentId:student.id},orderBy:[{startedAt:'desc'},{id:'desc'}]}),
    prisma.lesson.aggregate({where:{studentId:student.id},_max:{lessonNo:true}}),
    latestAdjustment(prisma,student.id),
  ]);
  const current=student.currentLessonNo || ALL_UNITS.find(u=>u.levelCode===student.levelCode)?.unitNo || 1;
  const suggested=adjustedNextUnit(current,last,adjustment);
  return {suggested,max:Math.max(current,highest._max.lessonNo??0,suggested),support:!!adjustment && suggested===adjustment.targetUnitNo && adjustment.mode!=='keep'};
}
export function GET(req:Request){return handle(async()=>{
  const student=await context(req),available=await availableUnits(student),max=available.max;
  const unitNo=Number(new URL(req.url).searchParams.get('unit')??available.suggested);
  const unit=ALL_UNITS.find(u=>u.unitNo===unitNo && u.unitNo<=max);
  const plan=LESSON_PLANS.find(p=>p.unitNo===unitNo);
  if(!unit||!plan)throw apiError('NOT_FOUND');
  const progress=await db().learningProgress.findUnique({where:{studentId:student.id}});
  const text=[unit.title,...unit.targetVocab].join(' ');
  const scene=/교통|지하철|버스|길|역|이동/.test(text)?'transit':/카페|커피|주문/.test(text)?'cafe':/식당|음식|먹|요리/.test(text)?'restaurant':/시장|가게|가격|쇼핑/.test(text)?'market':/하루|일과|어제|시간|주말/.test(text)?'routine':/질문|확인|요청|대화/.test(text)?'clarification':'friends';
  const book=buildStudentBook(unitNo)!;
  const help=((progress?.notes as Record<string,string>|null)?.[`help-unit-${unitNo}`]??'').split(',').filter(s=>SKILLS.some(skill=>skill===s));
  return {book,help,learningMessage:available.support?'A little foundation practice to help you speak more comfortably. / 더 편하게 말하기 위한 기초 연습이에요.':null,unit,model:book.model,tasks:book.tasks,image:LEARNING_SCENES[scene],units:ALL_UNITS.filter(u=>u.unitNo<=max).map(u=>({unitNo:u.unitNo,title:u.title})),answer:(progress?.notes as Record<string,string>|null)?.[`unit-${unitNo}`]??'',submitted:progress?.completed.includes(`unit-${unitNo}`)??false};
});}
export function POST(req:Request){return handle(async()=>{
  const student=await context(req),body=await readJson<{unitNo:number;answer?:string;spoken?:boolean;action?:string;help?:string[]}>(req);
  const available=await availableUnits(student);
  if(!Number.isInteger(body.unitNo)||body.unitNo<1||body.unitNo>available.max||!ALL_UNITS.some(u=>u.unitNo===body.unitNo))throw apiError('VALIDATION_FAILED');
  if(body.action!==undefined&&body.action!=='help')throw apiError('VALIDATION_FAILED');
  if(body.help!==undefined&&(!Array.isArray(body.help)||body.help.length>SKILLS.length||body.help.some(s=>!SKILLS.some(skill=>skill===s))))throw apiError('VALIDATION_FAILED');
  const helpOnly=body.action==='help';
  if(helpOnly&&!Array.isArray(body.help))throw apiError('VALIDATION_FAILED');
  if(!helpOnly&&(typeof body.answer!=='string'||body.answer.trim().length<3||body.answer.length>5000||body.spoken!==true))throw apiError('VALIDATION_FAILED','Write your answer and practise speaking before submitting.');
  return db().$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM students WHERE id = ${student.id} FOR UPDATE`;
    const previous=await tx.learningProgress.findUnique({where:{studentId:student.id}}),key=`unit-${body.unitNo}`;
    const notes={...(previous?.notes as Record<string,string>??{}),...(!helpOnly?{[key]:body.answer!.trim()}:{}),...(body.help!==undefined?{[`help-unit-${body.unitNo}`]:[...new Set(body.help)].join(',')}:{})};
    const completed=[...new Set([...(previous?.completed??[]),...(!helpOnly?[key]:[])])];
    await tx.learningProgress.upsert({where:{studentId:student.id},create:{studentId:student.id,notes,completed},update:{notes,completed}});
    await tx.studentActivity.create({data:{studentId:student.id,kind:'worksheet',meta:{unitNo:body.unitNo}}});
    return {submitted:!helpOnly,helpSaved:body.help!==undefined};
  });
});}
