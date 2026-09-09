'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {courseRequest} from '../courses/course-client';
import {loadToss,usesPaymentWidget,requestCardPayment} from '../billing/toss-client';
import '../courses/course.css';
type Order={id:string;name:string;amount:number;status:string};
type Enrollment={orderId:string;sessions:number;used:number;status:string;refundAmount:number};
type Portal={orders:Order[];enrollments:Enrollment[];noteUrl:string;enabled:boolean;clientKey:string;testMode:boolean};
const statusName:Record<string,string>={pending:'Awaiting payment',paid:'Paid',active:'Ready for lessons',refunding:'Refund being confirmed',refunded:'Unused lessons refunded',review_required:'Course team reviewing refund'};
export default function StudentArea(){
  const [portal,setPortal]=useState<Portal|null>(null),[message,setMessage]=useState('Loading your courses…'),[busy,setBusy]=useState(false),[order,setOrder]=useState<Order|null>(null),[ready,setReady]=useState(false),[refundOrder,setRefundOrder]=useState<Order|null>(null);
  const widget=useRef<ReturnType<Awaited<ReturnType<typeof loadToss>>['widgets']>>();
  const initialized=useRef(false);
  async function refresh(){setPortal(await courseRequest<Portal>('/api/tuition'));}
  useEffect(()=>{if(initialized.current)return;initialized.current=true;void(async()=>{
    const params=new URLSearchParams(location.search),token=params.get('t');
    if(token){await courseRequest(`/api/note/verify?t=${encodeURIComponent(token)}`);history.replaceState(null,'','/student-area');}
    if(params.has('paymentKey')){await courseRequest('/api/tuition',{action:'confirm',orderId:params.get('orderId'),paymentKey:params.get('paymentKey'),amount:Number(params.get('amount'))});history.replaceState(null,'','/student-area');setMessage('Payment confirmed. Your teacher will arrange your first lesson.');}
    else setMessage(params.has('failed')?'Payment was not completed. You can retry the same order.':'');
    await refresh();
  })().catch(e=>setMessage(`${e.message} You can request a fresh access link from Courses.`));},[]);
  useEffect(()=>{if(!order||!portal?.enabled)return;let disposed=false;const cleanup:(()=>Promise<void>)[]=[];setReady(false);
    if(!usesPaymentWidget(portal.clientKey)){setReady(true);return;}
    void(async()=>{const toss=await loadToss(portal.clientKey);if(disposed)return;const w=toss.widgets({customerKey:crypto.randomUUID()});widget.current=w;await w.setAmount({currency:'KRW',value:order.amount});if(disposed)return;const methods=await w.renderPaymentMethods({selector:'#tuition-methods'});cleanup.push(()=>methods.destroy());if(disposed){await methods.destroy();return;}const agreement=await w.renderAgreement({selector:'#tuition-agreement'});cleanup.push(()=>agreement.destroy());if(disposed){await agreement.destroy();return;}setReady(true);})().catch(e=>setMessage(e.message));
    return()=>{disposed=true;widget.current=undefined;for(const destroy of cleanup)void destroy();};
  },[order,portal?.enabled,portal?.clientKey]);
  async function pay(){if(!order||!portal)return;setBusy(true);try{if(!usesPaymentWidget(portal.clientKey))await requestCardPayment(portal.clientKey,order,`${location.origin}/student-area`,`${location.origin}/student-area?failed=1`);else if(widget.current)await widget.current.requestPayment({orderId:order.id,orderName:order.name,successUrl:`${location.origin}/student-area`,failUrl:`${location.origin}/student-area?failed=1`});}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  async function refund(){if(!refundOrder)return;setBusy(true);try{await courseRequest('/api/tuition',{action:'refund',orderId:refundOrder.id});await refresh();setRefundOrder(null);setMessage('Refund status updated. Your original payment method will receive the refund according to the payment provider’s processing time.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  return <main className="course-page" lang="en"><header><Link href="/courses">Courses & access links</Link><Link href="/learn">Free workbook</Link></header><h1>My Korean courses</h1><p className="course-message" role="status" aria-live="polite">{message}</p>{portal&&<><section className="course-card"><h2>First, check your Korean level</h2><p>Open your notebook and complete the 20-question level check before your first lesson. Your result sets the starting textbook.</p><a href={portal.noteUrl}>Open my learning notebook →</a></section>{portal.testMode&&<p>Test payment mode</p>}{!portal.enabled&&<p>Online payment is being prepared. Contact your course team before paying.</p>}<div className="course-grid">{portal.orders.map(o=>{const e=portal.enrollments.find(e=>e.orderId===o.id);return <article className="course-card" key={o.id}><h2>{o.name}</h2><p>₩{o.amount.toLocaleString()} KRW</p><p>{statusName[o.status]??o.status}</p>{e&&<p>{e.used} of {e.sessions} lessons started · {e.sessions-e.used} remaining</p>}{!!e?.refundAmount&&<p>Refund: ₩{e.refundAmount.toLocaleString()}</p>}<div className="course-actions">{o.status==='pending'&&<button disabled={!portal.enabled||busy} onClick={()=>setOrder(o)}>Review & pay</button>}{['paid','refunding'].includes(o.status)&&e&&e.used<e.sessions&&<button disabled={busy} onClick={()=>setRefundOrder(o)}>{o.status==='refunding'?'Check refund':'Refund unused lessons'}</button>}</div></article>;})}</div>{!portal.orders.length&&<p>No approved courses yet.</p>}</>}
    {order&&<section className="course-card"><h2>Pay for {order.name}</h2><p>₩{order.amount.toLocaleString()} KRW total. Your bank may apply currency conversion charges.</p><p>Unused lessons are refunded proportionally at the original package price. Completed lessons remain charged.</p><div id="tuition-methods"/><div id="tuition-agreement"/><div className="course-actions"><button disabled={!ready||busy} onClick={pay}>Pay ₩{order.amount.toLocaleString()}</button><button disabled={busy} onClick={()=>setOrder(null)}>Close</button></div></section>}
    {refundOrder&&<section className="course-card" role="region" aria-label="Review refund"><h2>Review your refund</h2><p>{refundOrder.name}</p><p>Estimated unused amount: ₩{(()=>{const e=portal?.enrollments.find(e=>e.orderId===refundOrder.id);return e?(refundOrder.amount-Math.floor(refundOrder.amount*e.used/e.sessions)).toLocaleString():'—';})()}. Remaining lessons in this package will close. The server will check the final amount and ongoing lessons before processing.</p><div className="course-actions"><button disabled={busy} onClick={refund}>Confirm unused lesson refund</button><button disabled={busy} onClick={()=>setRefundOrder(null)}>Keep my lessons</button></div></section>}
  </main>;
}
