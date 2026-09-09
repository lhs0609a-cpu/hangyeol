import { describe, expect, it } from 'vitest';
import { replayLevelAnswers } from '../src/level-test-service.js';
import { nextUnitNo } from '../src/lesson-progress.js';
describe('placement before lessons', () => {
  it('places all six levels without marking earlier units complete', () => {
    [1,31,71,121,171,211].forEach((unit,i)=>expect(nextUnitNo(0,null,`topik${i+1}`)).toBe(unit));
    expect(nextUnitNo(71,'repeat','topik1')).toBe(71);
    expect(nextUnitNo(71,'pass','topik6')).toBe(72);
  });
  it('scores unknown answers on the server and finishes exactly twenty questions', () => {
    const answers: {questionId:string;choiceIndex:number}[]=[];
    let step=replayLevelAnswers(answers);
    while(!step.done){answers.push({questionId:step.question!.id,choiceIndex:-1});step=replayLevelAnswers(answers);}
    expect(step.state.correct).toBe(0);expect(step.progress.asked).toBe(20);
    expect(()=>replayLevelAnswers([...answers,answers[0]])).toThrow();
  });
  it('rejects fabricated state, skipped questions, duplicate questions and invalid choices', () => {
    expect(()=>replayLevelAnswers({correct:20})).toThrow();
    expect(()=>replayLevelAnswers([{questionId:'L6-1',choiceIndex:0}])).toThrow();
    const q=replayLevelAnswers([]).question!;
    const a={questionId:q.id,choiceIndex:0};
    expect(()=>replayLevelAnswers([a,a])).toThrow();
    expect(()=>replayLevelAnswers([{...a,choiceIndex:99}])).toThrow();
  });
});
