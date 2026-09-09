'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Panel } from '@hangyeol/ui';
import { get, post } from '../api-client';
import { loadToss } from './toss-client';
type Data = { enabled: boolean; testMode: boolean; cardRegistered: boolean;
  orders: {id:string;name:string;amount:number;status:string;kind:string}[];
  invoices: {id:string;chargeAmount:number}[] };
export default function PaymentPanel() {
  const [data,setData]=useState<Data|null>(null), [amount,setAmount]=useState(10000), [busy,setBusy]=useState(false), [message,setMessage]=useState(''), [consent,setConsent]=useState(false);
  const refresh=()=>get<Data>('/api/billing/orders').then(setData).catch(()=>setMessage('결제 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
  useEffect(()=>{void refresh();},[]);
  async function order(body:unknown) {setBusy(true);try {const r=await post<{orderId:string}>('/api/billing/orders',body);location.assign(`/billing/checkout?id=${r.orderId}`);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  async function card(){setBusy(true);try{const d=await post<{enabled:boolean;clientKey:string;customerKey:string}>('/api/billing/orders',{kind:'card'});if(!d.enabled)throw new Error('카드 자동결제 등록을 준비 중입니다.');const toss=await loadToss(d.clientKey);await toss.payment({customerKey:d.customerKey}).requestBillingAuth({method:'CARD',successUrl:`${location.origin}/billing/result?mode=card`,failUrl:`${location.origin}/billing/result?failed=1`});}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  async function refund(id:string){setBusy(true);try{await post('/api/billing/checkout',{action:'refund',orderId:id});setMessage('환불이 확인되었습니다.');await refresh();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  return <Panel style={{marginTop:20}}><h2>결제와 카드 관리</h2>
    {data?.testMode && <p>테스트 결제 환경입니다.</p>}{data && !data.enabled && <p>온라인 결제를 준비 중입니다. 결제 가능 상태가 되면 이 화면에서 진행할 수 있습니다.</p>}
    <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> 학생별 28일 사용료를 합산하여 월 1회 자동 청구하는 데 동의합니다.</label>
    <p><Button disabled={busy||!consent} onClick={card}>{data?.cardRegistered?'자동결제 카드 변경':'자동결제 카드 등록'}</Button></p>
    <label>충전 금액 (원) <input type="number" min={10000} max={5000000} step={1000} value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label>{' '}<Button disabled={busy||!data?.enabled} onClick={()=>order({kind:'topup',amount})}>충전 주문 확인</Button>
    {data?.invoices.map(i=><p key={i.id}>미납 이용료 {i.chargeAmount.toLocaleString()}원 <Button disabled={busy||!data.enabled} onClick={()=>order({kind:'invoice',invoiceId:i.id})}>결제하기</Button></p>)}
    <h3>주문 내역</h3>{data?.orders.length===0&&<p>아직 주문이 없습니다.</p>}
    {data?.orders.map(o=><div key={o.id} style={{padding:'12px 0',borderTop:'1px solid var(--rule)'}}>{o.name} · {o.amount.toLocaleString()}원 · {({paid:'결제 완료',pending:'결제 대기',refunding:'환불 확인 중',refunded:'환불 완료'} as Record<string,string>)[o.status]??o.status}{' '}
      {o.status==='pending'&&<Link href={`/billing/checkout?id=${o.id}`}>이어서 결제</Link>}
      {o.kind==='topup'&&['paid','refunding'].includes(o.status)&&<details><summary>환불</summary><p>보너스를 포함한 충전액 전부가 잔액에 남아 있어야 전액 환불할 수 있습니다.</p><Button disabled={busy} onClick={()=>refund(o.id)}>이 주문 전액 환불 요청</Button></details>}
    </div>)}<p role="status">{message}</p></Panel>;
}
