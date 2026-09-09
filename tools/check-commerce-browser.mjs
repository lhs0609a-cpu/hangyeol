import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const requireFixture=createRequire(new URL('../output/browser-check/package.json',import.meta.url));
const {chromium}=requireFixture('playwright');
const teacher='http://127.0.0.1:3217',note='http://127.0.0.1:3218',out='output/design-review';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[],checks=[],calls=[];
page.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(15000);
const offer={id:'eab23d09-c5ef-4d33-8bb0-f8ca2f0d75ae',teacherId:'1',teacher:'Fixture teacher',languages:['en','ko'],title:'First Korean conversations',description:'Three private lessons. Start with greetings, a cafe conversation and your daily routine. Agree on lesson times with your teacher.',sessions:3,minutes:50,amount:10001,feeBps:1500,published:true};
const portal={orders:[{id:'fixture-order',name:offer.title,amount:10001,status:'pending'}],enrollments:[{orderId:'fixture-order',sessions:3,used:0,status:'pending',refundAmount:0}],noteUrl:`${note}/`,enabled:true,clientKey:'test_gck_fixture',testMode:true};
const admin={offers:[offer],applications:[{id:'application',offerId:offer.id,name:'Fixture learner',language:'en',timezone:'Asia/Seoul',goal:'Learn Korean for everyday conversation.',status:'pending'}],enrollments:[],payouts:[],teachers:[{id:'1',name:'Fixture teacher'}]};
let answer='';
await context.addInitScript(()=>{
  window.TossPayments=()=>({widgets:()=>({setAmount:async value=>{window.__widgetAmount=value;},renderPaymentMethods:async({selector})=>{document.querySelector(selector).textContent='TEST PAYMENT METHODS';return {destroy:async()=>{}};},renderAgreement:async({selector})=>{document.querySelector(selector).textContent='TEST PAYMENT AGREEMENT';return {destroy:async()=>{}};},requestPayment:async data=>{window.__payment=data;}}),payment:()=>({requestPayment:async data=>{window.__payment=data;}})});
});
await context.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,body=req.method()==='POST'?req.postDataJSON():null;
  if(body)calls.push({path,body});
  let data={};
  if(path==='/api/courses')data=body?{message:'Your request has been received.'}:{offers:[offer]};
  else if(path==='/api/tuition'){
    if(body?.action==='refund'){portal.orders[0].status='refunded';portal.enrollments[0].status='refunded';portal.enrollments[0].refundAmount=6668;}
    data=body?{status:portal.orders[0].status}:portal;
  }else if(path==='/api/admin/courses'){
    if(body?.action==='offer')admin.offers.push({...offer,...body,id:'new-offer'});
    if(body?.action==='decide')admin.applications[0].status=body.decision;
    if(body?.action==='payout')admin.payouts.push({id:'payout',teacherId:'1',amount:2834,status:'pending',transferReference:null});
    if(body?.action==='paid'){admin.payouts[0].status='paid';admin.payouts[0].transferReference=body.reference;}
    data=body?{ok:true}:admin;
  }else if(path==='/api/tuition/manage')data={enrollments:[{id:'e',studentId:'1',sessions:3,used:1,status:'active'}],usage:[{id:'u',lessonId:'1',gross:3333,fee:499,net:2834,status:'completed',payoutId:null}],payouts:admin.payouts,students:[{id:'1',name:'Fixture learner'}]};
  else if(path==='/api/note/coursebook'){
    if(body)answer=body.answer;
    data=body?{submitted:true}:{unit:{unitNo:1,title:'나의 하루',goalStatement:'하루 일과를 말할 수 있다.',targetForms:['-아요/어요'],targetVocab:['아침','오후','저녁']},model:['오늘 뭐 해요?','한국어를 공부해요.'],tasks:['하루를 세 문장으로 말해 보세요.'],image:{src:'/photos/learning/routine-v1.webp',alt:{en:'A daily routine',ko:'하루 일과'}},units:[{unitNo:1,title:'나의 하루'}],answer,submitted:!!answer};
  }else if(path==='/api/me')data={id:'1',name:'Fixture teacher',email:'fixture@example.test'};
  else return route.abort();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
});
async function fits(label){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: viewport overflow`);}
try{
  await page.goto(`${teacher}/courses`);await page.getByRole('button',{name:'Apply for this course'}).click();
  await page.getByLabel('Your name').fill('Mina Test');await page.locator('#application input[name=email]').fill('mina@example.test');await page.getByLabel('What would you like').fill('Everyday Korean. Weekdays in the morning.');await page.locator('input[name=consent]').check();await page.getByRole('button',{name:'Send application',exact:true}).click();await page.getByRole('status').filter({hasText:'received'}).waitFor();assert.equal(calls.find(c=>c.path==='/api/courses').body.consent,true);
  await page.screenshot({path:`${out}/courses-desktop.png`,fullPage:true});
  await page.setViewportSize({width:320,height:900});await fits('Courses at 320px');await page.screenshot({path:`${out}/courses-mobile.png`,fullPage:true});checks.push('Public application form validates and submits with consent; course catalog fits 320px.');
  await page.goto(`${teacher}/student-area`);await page.getByRole('button',{name:'Review & pay'}).click();await page.getByRole('button',{name:'Pay ₩10,001',exact:true}).click();assert.equal((await page.evaluate(()=>window.__payment)).orderId,'fixture-order');assert.equal((await page.evaluate(()=>window.__widgetAmount)).value,10001);await fits('Student payment at 320px');
  portal.clientKey='test_ck_fixture';await page.reload();await page.getByRole('button',{name:'Review & pay'}).click();await page.getByRole('button',{name:'Pay ₩10,001',exact:true}).click();assert.equal((await page.evaluate(()=>window.__payment)).amount.value,10001);checks.push('Both widget and individual card keys invoke the correct SDK path with the displayed order amount. SDK is a test stub.');
  portal.orders[0].status='paid';portal.enrollments[0].status='active';portal.enrollments[0].used=1;await page.reload();await page.getByRole('button',{name:'Refund unused lessons',exact:true}).click();assert.equal(calls.filter(c=>c.body.action==='refund').length,0);await page.getByRole('button',{name:'Confirm unused lesson refund'}).click();await page.getByText('Unused lessons refunded',{exact:true}).waitFor();assert.equal(calls.filter(c=>c.body.action==='refund').length,1);await page.screenshot({path:`${out}/student-refund-mobile.png`,fullPage:true});checks.push('Refund requires reviewing the unused amount and explicit confirmation.');
  await context.addCookies([{name:'hg_access',value:'invalid-local-review',url:teacher}]);await page.setViewportSize({width:1440,height:1000});await page.goto(`${teacher}/admin/courses`);
  const form=page.locator('form').first();await form.locator('[name=teacherId]').selectOption('1');await form.locator('[name=title]').fill('New Korean practice course');await form.locator('[name=description]').fill('Practice Korean conversation with a teacher in three scheduled lessons.');await form.locator('[name=sessions]').fill('3');await form.locator('[name=amount]').fill('10001');await form.locator('[name=fee]').fill('15');await page.getByRole('button',{name:'비공개 과정으로 저장'}).click();await page.getByText('New Korean practice course',{exact:true}).waitFor();assert.equal(calls.find(c=>c.body.action==='offer').body.feeBps,1500);
  await page.getByRole('button',{name:'승인 및 주문 생성'}).click();await page.getByText('approved',{exact:true}).waitFor();await page.locator('form').nth(1).locator('select').selectOption('1');await page.getByRole('button',{name:'미정산 완료 수업 묶기'}).click();await page.getByRole('button',{name:'실제 송금 내역 기록'}).click();await page.getByLabel('은행 송금 고유 식별자').fill('TEST-TRANSFER-REFERENCE');await page.locator('input[name=transferred]').check();await page.getByRole('button',{name:'송금 확인 기록 저장'}).click();await page.getByText('송금 확인 기록 완료',{exact:true}).waitFor();assert.equal(calls.find(c=>c.body.action==='paid').body.transferred,true);
  await page.screenshot({path:`${out}/course-admin-desktop.png`,fullPage:true});await page.setViewportSize({width:390,height:900});await fits('Course admin at 390px');checks.push('Admin creates a priced draft, approves application, groups earnings and records a confirmed bank-transfer reference. Data is a browser fixture.');
  await page.goto(`${teacher}/earnings`);await page.getByRole('heading',{name:'수강권과 정산 내역'}).waitFor();await fits('Teacher earnings at 390px');await page.screenshot({path:`${out}/earnings-mobile.png`,fullPage:true});
  await page.goto(`${note}/coursebook`);await page.getByLabel('My answer / 나의 답').fill('아침에 밥을 먹어요. 오후에 공부해요.');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Save for my teacher / 선생님께 공유'}).click();await page.getByRole('status').filter({hasText:'Saved for your teacher'}).waitFor();await page.reload();assert.equal(await page.getByLabel('My answer / 나의 답').inputValue(),answer);await fits('Student coursebook at 390px');await page.screenshot({path:`${out}/coursebook-mobile.png`,fullPage:true});checks.push('Student coursebook writing survives reload against the browser fixture; future-unit restriction is separately covered by the DB test.');
  assert.equal((await fetch(`${teacher}/api/tuition`)).status,401);assert.equal((await fetch(`${teacher}/api/admin/courses`)).status,401);checks.push('Real local API endpoints reject unauthenticated student and admin access.');
  assert.deepEqual(errors,[]);await writeFile(`${out}/commerce-browser-results.json`,JSON.stringify({checkedAt:new Date().toISOString(),checks,pageErrors:errors,limitations:'Payment SDK and browser data requests are fixtures. No real payment, email, or bank transfer.'},null,2));console.log(`PASS: ${checks.length} commerce browser checks.`);
}catch(error){await page.screenshot({path:`${out}/commerce-browser-failure.png`,fullPage:true}).catch(()=>{});await writeFile(`${out}/commerce-browser-failure.json`,JSON.stringify({error:String(error),url:page.url(),checks,errors},null,2));throw error;}finally{await browser.close();}
