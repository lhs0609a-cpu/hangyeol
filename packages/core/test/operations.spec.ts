import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextUnitNo } from '../src/lesson-progress.js';
import { allocate } from '../src/teaching-plan.js';
import { assertPaymentMatches, paymentConfiguration, tossRequest } from '../src/payment-provider.js';
import { reminderText } from '../src/notifications.js';

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('learning progression',()=>{
  it('keeps the same unit until passed, including an interrupted lesson',()=>{
    expect(nextUnitNo(0)).toBe(1);expect(nextUnitNo(3,'repeat')).toBe(3);
    expect(nextUnitNo(3,null)).toBe(3);expect(nextUnitNo(3,'pass')).toBe(4);
  });
  it.each(['normal','recovery','first_lesson','repeat'] as const)('%s allocates exactly 50 minutes',mode=>{
    for(const completion of [0,0.4,1])expect(allocate(mode,completion).reduce((sum,p)=>sum+p.minutes,0)).toBe(50);
  });
});
describe('server-authoritative payment verification',()=>{
  const payment={paymentKey:'provider-transaction',orderId:'order-1',status:'DONE',totalAmount:10000,balanceAmount:10000,currency:'KRW'};
  it('rejects tampered amount, order, currency, and unauthenticated status',()=>{
    expect(()=>assertPaymentMatches(payment,{id:'order-1',amount:10000})).not.toThrow();
    for(const patch of [{totalAmount:100},{orderId:'someone-else'},{currency:'USD'},{status:'READY'},{paymentKey:''}])expect(()=>assertPaymentMatches({...payment,...patch},{id:'order-1',amount:10000})).toThrow();
  });
  it('does not enable live payment just because a key was installed',()=>{
    vi.stubEnv('TOSS_CLIENT_KEY','live_gck_fixture');vi.stubEnv('TOSS_SECRET_KEY','live_gsk_fixture');vi.stubEnv('PAYMENTS_LIVE_ENABLED','false');
    expect(paymentConfiguration().enabled).toBe(false);
  });
  it('refuses mixed environments',()=>{
    vi.stubEnv('TOSS_CLIENT_KEY','test_gck_fixture');vi.stubEnv('TOSS_SECRET_KEY','live_gsk_fixture');vi.stubEnv('PAYMENTS_LIVE_ENABLED','true');
    expect(paymentConfiguration().enabled).toBe(false);
  });
  it('sends the stored amount and stable idempotency key, using server authentication',async()=>{
    vi.stubEnv('TOSS_CLIENT_KEY','test_gck_fixture');vi.stubEnv('TOSS_SECRET_KEY','test_gsk_fixture');
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>payment});vi.stubGlobal('fetch',fetcher);
    await tossRequest('payments/confirm',{orderId:'order-1',amount:10000},'stable-attempt');
    expect(fetcher).toHaveBeenCalledWith('https://api.tosspayments.com/v1/payments/confirm',expect.objectContaining({headers:expect.objectContaining({'Idempotency-Key':'stable-attempt',Authorization:`Basic ${Buffer.from('test_gsk_fixture:').toString('base64')}`}),body:JSON.stringify({orderId:'order-1',amount:10000})}));
  });
  it('never returns a provider error body containing sensitive information',async()=>{
    vi.stubEnv('TOSS_CLIENT_KEY','test_gck_fixture');vi.stubEnv('TOSS_SECRET_KEY','test_gsk_fixture');
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({message:'secret-data'})}));
    await expect(tossRequest('payments/confirm',{})).rejects.not.toThrow('secret-data');
  });
});
it('reminders identify the learning notebook without platform branding',()=>{
 const message=reminderText('https://example.test/verify?t=token');
 expect(message.text).toContain('https://example.test/verify?t=token');
 expect(message.text).not.toMatch(/samat|hangyeol/i);
});
