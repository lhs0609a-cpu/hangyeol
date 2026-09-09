import {beforeEach,expect,it,vi} from 'vitest';
const fixture=vi.hoisted(()=>({tx:{} as any,prisma:{} as any}));
vi.mock('../src/guard.js',()=>({db:()=>fixture.prisma}));
import {handlePgWebhook,topupCredits} from '../src/payments.js';
beforeEach(()=>{
 const invoice={id:1n,teacherId:2n,status:'pending',chargeAmount:10000,failedAt:null,graceUntil:null,retryCount:0,paidAt:null,pgTid:null};
 fixture.tx={$queryRaw:vi.fn(),$executeRaw:vi.fn(),invoice:{findUniqueOrThrow:vi.fn().mockResolvedValue(invoice),findFirst:vi.fn().mockResolvedValue(null),findMany:vi.fn().mockResolvedValue([]),update:vi.fn()},teacher:{findUnique:vi.fn().mockResolvedValue({id:2n,creditBalance:0}),update:vi.fn().mockResolvedValue({creditBalance:10000}),updateMany:vi.fn()},invoiceLine:{findMany:vi.fn().mockResolvedValue([])},billingCycle:{updateMany:vi.fn()},notification:{create:vi.fn()},creditTopup:{findUnique:vi.fn().mockResolvedValue(null),create:vi.fn()},paymentOrder:{findUnique:vi.fn().mockResolvedValue({teacherId:2n,kind:'topup',amount:10000,status:'paid'})}};
 fixture.prisma={...fixture.tx,invoice:{...fixture.tx.invoice,findUnique:vi.fn().mockResolvedValue(invoice)},$transaction:async(fn:any)=>fn(fixture.tx)};
});
it('does not mark an invoice paid for the wrong amount',async()=>{
 await expect(handlePgWebhook({invoiceId:'1',pgTid:'key',status:'paid',amount:100})).rejects.toThrow();
 expect(fixture.tx.invoice.update).not.toHaveBeenCalled();
});
it('ignores delayed failure after a successful payment',async()=>{
 fixture.tx.invoice.findUniqueOrThrow.mockResolvedValue({id:1n,teacherId:2n,status:'paid',chargeAmount:10000});
 await expect(handlePgWebhook({invoiceId:'1',pgTid:'old',status:'failed'})).resolves.toMatchObject({ignored:true});
 expect(fixture.tx.teacher.updateMany).not.toHaveBeenCalled();
});
it('keeps the teacher locked if another invoice remains locked',async()=>{
 fixture.tx.invoice.findMany.mockResolvedValue([{status:'locked'}]);
 await handlePgWebhook({invoiceId:'1',pgTid:'key',status:'paid',amount:10000});
 expect(fixture.tx.teacher.update).toHaveBeenCalledWith(expect.objectContaining({data:{billingStatus:'locked'}}));
 expect(fixture.tx.$executeRaw).not.toHaveBeenCalled();
});
it('does not credit the same transaction twice',async()=>{
 fixture.tx.creditTopup.findUnique.mockResolvedValue({teacherId:2n,paidAmount:10000,grantedAmount:10000,bonusPct:0});
 await expect(topupCredits({teacherId:2n,paidAmount:10000,pgTid:'key'})).resolves.toMatchObject({duplicate:true});
 expect(fixture.tx.teacher.update).not.toHaveBeenCalled();
});
it('increments rather than overwrites the credit balance',async()=>{
 await topupCredits({teacherId:2n,paidAmount:10000,pgTid:'key'});
 expect(fixture.tx.teacher.update).toHaveBeenCalledWith({where:{id:2n},data:{creditBalance:{increment:10000}}});
});
