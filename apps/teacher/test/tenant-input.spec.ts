import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({createStudent:vi.fn(),registerBillingKey:vi.fn()}));
vi.mock('@hangyeol/core',()=>({
 requireTeacher:async()=>({teacherId:1n}),readJson:async(req:Request)=>req.json(),requireFields:()=>{},
 handle:async(fn:()=>Promise<unknown>)=>fn(),json:(v:unknown)=>v,
 createStudent:mocks.createStudent,registerBillingKey:mocks.registerBillingKey,
}));
import {POST as studentPost} from '../app/api/students/route';
import {POST as cardPost} from '../app/api/billing/card/route';
beforeEach(()=>{vi.clearAllMocks();mocks.createStudent.mockResolvedValue({id:3n,status:'pending',billing:{chargedNow:0,firstChargeAtLessonNo:2}});});
it('ignores forged teacher ownership and undeclared student attributes',async()=>{
 await studentPost(new Request('https://example.test/api/students',{method:'POST',body:JSON.stringify({teacherId:'999',name:'Learner',email:'learner@example.test',l1Code:'en',platform:'direct',status:'active'})}));
 expect(mocks.createStudent.mock.calls[0]![0].teacherId).toBe(1n);
 expect(mocks.createStudent.mock.calls[0]![0]).not.toHaveProperty('status');
});
it('ignores forged billing ownership',async()=>{
 await cardPost(new Request('https://example.test/api/billing/card',{method:'POST',body:JSON.stringify({teacherId:'999',pgBillingKey:'fixture_key',cardLast4:'1234'})}));
 expect(mocks.registerBillingKey).toHaveBeenCalledWith({teacherId:1n,pgBillingKey:'fixture_key',cardLast4:'1234'});
});
