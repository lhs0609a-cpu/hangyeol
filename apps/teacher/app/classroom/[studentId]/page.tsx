'use client';
import { useEffect,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudentWorkbook, type WorkbookView } from '@hangyeol/ui';
import { get } from '../../api-client';
import '@hangyeol/ui/workbook.css';
export default function ClassroomPresentation({params}:{params:{studentId:string}}) {
  const search=useSearchParams(), unitNo=Number(search.get('unit'));
  const [book,setBook]=useState<WorkbookView|null>(null),[stage,setStage]=useState(0),[hideModel,setHideModel]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let active=true;setBook(null);setStage(0);setHideModel(false);setError('');get<{book:WorkbookView}>(`/api/students/${params.studentId}/classroom?unit=${unitNo}&view=student`).then(d=>{if(active)setBook(d.book);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[params.studentId,unitNo]);
  useEffect(()=>{if(typeof BroadcastChannel==='undefined')return;const channel=new BroadcastChannel(`classroom-${params.studentId}-${unitNo}`);channel.onmessage=event=>{const d=event.data;if(d?.type==='page'&&Number.isInteger(d.stage)&&d.stage>=0&&d.stage<4&&typeof d.hideModel==='boolean'){setStage(d.stage);setHideModel(d.hideModel);}};channel.postMessage({type:'ready'});return()=>channel.close();},[params.studentId,unitNo]);
  return <main style={{maxWidth:1000,margin:'0 auto',padding:'24px 12px'}}>{error?<p role="alert">{error}</p>:book?<StudentWorkbook key={unitNo} book={book} stage={stage} onStage={setStage} hideModel={hideModel}/>:<p role="status">교재 불러오는 중…</p>}</main>;
}
