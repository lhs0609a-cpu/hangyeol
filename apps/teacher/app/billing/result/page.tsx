'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button, Panel } from '@hangyeol/ui';
import { post } from '../../api-client';
import { Shell } from '../../Shell';
export default function ResultPage(){const [message,setMessage]=useState('결제 결과를 확인하고 있습니다.'),[retry,setRetry]=useState(false),started=useRef(false);
  async function confirm(){setRetry(false);const q=new URLSearchParams(location.search);if(q.has('failed')){setMessage('결제가 완료되지 않았습니다. 청구 화면에서 다시 진행해 주세요.');return;}
    try {const body=q.get('mode')==='card'?{action:'card',authKey:q.get('authKey'),customerKey:q.get('customerKey')}:{action:'confirm',orderId:q.get('orderId'),paymentKey:q.get('paymentKey'),amount:Number(q.get('amount'))};
      await post('/api/billing/checkout',body);setMessage(q.get('mode')==='card'?'카드 등록이 완료되었습니다.':'결제가 확인되었습니다.');history.replaceState(null,'','/billing/result');
    }catch(e){setMessage((e as Error).message);setRetry(true);}}
  useEffect(()=>{if(!started.current){started.current=true;void confirm();}},[]);
  return <Shell wide={false}><Panel><h1>처리 결과</h1><p role="status">{message}</p>{retry&&<Button onClick={confirm}>같은 요청 다시 확인</Button>}<p><Link href="/billing">청구 내역 보기</Link></p></Panel></Shell>;
}
