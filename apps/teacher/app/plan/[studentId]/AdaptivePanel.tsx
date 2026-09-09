'use client';
import {useEffect,useRef,useState} from 'react';
import {Panel,Button} from '@hangyeol/ui';
import type {adaptiveOverview,Observation} from '@hangyeol/core';
import {get,post} from '../../api-client';
type Overview=Awaited<ReturnType<typeof adaptiveOverview>>;
type Recommendation={mode:'keep'|'supplement'|'reassign';targetUnitNo:number;explanation:string};
const tasks=[['reading','읽기','교재의 짧은 문장을 읽고 뜻을 설명하게 하세요.'],['listening','듣기·이해','배운 표현으로 질문하고, 번역 없이 알맞게 답하는지 확인하세요.'],['speaking','말하기','예문을 가린 뒤 자기 상황에 맞는 문장을 만들게 하세요.']] as const;
export function AdaptivePanel({studentId,onSaved}:{studentId:string;onSaved:()=>Promise<void>}) {
  const [data,setData]=useState<Overview|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [scores,setScores]=useState<Record<string,string>>({reading:'',listening:'',speaking:''}),[reason,setReason]=useState(''),[focus,setFocus]=useState(''),[recommendation,setRecommendation]=useState<Recommendation|null>(null),[mode,setMode]=useState<Recommendation['mode']>('supplement'),[target,setTarget]=useState(1);
  const requestId=useRef('');const path=`/api/students/${studentId}/adaptive`;
  async function refresh(){setData(await get<Overview>(path));}
  useEffect(()=>{void refresh().catch(e=>setError(e.message));},[studentId]);
  function changed(){setRecommendation(null);setMessage('');requestId.current='';}
  async function submit(action:'recommend'|'apply') {
    if(!data||busy)return;setBusy(true);setError('');setMessage('');
    if(!requestId.current)requestId.current=crypto.randomUUID();
    try {
      const observations=Object.fromEntries(Object.entries(scores).map(([k,v])=>[k,Number(v)])) as Observation;
      const payload={action,observations,focus,reason,mode,targetUnitNo:target,anchorLessonId:data.anchorLessonId,revision:data.revision,requestId:requestId.current};
      if(action==='recommend'){const r=await post<Recommendation>(path,payload);setRecommendation(r);setMode(r.mode);setTarget(r.targetUnitNo);}
      else {await post(path,payload);await refresh();await onSaved();setRecommendation(null);requestId.current='';setMessage('다음 교재와 수업 계획에 반영했습니다. 기존 수업 기록은 유지됩니다.');}
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <Panel style={{marginTop:20}}><h2 className="t-h2">실제 수행 확인 · 교재 조정</h2><p>테스트 결과는 임시 시작점입니다. 첫 수업과 보충 수업에서 아래 과제를 확인하세요.</p>
    {!data&&<button onClick={()=>refresh().catch(e=>setError(e.message))}>불러오기 / 다시 시도</button>}
    {data&&<><p>현재 {data.currentUnitNo}차시 · 다음 수업 {data.nextUnitNo}차시</p>{!data.canAdjust&&<p>진행 중인 수업의 리포트를 먼저 저장하면 교재를 조정할 수 있습니다.</p>}
    <form onSubmit={e=>{e.preventDefault();void submit('recommend');}}><fieldset disabled={!data.canAdjust||busy} style={{border:0,padding:0,display:'grid',gap:14}}>
      {tasks.map(([key,label,prompt])=><label key={key}>{label}<span style={{display:'block',fontSize:'var(--fs-body-sm)',margin:'6px 0'}}>{prompt}</span><select required aria-label={`${label} 수행 평가`} value={scores[key]} onChange={e=>{setScores({...scores,[key]:e.target.value});changed();}} style={{padding:12,width:'100%'}}><option value="">평가 선택</option><option value="2">혼자 가능</option><option value="1">도움 필요</option><option value="0">아직 어려움</option></select></label>)}
      <label>보충할 표현 (선택)<input value={focus} maxLength={100} placeholder="예: 과거형, 조사, 숫자" onChange={e=>{setFocus(e.target.value);changed();}} style={{display:'block',width:'100%',padding:12}}/></label>
      <label>관찰 근거<textarea required minLength={5} maxLength={1000} value={reason} onChange={e=>{setReason(e.target.value);changed();}} placeholder="학생이 혼자 한 것과 도움이 필요했던 상황을 적어 주세요." style={{display:'block',width:'100%',padding:12,minHeight:90}}/></label>
      <Button kind="primary" type="submit">수업 조정 추천 확인</Button>
    </fieldset></form>
    {recommendation&&<section style={{marginTop:18}}><h3>추천을 확인하고 적용하세요</h3><p>{recommendation.explanation}</p><label>진행 방식<select aria-label="진행 방식" disabled={busy} value={mode} onChange={e=>setMode(e.target.value as Recommendation['mode'])} style={{display:'block',padding:12,width:'100%'}}><option value="keep">현재 진도 유지</option><option value="supplement">부분 보충 후 원래 진도로 복귀</option><option value="reassign">더 쉬운 단원부터 다시 배정</option></select></label>
    {mode!=='keep'&&<label>다음 교재 단원<select aria-label="다음 교재 단원" disabled={busy} value={target} onChange={e=>setTarget(Number(e.target.value))} style={{display:'block',padding:12,width:'100%'}}>{data.units.map(u=><option key={u.unitNo} value={u.unitNo}>{u.unitNo}차시 · {u.title}</option>)}</select><p>{data.units.find(u=>u.unitNo===target)?.goal}</p></label>}
    <p>{mode==='supplement'?'보충 단원을 도움 없이 수행하고 통과해야 원래 진도로 돌아갑니다.':'변경 사항은 다음 수업부터 적용됩니다.'} 별도 수업으로 진행하면 기존 수강권에서 수업 1회가 사용됩니다.</p>
    <Button kind="primary" disabled={busy} onClick={()=>submit('apply')}>확인한 교재 계획 적용</Button></section>}
    {data.history.length>0&&<details style={{marginTop:18}}><summary>최근 조정 기록</summary>{data.history.map(h=><p key={h.id}>{h.at.slice(0,10)} · {(h.decision??h.mode)==='supplement'?'보충':(h.decision??h.mode)==='reassign'?'재배정':'유지'} · {h.targetUnitNo}차시 · {h.reason}</p>)}</details>}
    </>}{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
  </Panel>;
}
