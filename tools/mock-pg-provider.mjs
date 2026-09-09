// Test-process preload only. Never import from application code.
if(process.env.SAMAT_TEST_PROVIDER!=='isolated-e2e')throw new Error('Test provider requires the isolated E2E runner.');
const originalFetch=globalThis.fetch,payments=new Map();
process.on('message',message=>{if(message?.type==='shutdown-fixture')void(async()=>{await globalThis.prisma?.$disconnect();process.exit(0);})();});
globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
  if(url.hostname==='api.tosspayments.com'){
    const body=init?.body?JSON.parse(String(init.body)):{};
    if(url.pathname==='/v1/payments/confirm'){
      if(!body.paymentKey.startsWith('fixture-'))return Response.json({error:'fixture-key-required'},{status:400});
      const payment=payments.get(body.paymentKey)??{orderId:body.orderId,paymentKey:body.paymentKey,totalAmount:body.amount,currency:'KRW',status:'DONE',balanceAmount:body.amount};
      payments.set(body.paymentKey,payment);return Response.json(payment);
    }
    const key=decodeURIComponent(url.pathname.split('/')[3]??''),payment=payments.get(key);
    if(!payment)return Response.json({error:'fixture-payment-not-found'},{status:404});
    if(url.pathname.endsWith('/cancel')){
      const amount=body.cancelAmount??payment.balanceAmount;
      if(amount>payment.balanceAmount||amount<=0)return Response.json({error:'invalid-fixture-refund'},{status:400});
      payment.balanceAmount-=amount;payment.status=payment.balanceAmount?'PARTIAL_CANCELED':'CANCELED';
    }
    return Response.json(payment);
  }
  if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('External requests are disabled in the isolated E2E runner.');
  return originalFetch(input,init);
};
