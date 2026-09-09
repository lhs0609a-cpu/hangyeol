'use client';
import { useState } from 'react';
import { TopBar } from '../ui';
type Answer = { questionId: string; choiceIndex: number };
type Step = { done: boolean; progress: { asked: number; total: number }; question: { id: string; prompt: string; choices: string[] } | null; result?: { level: number; startUnitNo: number; weakPoints: string[] }; placementApplied?: boolean };
export default function LevelTestPage() {
  const [step,setStep]=useState<Step|null>(null),[answers,setAnswers]=useState<Answer[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function request(next?: Answer[]) {
    if(busy)return;setBusy(true);setError('');
    try {
      const response=await fetch('/api/note/level-test',next?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({answers:next})}:undefined);
      const data=await response.json();if(!response.ok)throw new Error(data?.error?.message??'Please try again.');
      setStep(data);setAnswers(next??[]);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const buttonStyle={padding:'16px',border:'1px solid var(--hanji-rule)',borderRadius:8,background:'var(--hanji-card)',color:'var(--ink)',fontSize:'var(--fs-body-lg)',textAlign:'left' as const};
  return <div className="hg-rise"><TopBar/><h1 className="t-h1">Find your starting point</h1><p>한국어 수준 진단</p>
    {!step&&<section><p>20 questions · About 5–10 minutes. Choose “I don’t know” whenever you need to.</p><p>20문항으로 첫 교재를 정해요. 모르면 ‘모르겠어요’를 선택하세요.</p><p>This is a grammar placement check, not an official TOPIK score. Your teacher will check speaking and reading Hangul in your first lesson.</p><button style={buttonStyle} disabled={busy} onClick={()=>request()}>Start my level check / 진단 시작</button></section>}
    {step?.result?<section><h2>Suggested course level {step.result.level}</h2><p>{step.placementApplied?`Your first lesson starts at unit ${step.result.startUnitNo}.`:'Your teacher can review this new result. Your existing lesson progress is preserved.'}</p><p>첫 수업에서 선생님이 말하기와 한글 읽기를 확인하고 난이도를 점검해요.</p>{step.result.weakPoints.length>0&&<><h3>Practise with your teacher / 함께 연습할 표현</h3><ul>{step.result.weakPoints.map(w=><li key={w}>{w}</li>)}</ul></>}<a href="/">Back to my learning notebook →</a></section>:step?.question&&<section>
      <p aria-live="polite">Question {step.progress.asked+1} of {step.progress.total}</p><progress value={step.progress.asked} max={step.progress.total} aria-label="Test progress" style={{width:'100%'}}/>
      <p>Choose the best answer for the blank. / 빈칸에 알맞은 답을 고르세요.</p><h2 style={{fontSize:'var(--fs-h1)',lineHeight:1.8}}>{step.question.prompt}</h2>
      <div style={{display:'grid',gap:10}}>{[...step.question.choices,'I don’t know / 모르겠어요'].map((choice,i)=><button key={`${step.question!.id}-${i}`} style={buttonStyle} disabled={busy} onClick={()=>request([...answers,{questionId:step.question!.id,choiceIndex:i===step.question!.choices.length?-1:i}])}>{choice}</button>)}</div>
    </section>}{busy&&<p role="status">Saving… / 처리 중</p>}{error&&<p role="alert">{error} Your last answer was not advanced. Please retry. / 다시 시도해 주세요.</p>}
  </div>;
}
