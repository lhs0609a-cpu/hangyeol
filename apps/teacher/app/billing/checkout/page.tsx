'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button, Panel } from '@hangyeol/ui';
import { Shell } from '../../Shell';
import { get } from '../../api-client';
import { loadToss, usesPaymentWidget, requestCardPayment } from '../toss-client';
type Order={id:string;name:string;amount:number;status:string;enabled:boolean;clientKey:string;testMode:boolean};
export default function CheckoutPage(){
  const [order,setOrder]=useState<Order|null>(null),[message,setMessage]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
  const widgets=useRef<ReturnType<Awaited<ReturnType<typeof loadToss>>['widgets']>>();
  useEffect(()=>{let disposed=false;const cleanup:(()=>Promise<void>)[]=[];
    void (async()=>{const id=new URLSearchParams(location.search).get('id');const o=await get<Order>(`/api/billing/checkout?id=${encodeURIComponent(id??'')}`);if(disposed)return;setOrder(o);if(!o.enabled||o.status!=='pending')return;
      if(!usesPaymentWidget(o.clientKey)){setReady(true);return;}const toss=await loadToss(o.clientKey);if(disposed)return;const w=toss.widgets({customerKey:crypto.randomUUID()});widgets.current=w;await w.setAmount({currency:'KRW',value:o.amount});if(disposed)return;
      const methods=await w.renderPaymentMethods({selector:'#payment-methods'});cleanup.push(()=>methods.destroy());if(disposed){await methods.destroy();return;}
      const agreement=await w.renderAgreement({selector:'#payment-agreement'});cleanup.push(()=>agreement.destroy());if(disposed){await agreement.destroy();return;}setReady(true);
    })().catch(e=>{if(!disposed)setMessage((e as Error).message);});return()=>{disposed=true;for(const f of cleanup)void f();};},[]);
  async function pay(){if(!order)return;setBusy(true);try{if(!usesPaymentWidget(order.clientKey))await requestCardPayment(order.clientKey,order,`${location.origin}/billing/result`,`${location.origin}/billing/result?failed=1`);else if(widgets.current)await widgets.current.requestPayment({orderId:order.id,orderName:order.name,successUrl:`${location.origin}/billing/result`,failUrl:`${location.origin}/billing/result?failed=1`});}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  return <Shell wide={false}><Panel><h1>주문 확인</h1>{order?<><h2>{order.name}</h2><p>{order.amount.toLocaleString()}원</p>{order.testMode&&<p>테스트 결제입니다.</p>}{!order.enabled&&<p>온라인 결제 준비 중입니다.</p>}{order.status!=='pending'&&<p>주문 상태: {order.status}</p>}</>:<p>주문을 확인하고 있습니다.</p>}
    <div id="payment-methods"/><div id="payment-agreement"/><Button disabled={!ready||busy} onClick={pay}>결제하기</Button><p role="alert">{message}</p><Link href="/billing">청구 내역으로 돌아가기</Link></Panel></Shell>;
}
