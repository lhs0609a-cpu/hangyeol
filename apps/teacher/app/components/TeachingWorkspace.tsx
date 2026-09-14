'use client';
import { useEffect, useRef, useState } from 'react';
import { StudentWorkbook } from '@hangyeol/ui';
import { SKILLS, SKILL_LABELS, type StudentBook, type TeacherGuide, type LearningSkill } from '@hangyeol/content';
import type { TeachingObservationEntry } from '@hangyeol/core';
import { get, post } from '../api-client';
import '@hangyeol/ui/workbook.css';

type History = {id:string;at:string;entries:TeachingObservationEntry[]};
type ClassroomData = {book:StudentBook;guide:TeacherGuide;history:History[];recentNeeds:{unitNo:number;at:string;skill:LearningSkill;evidence:string}[];studentWork:string;help:LearningSkill[];previous:{lessonNo:number;errors:string[];expressions:string[];reportSubmittedAt:string}|null};
const emptyEntries = ():TeachingObservationEntry[] => SKILLS.map(skill => ({skill,outcome:'unknown',evidence:'',retest:'not_checked',retestEvidence:''}));
const label = (entry:TeachingObservationEntry) => entry.retest === 'independent' ? '보강 후 혼자 수행' : entry.retest === 'support' ? '재확인에서도 도움 필요' : entry.outcome === 'unknown' ? '아직 확인하지 않음' : entry.outcome === 'support' ? '도움 필요 · 보강하기' : '혼자 수행 확인';

export function TeachingWorkspace({studentId,unitNo}:{studentId:string;unitNo:number}) {
  const [data,setData] = useState<ClassroomData|null>(null), [stage,setStage] = useState(0), [hideModel,setHideModel] = useState(false);
  const [entries,setEntries] = useState(emptyEntries), [busy,setBusy] = useState(false), [error,setError] = useState(''), [message,setMessage] = useState(''), [dirty,setDirty] = useState(false);
  const channel = useRef<BroadcastChannel|null>(null), requestId = useRef('');
  const path = `/api/students/${studentId}/classroom?unit=${unitNo}`;
  const current = useRef({stage,hideModel}); current.current = {stage,hideModel};
  async function refresh() { const result = await get<ClassroomData>(path); setData(result); setEntries(result.history[0]?.entries ?? emptyEntries()); setDirty(false); setError(''); }
  useEffect(() => { let active=true;setData(null);setError('');setStage(0);setHideModel(false);setDirty(false);requestId.current='';
    get<ClassroomData>(path).then(result=>{if(active){setData(result);setEntries(result.history[0]?.entries??emptyEntries());}}).catch(e=>{if(active)setError(e.message);}); return()=>{active=false;}; }, [path]);
  useEffect(() => { if(typeof BroadcastChannel==='undefined')return;
    const c=new BroadcastChannel(`classroom-${studentId}-${unitNo}`); channel.current=c;
    c.onmessage=event=>{if(event.data?.type==='ready')c.postMessage({type:'page',...current.current});};
    return()=>{c.close();channel.current=null;}; },[studentId,unitNo]);
  useEffect(() => {channel.current?.postMessage({type:'page',stage,hideModel});},[stage,hideModel]);
  useEffect(() => { const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function change(skill:LearningSkill,patch:Partial<TeachingObservationEntry>) {
    setEntries(items=>items.map(item=>item.skill===skill?{...item,...patch}:item));setDirty(true);setMessage('');requestId.current='';
  }
  async function save() {
    if(!data||busy)return;setBusy(true);setError('');setMessage('');
    if(!requestId.current)requestId.current=crypto.randomUUID();
    try {await post(path,{unitNo,entries,revision:data.history[0]?.id??null,requestId:requestId.current});await refresh();requestId.current='';setMessage('관찰과 보강 결과를 저장했습니다. 다음에 이 단원을 열면 이어서 확인할 수 있습니다.');}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  if(!data)return <section><p role={error?'alert':'status'}>{error||'교재와 지도 가이드 불러오는 중…'}</p>{error&&<button onClick={()=>void refresh().catch(e=>setError(e.message))}>다시 시도</button>}</section>;
  const focus = entries.filter(entry=>entry.retest==='support'||(entry.outcome==='support'&&entry.retest!=='independent'));
  return <section aria-label="교재와 교사용 지도 가이드">
    <div className="teaching-toolbar"><strong>학생 교재 + 선생님 가이드</strong><a href={`/classroom/${studentId}?unit=${unitNo}`} target="_blank" rel="noopener noreferrer">학생에게 보여줄 화면 열기 ↗</a><label><input type="checkbox" checked={hideModel} onChange={e=>setHideModel(e.target.checked)}/> 듣기 확인: 대화 가리기</label></div>
    <p className="t-body-sm">화면 공유는 새로 연 학생용 창을 선택하세요. 같은 브라우저에서 활동 페이지와 대화 가리기가 함께 바뀝니다.</p>
    <div className="teaching-workspace"><StudentWorkbook key={unitNo} book={data.book} stage={stage} onStage={setStage} hideModel={hideModel}/>
      <aside className="teaching-guide" aria-label="선생님 전용 지도 가이드"><span className="workbook-kicker">선생님 전용 · {unitNo}차시</span><h3>{data.guide.stages[stage]!.title} 지도</h3><blockquote>{data.guide.stages[stage]!.say}</blockquote><p>{data.guide.stages[stage]!.do}</p><p><strong>확인할 수행:</strong> {data.guide.stages[stage]!.success}</p>
        <h3>지금 강화할 부분</h3><div className="teaching-evidence">{focus.length ? focus.map(e=><p key={e.skill}><strong>{SKILL_LABELS[e.skill]}</strong> · {label(e)}<br/>{e.retest==='support'?e.retestEvidence:e.evidence}</p>) : <p>{entries.every(e=>e.outcome==='unknown')?'아직 관찰 기록이 없습니다. 아래 질문으로 확인하세요.':'현재 기록에서 보강이 필요한 항목이 없습니다. 미확인 영역과 새 상황에서의 수행을 확인하세요.'}</p>}</div>
        {data.help.length>0&&<div className="teaching-evidence"><strong>학생이 도움을 요청한 부분</strong><p>{data.help.map(skill=>SKILL_LABELS[skill]).join(' · ')}</p><small>학생의 자기 보고입니다. 확인 질문으로 실제 수행을 확인하세요.</small></div>}
        <details><summary>학생 답안과 이전 수업 근거</summary><h4>이 단원의 학생 답안</h4><blockquote>{data.studentWork||'아직 공유한 답안이 없습니다.'}</blockquote>{data.previous&&<><h4>최근 수업 {data.previous.lessonNo}차시 · {data.previous.reportSubmittedAt.slice(0,10)}</h4><p>기록된 오류: {data.previous.errors.join(' · ')||'없음'}</p><p>복습할 표현: {data.previous.expressions.join(' · ')||'없음'}</p><small>다른 차시의 기록일 수 있습니다. 오늘의 수행과 구별하세요.</small></>}</details>
        {data.recentNeeds.some(n=>n.unitNo!==unitNo)&&<details><summary>이전 단원에서 다시 확인할 부분</summary>{data.recentNeeds.filter(n=>n.unitNo!==unitNo).map(n=><p key={`${n.unitNo}-${n.skill}`}><strong>{n.unitNo}차시 · {SKILL_LABELS[n.skill]}</strong> · {n.at.slice(0,10)}<br/>{n.evidence}</p>)}<small>이전 관찰입니다. 지금도 어려운지는 오늘 질문으로 확인하세요.</small></details>}
        <h3>확인 → 보강 → 재확인</h3><p>예상되는 어려움은 진단이 아닙니다. 실제 답변과 제공한 도움을 함께 적어 주세요.</p>
        <form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy} style={{border:0,padding:0,minWidth:0}}>{data.guide.probes.map(probe=>{
          const entry=entries.find(e=>e.skill===probe.skill)!;
          return <details key={`${unitNo}-${probe.skill}-${stage}`} open={probe.stage===stage}><summary>{SKILL_LABELS[probe.skill]}<span className="teaching-probe-status">{label(entry)}</span></summary><h4>{probe.title}</h4><blockquote>{probe.ask}</blockquote><p><strong>기대하는 반응:</strong> {probe.expected}</p><p><strong>이런 반응이면 확인:</strong> {probe.signal}</p><p>{probe.distinguish}</p>
            <label>첫 확인 결과<select aria-label={`${SKILL_LABELS[probe.skill]} 첫 확인 결과`} value={entry.outcome} onChange={e=>change(probe.skill,{outcome:e.target.value as TeachingObservationEntry['outcome'],retest:'not_checked',retestEvidence:''})}><option value="unknown">아직 확인하지 않음</option><option value="support">도움 필요</option><option value="independent">혼자 가능</option></select></label>
            <label>학생 답변과 제공한 도움<textarea aria-label={`${SKILL_LABELS[probe.skill]} 관찰 근거`} value={entry.evidence} maxLength={1000} onChange={e=>change(probe.skill,{evidence:e.target.value})} placeholder="예: 질문을 읽으면 답했지만, 글을 가리고 들려주면 다시 읽어 달라고 요청함."/></label>
            <h4>이 부분을 강화하려면</h4><ol>{probe.reinforce.map(step=><li key={step}>{step}</li>)}</ol><p><strong>다시 확인:</strong> {probe.retest}</p>
            <label>보강 후 재확인<select aria-label={`${SKILL_LABELS[probe.skill]} 재확인 결과`} value={entry.retest} disabled={entry.outcome==='unknown'} onChange={e=>change(probe.skill,{retest:e.target.value as TeachingObservationEntry['retest']})}><option value="not_checked">아직 재확인하지 않음</option><option value="support">여전히 도움 필요</option><option value="independent">새 과제를 혼자 수행</option></select></label>
            {entry.retest!=='not_checked'&&<label>새 과제에서 확인한 답변<textarea aria-label={`${SKILL_LABELS[probe.skill]} 재확인 근거`} value={entry.retestEvidence} maxLength={1000} onChange={e=>change(probe.skill,{retestEvidence:e.target.value})}/></label>}
          </details>;
        })}<button type="submit" disabled={!dirty||busy}>{busy?'저장 중…':'관찰·보강 결과 저장'}</button></fieldset></form>
        {dirty&&<p role="status">저장하지 않은 관찰 기록이 있습니다.</p>}{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
        <details><summary>선생님이 주의할 점</summary><ul>{data.guide.pitfalls.map(p=><li key={p}>{p}</li>)}</ul></details>
        {data.history.length>0&&<details><summary>이 단원의 관찰 이력</summary>{data.history.map(h=><section key={h.id}><h4>{new Date(h.at).toLocaleString('ko-KR')}</h4>{h.entries.filter(e=>e.outcome!=='unknown').map(e=><p key={e.skill}>{SKILL_LABELS[e.skill]} · {label(e)}<br/>{e.evidence}{e.retestEvidence&&<><br/>재확인: {e.retestEvidence}</>}</p>)}</section>)}</details>}
      </aside></div>
  </section>;
}
