import {beforeEach,expect,it,vi} from 'vitest';
const fixture=vi.hoisted(()=>({db:{} as any}));
vi.mock('../src/guard.js',()=>({db:()=>fixture.db}));
import {ownTuitionOrder,reserveTuition,completeTuition,parseTuition,offerInput,applicationInput} from '../src/tuition.js';
beforeEach(()=>{fixture.db={paymentOrder:{findUnique:vi.fn()}};});
it('does not reveal another student’s tuition order',async()=>{
  fixture.db.paymentOrder.findUnique.mockResolvedValue({studentId:2n,kind:'tuition'});
  await expect(ownTuitionOrder(1n,'order')).rejects.toThrow();
});
it('does not expose platform credit orders as student tuition',async()=>{
  fixture.db.paymentOrder.findUnique.mockResolvedValue({studentId:1n,kind:'topup'});
  await expect(ownTuitionOrder(1n,'order')).rejects.toThrow();
});
it('blocks lesson reservations for unpaid or exhausted tuition',async()=>{
  const tx={tuitionEnrollment:{findMany:vi.fn().mockResolvedValue([{status:'pending',used:0,sessions:3},{status:'active',used:3,sessions:3}])},tuitionUsage:{create:vi.fn()}};
  await expect(reserveTuition(tx as never,1n,2n,3n)).rejects.toThrow();
  expect(tx.tuitionUsage.create).not.toHaveBeenCalled();
});
it('reserves a session without making it eligible for payout',async()=>{
  const tx={tuitionEnrollment:{findMany:vi.fn().mockResolvedValue([{id:'enrollment',status:'active',used:0,sessions:3,amount:10001,feeBps:1500}]),update:vi.fn()},tuitionUsage:{create:vi.fn()}};
  await reserveTuition(tx as never,1n,2n,3n);
  expect(tx.tuitionUsage.create).toHaveBeenCalledWith({data:{enrollmentId:'enrollment',lessonId:3n,teacherId:2n,gross:3333,fee:499,net:2834}});
});
it('only completes a reserved usage once',async()=>{
  const tx={$queryRaw:vi.fn(),tuitionUsage:{updateMany:vi.fn()}};const now=new Date();
  await completeTuition(tx as never,2n,3n,now);
  expect(tx.tuitionUsage.updateMany).toHaveBeenCalledWith({where:{lessonId:3n,teacherId:2n,status:'reserved'},data:{status:'completed',completedAt:now}});
});
it('rejects missing commercial settings and invalid application time zones',()=>{
  expect(()=>parseTuition(offerInput,{title:'No price'})).toThrow();
  expect(()=>parseTuition(applicationInput,{offerId:'eab23d09-c5ef-4d33-8bb0-f8ca2f0d75ae',name:'Learner',email:'learner@example.test',language:'en',timezone:'Not/AZone',goal:'Learn Korean',consent:true})).toThrow();
});
