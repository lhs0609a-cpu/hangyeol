'use client';
import { useEffect, useRef, useState } from 'react';
export default function VerifyPage() {
  const [message,setMessage] = useState('Opening your notebook… / 학습 노트를 여는 중입니다.');
  const started=useRef(false);
  useEffect(()=>{if(started.current)return;started.current=true;
    const token=new URLSearchParams(location.search).get('t');
    if(!token){setMessage('Please ask your teacher for a new link. / 선생님께 새 링크를 요청해 주세요.');return;}
    void fetch(`/api/note/verify?t=${encodeURIComponent(token)}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();location.replace('/');}).catch(()=>setMessage('This link could not be opened. Please ask your teacher for a new link. / 선생님께 새 링크를 요청해 주세요.'));
  },[]);
  return <p role="status" style={{paddingTop:40,lineHeight:1.8}}>{message}</p>;
}
