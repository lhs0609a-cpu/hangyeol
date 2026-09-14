import {describe,it,expect} from 'vitest';
import {teachingObservationSchema} from '../src/teaching-observations.js';
import {SKILLS} from '@hangyeol/content';
const input=()=>({unitNo:15,revision:null,requestId:'fa71f3b4-dcd0-4c2d-a27c-74a1938d6944',entries:SKILLS.map(skill=>({skill,outcome:'unknown',evidence:'',retest:'not_checked',retestEvidence:''}))});
describe('evidence-backed teaching observations',()=>{
  it('keeps unobserved skills unknown and rejects evidence-free claims',()=>{
    expect(teachingObservationSchema.safeParse(input()).success).toBe(true);
    const support=input();support.entries[0]!.outcome='support';
    expect(teachingObservationSchema.safeParse(support).success).toBe(false);
    support.entries[0]!.evidence='문장을 읽었지만 뜻은 설명하지 못함';
    expect(teachingObservationSchema.safeParse(support).success).toBe(true);
  });
  it('requires separate evidence for transfer after support',()=>{
    const observed=input();observed.entries[0]!.outcome='support';observed.entries[0]!.evidence='핵심어를 들려주어야 질문에 답함';observed.entries[0]!.retest='independent';
    expect(teachingObservationSchema.safeParse(observed).success).toBe(false);
    observed.entries[0]!.retestEvidence='음료를 바꾼 새 질문에 글 없이 답함';
    expect(teachingObservationSchema.safeParse(observed).success).toBe(true);
    observed.entries[0]!.outcome='unknown';expect(teachingObservationSchema.safeParse(observed).success).toBe(false);
  });
  it('rejects duplicate skills, invalid units and unsupported outcomes',()=>{
    const duplicate=input();duplicate.entries[1]=duplicate.entries[0]!;
    expect(teachingObservationSchema.safeParse(duplicate).success).toBe(false);
    expect(teachingObservationSchema.safeParse({...input(),unitNo:251}).success).toBe(false);
    const fake=input();fake.entries[0]!.outcome='mastered';expect(teachingObservationSchema.safeParse(fake).success).toBe(false);
  });
});
