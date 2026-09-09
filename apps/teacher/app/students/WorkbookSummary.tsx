'use client';
import {useEffect,useState} from 'react';
import {FIRST_STEPS, ALL_UNITS} from '@hangyeol/content';
import {Panel} from '@hangyeol/ui';
import {get} from '../api-client';
export default function WorkbookSummary({studentId}:{studentId:string}){
 const [data,setData]=useState<{completed:string[];notes:Record<string,string>}|null>(null),[error,setError]=useState('');
 useEffect(()=>{get<{completed:string[];notes:Record<string,string>}>(`/api/students/${studentId}/workbook`).then(setData).catch(()=>setError('입문 교재 진도를 불러오지 못했습니다.'));},[studentId]);
 return <Panel style={{marginTop:20}}><h2>교재 학습과 학생 답안</h2>{error?<p role="alert">{error}</p>:data?<><p>입문 완료 {FIRST_STEPS.filter(l=>data.completed.includes(l.id)).length} / {FIRST_STEPS.length} · 말하기는 학생 자기 점검입니다.</p>{FIRST_STEPS.filter(l=>data.completed.includes(l.id)||data.notes[l.id]).map(l=><details key={l.id}><summary>{data.completed.includes(l.id)?'✓ ':''}{l.title.ko}</summary><p style={{whiteSpace:'pre-wrap'}}>{data.notes[l.id]||'학생 메모가 없습니다.'}</p></details>)}<h3>정규 수업 답안</h3><p>학생 제출 기록입니다. 차시 통과 여부는 수업 리포트에서 판단하세요.</p>{ALL_UNITS.filter(u=>data.notes[`unit-${u.unitNo}`]).map(u=><details key={u.unitNo}><summary>{u.unitNo}차시 · {u.title}</summary><p style={{whiteSpace:'pre-wrap'}}>{data.notes[`unit-${u.unitNo}`]}</p></details>)}</>:<p>불러오는 중</p>}</Panel>;
}
