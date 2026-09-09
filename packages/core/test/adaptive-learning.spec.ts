import { describe,expect,it } from 'vitest';
import {adjustedNextUnit,recommendAdjustment,type Adjustment} from '../src/adaptive-learning.js';
const adjustment:Adjustment={mode:'supplement',targetUnitNo:12,resumeUnitNo:71,anchorLessonId:'1',reason:'Needs past tense practice',observations:{reading:2,listening:2,speaking:0},requestId:'fixture'};
const lesson=(id:bigint,lessonNo:number,outcome:string|null,complete=true)=>({id,lessonNo,outcome,reportSubmittedAt:complete?new Date():null});
describe('adaptive teaching decisions',()=>{
  it('distinguishes broad difficulty, a local gap and independent performance',()=>{
    expect(recommendAdjustment(71,{reading:0,listening:0,speaking:1}).mode).toBe('reassign');
    expect(recommendAdjustment(71,{reading:2,listening:2,speaking:0}).mode).toBe('supplement');
    expect(recommendAdjustment(71,{reading:2,listening:2,speaking:2}).mode).toBe('keep');
    expect(recommendAdjustment(71,{reading:2,listening:2,speaking:0},'과거형').targetUnitNo).toBe(20);
    expect(recommendAdjustment(1,{reading:0,listening:1,speaking:0}).targetUnitNo).toBe(1);
  });
  it('waits for a completed passing supplement then returns to the saved main unit',()=>{
    expect(adjustedNextUnit(71,lesson(1n,71,'repeat'),adjustment)).toBe(12);
    expect(adjustedNextUnit(12,lesson(2n,12,null,false),adjustment)).toBe(12);
    expect(adjustedNextUnit(12,lesson(2n,12,'repeat'),adjustment)).toBe(12);
    expect(adjustedNextUnit(13,lesson(3n,12,'pass'),adjustment)).toBe(71);
    expect(adjustedNextUnit(72,lesson(4n,71,'pass'),adjustment)).toBe(72);
  });
  it('reassignment continues from the new track without jumping back',()=>{
    const reassigned={...adjustment,mode:'reassign' as const};
    expect(adjustedNextUnit(71,lesson(1n,71,'repeat'),reassigned)).toBe(12);
    expect(adjustedNextUnit(13,lesson(2n,12,'pass'),reassigned)).toBe(13);
    expect(adjustedNextUnit(71,lesson(1n,71,'repeat'),{...adjustment,mode:'keep'})).toBe(71);
  });
});
