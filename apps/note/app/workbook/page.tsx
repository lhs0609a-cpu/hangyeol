'use client';
import {useEffect,useState} from 'react';
import {FIRST_STEPS,LEARNING_SCENES} from '@hangyeol/content';
import {TopBar} from '../ui';
type Progress={completed:string[];notes:Record<string,string>};
export default function Workbook(){
 const [progress,setProgress]=useState<Progress>({completed:[],notes:{}}),[selected,setSelected]=useState(0),[answers,setAnswers]=useState<Record<number,number>>({}),[spoken,setSpoken]=useState(false),[checked,setChecked]=useState(false),[message,setMessage]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const lesson=FIRST_STEPS[selected]!,scene=LEARNING_SCENES[lesson.scene];
 const load=async()=>{try{const r=await fetch('/api/note/workbook');if(!r.ok)throw new Error();setProgress(await r.json());setReady(true);setMessage('');}catch{setMessage('Please open your teacher’s invitation link to save progress, or retry. / 초대 링크로 접속하거나 다시 시도해 주세요.');}};
 useEffect(()=>{void load();},[]);
 async function save(complete=false){setBusy(true);try{const r=await fetch('/api/note/workbook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,note:progress.notes[lesson.id]??'',complete,answers:lesson.questions.map((_,i)=>answers[i]),spoken})});if(!r.ok)throw new Error();setProgress(await r.json());setMessage('Saved to your notebook. Your teacher can see your progress. / 저장되었습니다.');}catch{setMessage('Could not save. Your writing is still here. Please retry. / 저장하지 못했습니다. 다시 시도해 주세요.');}finally{setBusy(false);}}
 return <div><TopBar/><h1>First steps / 한국어 첫걸음</h1><p>Saved missions: {progress.completed.length} / {FIRST_STEPS.length}</p><label>Choose a mission <select style={{width:'100%',padding:12,margin:'12px 0'}} value={selected} onChange={e=>{setSelected(Number(e.target.value));setAnswers({});setSpoken(false);setChecked(false);setMessage('');}}>{FIRST_STEPS.map((l,i)=><option key={l.id} value={i}>{i+1}. {l.title.en}</option>)}</select></label>
 <h2>{lesson.title.en}</h2><p>{lesson.goal.en}</p><img src={scene.src} alt={scene.alt.en} style={{width:'100%',borderRadius:12}}/>
 <h3>Words and phrases</h3>{[...lesson.words,...lesson.phrases].map((p,i)=><div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--rule)'}}><strong lang="ko" style={{fontSize:'var(--fs-h2)'}}>{p.ko}</strong><details><summary>Meaning / 뜻</summary><p>{p.en}</p><p>{p.roman} (approximate pronunciation)</p></details></div>)}
 <h3>Use the pattern</h3><p lang="ko" style={{fontSize:'var(--fs-h2)'}}>{lesson.pattern.form}</p><p>{lesson.pattern.explanation.en}</p><p lang="ko">{lesson.pattern.example}</p>
 <h3>Conversation</h3>{lesson.dialogue.map((d,i)=><div key={i} style={{padding:12,margin:'8px 0',background:'var(--hanji-card)',borderRadius:10}}><small>{d.speaker}</small><p lang="ko" style={{fontSize:'var(--fs-h2)'}}>{d.ko}</p><details><summary>Meaning</summary>{d.en}</details></div>)}
 <h3>Culture tip</h3><p>{lesson.culture.en}</p><h3>Check your understanding</h3>
 {lesson.questions.map((q,i)=><fieldset key={`${lesson.id}-${i}`} style={{margin:'18px 0',padding:12}}><legend>{q.prompt.en}</legend>{q.options.map((o,j)=><label key={o} style={{display:'block',padding:'12px 0'}}><input type="radio" name={`q-${i}`} checked={answers[i]===j} onChange={()=>{setAnswers({...answers,[i]:j});setChecked(false);}}/> {o}</label>)}{checked&&<p>{answers[i]===q.answer?'✓ Correct. ':'Try again. '}{q.explanation.en}</p>}</fieldset>)}
 <button onClick={()=>setChecked(true)} style={{padding:12}}>Check answers</button><h3>Speak in your own words</h3><p>{lesson.mission.en}</p><details><summary>Example</summary><p lang="ko">{lesson.sample}</p></details>
 <label><input type="checkbox" checked={spoken} onChange={e=>setSpoken(e.target.checked)}/> I tried speaking aloud. (Self-check)</label>
 <label style={{display:'block',marginTop:20}}>My sentence / question for my teacher<textarea maxLength={2000} rows={4} style={{width:'100%',margin:'10px 0',padding:12,boxSizing:'border-box'}} value={progress.notes[lesson.id]??''} onChange={e=>setProgress({...progress,notes:{...progress.notes,[lesson.id]:e.target.value}})}/></label>
 <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button style={{padding:12}} disabled={!ready||busy} onClick={()=>save()}>Save writing</button><button style={{padding:12}} disabled={!ready||busy||!spoken||!checked||lesson.questions.some((q,i)=>answers[i]!==q.answer)} onClick={()=>save(true)}>Complete mission</button></div>
 <p role="status">{message}</p>{!ready&&<button style={{padding:12}} onClick={load}>Retry connection</button>}<p>Your teacher can read saved writing. Save before changing missions.</p>
 </div>;
}
