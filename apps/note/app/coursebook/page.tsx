'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { StudentWorkbook } from '@hangyeol/ui';
import type { StudentBook } from '@hangyeol/content';
import { SKILLS, SKILL_LABELS, type LearningSkill } from '@hangyeol/content/learning-skills';
import './coursebook.css';
import '@hangyeol/ui/workbook.css';
type Data={learningMessage?:string|null;book:StudentBook;units:{unitNo:number;title:string}[];answer:string;submitted:boolean;help:LearningSkill[]};
async function request<T>(url:string,body?:unknown):Promise<T>{const r=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();if(!r.ok)throw new Error(data.error?.message??'Please try again.');return data;}
export default function Coursebook(){
  const [data,setData]=useState<Data|null>(null),[answer,setAnswer]=useState(''),[spoken,setSpoken]=useState(false),[help,setHelp]=useState<LearningSkill[]>([]),[stage,setStage]=useState(0);
  const [message,setMessage]=useState('Loading your lesson…'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
  async function load(n?:number){setBusy(true);setError('');try{const d=await request<Data>(`/api/note/coursebook${n?`?unit=${n}`:''}`);setData(d);setAnswer(d.answer);setHelp(d.help);setSpoken(false);setStage(0);setDirty(false);setMessage(d.submitted?'Your previous practice has been saved. / 이전 답안이 저장되어 있어요.':'');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  useEffect(()=>{void load();},[]);
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  async function save(helpOnly=false){if(!data||busy)return;setBusy(true);setError('');try{await request('/api/note/coursebook',helpOnly?{unitNo:data.book.unitNo,action:'help',help}:{unitNo:data.book.unitNo,answer,spoken,help});if(!helpOnly)setDirty(false);setMessage(helpOnly?'Help request saved. / 선생님이 확인할 수 있도록 저장했어요.':'Saved for your teacher to review. / 선생님이 확인할 수 있도록 답안을 저장했어요.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <main className="note-coursebook"><Link href="/">← Learning notebook</Link><h1>My lesson · 나의 수업 교재</h1><p>Look, listen, practise, and try it in your own words.</p><p role="status">{message}</p>{error&&<p role="alert">{error}</p>}{!data&&!busy&&<button onClick={()=>void load()}>다시 불러오기 / Retry</button>}{data&&<>{data.learningMessage&&<p>{data.learningMessage}</p>}
    <label>Lesson / 수업 <select disabled={busy} value={data.book.unitNo} onChange={e=>{if(!dirty||window.confirm('저장하지 않은 내용이 있어요. 수업을 바꿀까요? / Discard unsaved changes?'))void load(Number(e.target.value));}} style={{maxWidth:'100%',padding:10,font:'inherit'}}>{data.units.map(u=><option key={u.unitNo} value={u.unitNo}>{u.unitNo}. {u.title}</option>)}</select></label>
    <div style={{marginTop:24}}><StudentWorkbook key={data.book.unitNo} book={data.book} stage={stage} onStage={setStage}/></div>
    <section style={{marginTop:28}}><h2>도움이 필요한 부분 / Where I need help</h2><p>모르는 부분을 골라요. 아직 답을 못 써도 선생님에게 알릴 수 있어요.</p><fieldset disabled={busy} className="teaching-support-options" style={{border:0,padding:0}}><legend>함께 연습하고 싶어요 / Practise together</legend>{SKILLS.map(skill=><label key={skill}><input type="checkbox" checked={help.includes(skill)} onChange={e=>{setHelp(items=>e.target.checked?[...items,skill]:items.filter(x=>x!==skill));setDirty(true);}}/> {SKILL_LABELS[skill]}</label>)}</fieldset><button disabled={busy} onClick={()=>void save(true)} style={{padding:'12px 20px'}}>도움 요청 저장 / Save help request</button></section>
    <section style={{marginTop:28}}><h2>내 답안 / My answer</h2><label htmlFor="course-answer">오늘 만든 문장이나 아직 궁금한 점을 적어요.</label><textarea id="course-answer" disabled={busy} value={answer} maxLength={5000} onChange={e=>{setAnswer(e.target.value);setSpoken(false);setDirty(true);}} style={{display:'block',width:'100%',boxSizing:'border-box',minHeight:180,padding:16,font:'inherit',margin:'12px 0',borderRadius:10}}/><label style={{display:'block',marginBottom:20}}><input type="checkbox" disabled={busy} checked={spoken} onChange={e=>setSpoken(e.target.checked)}/> I practised saying my answer. / 소리 내어 연습했어요.</label><button disabled={busy||!spoken||answer.trim().length<3} onClick={()=>void save()} style={{padding:'12px 20px'}}>Save for my teacher / 선생님께 공유</button></section>
    <p>선생님과 함께 이해한 내용을 확인하고 다음 수업을 정해요. / Your teacher checks your work before moving on.</p></>}</main>;
}
