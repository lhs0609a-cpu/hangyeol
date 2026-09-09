'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TEACHER_TRAINING, CLASSROOM_ENGLISH, ALL_UNITS, planFor } from '@hangyeol/content';
import { Button, Panel } from '@hangyeol/ui';
import { Shell } from '../Shell';
import { get, post } from '../api-client';
export default function TrainingPage() {
  const [selected, setSelected] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [rehearsed, setRehearsed] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [unitNo, setUnitNo] = useState(1);
  const module = TEACHER_TRAINING[selected]!;
  const plan = planFor(unitNo);
  useEffect(() => { const requested=Number(new URLSearchParams(location.search).get('unit')); if(ALL_UNITS.some(u=>u.unitNo===requested))setUnitNo(requested); get<{completed:string[]}>('/api/training').then(d => setCompleted(d.completed)).catch(() => setMessage('저장된 연수 진도를 불러오지 못했습니다. 내용은 계속 볼 수 있습니다.')); }, []);
  async function save() { setBusy(true); try {
    const result = await post<{completed:string[]}>('/api/training', { moduleId: module.id, answer, rehearsed });
    setCompleted(result.completed); setMessage('학습과 연습 완료를 저장했습니다.');
  } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); } }
  return <Shell><h1>첫 수업 준비실</h1><p>대본을 읽고 직접 말해 본 뒤 확인 문제를 풀어 보세요. 연습 완료는 본인의 체크이며 강사 자격 인증이 아닙니다.</p>
    <p role="status">연습 완료 {completed.length} / {TEACHER_TRAINING.length}</p>
    <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:20}}>{TEACHER_TRAINING.map((m,i) => <Button key={m.id} kind={selected === i ? 'primary':'quiet'} onClick={() => {setSelected(i);setAnswer(null);setRehearsed(false);setMessage('');}}>{completed.includes(m.id) ? '✓ ' : ''}{m.title}</Button>)}</div>
    <Panel><h2>{module.title}</h2><p>{module.goal} · 약 {module.minutes}분</p>
      {module.steps.map((s,i) => <div key={i} style={{padding:'16px 0',borderTop:'1px solid var(--rule)'}}><strong>{i+1}. 강사가 하는 말</strong><p style={{fontSize:'var(--fs-h2)',lineHeight:1.7}}>{s.say}</p><p>{s.action}</p></div>)}
      <h3>모의 수업</h3><p>{module.rehearsal}</p><label><input type="checkbox" checked={rehearsed} onChange={e=>setRehearsed(e.target.checked)}/> 직접 말하고 연습했습니다</label>
      <fieldset style={{margin:'20px 0'}}><legend>{module.question}</legend>{module.choices.map((c,i)=><label key={c} style={{display:'block',padding:10}}><input type="radio" name="training-answer" checked={answer===i} onChange={()=>setAnswer(i)}/> {c}</label>)}</fieldset>
      {answer !== null && <p>{answer === module.answer ? '맞습니다. ' : '다시 생각해 보세요. '}{module.explanation}</p>}
      <Button disabled={busy || answer !== module.answer || !rehearsed} onClick={save}>연습 완료 저장</Button><p role="status">{message}</p>
    </Panel>
    <Panel style={{marginTop:24}}><h2>수업 중 바로 찾는 영어</h2><label>한국어·영어·상황 검색 <input style={{width:'100%',padding:12,margin:'12px 0'}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="다시, 천천히, repeat…"/></label>
      {CLASSROOM_ENGLISH.filter(p=>`${p.ko} ${p.en} ${p.situation}`.toLowerCase().includes(query.toLowerCase())).slice(0,20).map(p=><div key={p.id} style={{padding:'12px 0',borderTop:'1px solid var(--rule)'}}><strong>{p.en}</strong><p>{p.ko} · {p.situation}</p></div>)}
    </Panel>
    <Panel style={{marginTop:24}}><h2>학생 등록 전 교안 연습</h2><label>단원 선택 <select value={unitNo} onChange={e=>setUnitNo(Number(e.target.value))} style={{maxWidth:'100%',padding:12}}>{ALL_UNITS.map(u=><option key={u.unitNo} value={u.unitNo}>{u.unitNo}. {u.title}</option>)}</select></label>
      <p>교안 초안입니다. 실제 수업 전 표현과 활동의 적합성을 검토하세요.</p>
      {plan?.blocks.map((b,i)=><details key={i} style={{padding:12}}><summary>{b.phase} · {b.studentOutput ?? '수업 진행'}</summary>{b.say.map((s,j)=><p key={j}>{s}</p>)}{b.ifStuck && <p><strong>막히면:</strong> {b.ifStuck}</p>}</details>)}
    </Panel><p><Link href="/students/new">학생 등록하기 →</Link></p>
  </Shell>;
}
