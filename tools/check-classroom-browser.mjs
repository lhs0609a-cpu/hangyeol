import { mkdir,writeFile } from 'node:fs/promises';
import { chromium } from './browser-runtime.mjs';
import { buildStudentBook,buildTeacherGuide } from '../packages/content/dist/coursebook.js';
import { SKILLS } from '../packages/content/dist/learning-skills.js';
const teacherOrigin=process.env.CLASSROOM_TEACHER_URL??'http://127.0.0.1:3217';
const noteOrigin=process.env.CLASSROOM_NOTE_URL??'http://127.0.0.1:3218';
const output='output/design-review';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.addCookies([{name:'hg_access',value:'browser-ui-fixture',url:teacherOrigin}]);
const results=[],errors=[];let history=[],studentHelp=[],studentAnswer='따뜻한 커피를 주세요.';
const assert=(ok,message)=>{if(!ok)throw new Error(message);results.push(message);};
const entries=()=>SKILLS.map(skill=>({skill,outcome:'unknown',evidence:'',retest:'not_checked',retestEvidence:''}));
await context.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),unit=Number(url.searchParams.get('unit')??15),book=buildStudentBook(unit);
  let data={};
  if(url.pathname.endsWith('/classroom')){
    if(req.method()==='POST'){const body=req.postDataJSON();history=[{id:'1',at:new Date().toISOString(),entries:body.entries}];data={id:'1'};}
    else data=url.searchParams.get('view')==='student'?{book}:{book,guide:buildTeacherGuide(unit),history,recentNeeds:[],studentWork:studentAnswer,help:studentHelp,previous:{lessonNo:14,errors:['PRIVATE_TEACHER_SENTINEL'],expressions:['커피를 마셔요.'],reportSubmittedAt:new Date().toISOString()}};
  }else if(url.pathname.endsWith('/plan')) data={teaching:{studentId:'2',studentName:'테스트 학습자',nextLessonNo:15,headline:'카페 주문을 내 말로',modeReason:'수업 준비',unit:{unitNo:15,title:'카페에서 주문하기',goalStatement:book.goal},exitTicket:book.tasks,allocation:[],reviewItems:[],focus:[],plan:null,l1Note:null,pitfalls:[]},mastery:{currentLessonNo:15,lessonsPerWeek:2,vocabTotal:20,weeksToNextLevel:null,priorities:[]}};
  else if(url.pathname.endsWith('/adaptive')) data={currentUnitNo:15,nextUnitNo:15,canAdjust:false,units:[],history:[],anchorLessonId:null,revision:null};
  else if(url.pathname.endsWith('/coursebook')){
    if(req.method()==='POST'){const body=req.postDataJSON();studentHelp=body.help??studentHelp;if(body.action!=='help')studentAnswer=body.answer;data={submitted:body.action!=='help'};}
    else data={book,units:[{unitNo:15,title:book.title},{unitNo:211,title:buildStudentBook(211).title}],answer:studentAnswer,submitted:true,help:studentHelp};
  }
  await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
});
const teacher=await context.newPage();teacher.on('pageerror',e=>errors.push(e.message));
teacher.setDefaultTimeout(30000);teacher.setDefaultNavigationTimeout(120000);
try{
  await teacher.goto(`${teacherOrigin}/plan/2`);await teacher.getByLabel('학생용 교재',{exact:true}).waitFor();
  await teacher.locator('.workbook-picture img').evaluate(img=>img.decode());
  await teacher.screenshot({path:`${output}/classroom-teacher-desktop.png`,fullPage:true});
  await teacher.getByRole('button',{name:/대화와 표현/}).click();
  const popupPromise=context.waitForEvent('page');await teacher.getByRole('link',{name:'학생에게 보여줄 화면 열기'}).click();const presentation=await popupPromise;
  await presentation.getByLabel('학생용 교재',{exact:true}).waitFor();
  await presentation.getByRole('heading',{name:'듣고, 읽고, 뜻을 확인해요'}).waitFor();
  assert(!(await presentation.locator('body').innerText()).includes('PRIVATE_TEACHER_SENTINEL'),'student presentation excludes private teacher records');
  await teacher.getByLabel('듣기 확인: 대화 가리기').check();
  await presentation.getByText('먼저 선생님의 말을 들어 보세요.',{exact:false}).waitFor();
  assert(await presentation.locator('.workbook-dialogue').count()===0,'model hiding synchronizes across windows');
  await teacher.getByLabel('듣기·이해 첫 확인 결과').selectOption('support');
  await teacher.getByLabel('듣기·이해 관찰 근거').fill('글을 가리면 질문을 다시 읽어 달라고 요청함');
  await teacher.getByRole('button',{name:'관찰·보강 결과 저장'}).click();await teacher.getByText('관찰과 보강 결과를 저장했습니다.',{exact:false}).waitFor();
  await teacher.reload();await teacher.getByLabel('학생용 교재',{exact:true}).waitFor();
  assert((await teacher.locator('.teaching-evidence').first().innerText()).includes('듣기·이해'),'saved weakness appears after reload');
  const note=await context.newPage();note.on('pageerror',e=>errors.push(e.message));note.setDefaultNavigationTimeout(120000);
  await note.goto(`${noteOrigin}/coursebook`);await note.getByLabel('학생용 교재',{exact:true}).waitFor();
  await note.getByLabel('듣기·이해',{exact:true}).check();await note.getByRole('button',{name:'도움 요청 저장'}).click();await note.getByText('Help request saved.',{exact:false}).waitFor();
  assert(studentHelp.includes('listening'),'student can request help without a new answer');
  for(const width of [390,768,1440]){
    await teacher.setViewportSize({width,height:1000});await teacher.screenshot({path:`${output}/classroom-teacher-${width}.png`,fullPage:true});
    assert(await teacher.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`teacher has no horizontal overflow at ${width}px`);
    await note.setViewportSize({width,height:1000});await note.screenshot({path:`${output}/classroom-student-${width}.png`,fullPage:true});
    assert(await note.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`student has no horizontal overflow at ${width}px`);
  }
  assert(errors.length===0,`no browser runtime errors: ${errors.join('; ')}`);
  await writeFile(`${output}/classroom-browser-results.json`,JSON.stringify({mode:'UI fixtures; API authorization tested separately',results,errors},null,2));
  console.log(JSON.stringify({results,errors},null,2));
}finally{await browser.close();}
