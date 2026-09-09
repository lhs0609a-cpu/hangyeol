import {describe,it,expect} from 'vitest';
import {ALL_UNITS,LESSON_PLANS,buildDeck} from '../src/index.js';
import {EXTENDED_UNITS,EXTENDED_PLANS} from '../src/extended-lessons.js';
describe('complete draft curriculum',()=>{
 it('has exactly 180 additional, individually named scenarios',()=>{
  expect(EXTENDED_UNITS).toHaveLength(180);
  expect(new Set(EXTENDED_UNITS.map(u=>u.title)).size).toBe(180);
  expect(ALL_UNITS.map(u=>u.unitNo)).toEqual(Array.from({length:250},(_,i)=>i+1));
 });
 it('connects every draft to a plan, a deck, and earlier review units',()=>{
  for(const u of ALL_UNITS){
   expect(LESSON_PLANS.find(p=>p.unitNo===u.unitNo)?.goalStatement).toBe(u.goalStatement);
   expect(buildDeck(u.unitNo)?.slides.length).toBeGreaterThan(8);
   for(const n of u.recycleFrom){expect(n).toBeLessThan(u.unitNo);expect(ALL_UNITS.some(x=>x.unitNo===n)).toBe(true);}
  }
 });
 it('includes a distinct scenario model and concrete free task for each extension',()=>{
  const models=EXTENDED_PLANS.map(p=>p.blocks.find(b=>b.phase==='model')!.say[1]);
  expect(new Set(models).size).toBe(180);
  for(const p of EXTENDED_PLANS){expect(p.blocks.map(b=>b.phase)).toEqual(['review','model','drill','roleplay','free','wrap']);expect(p.exitTicket[0]!.length).toBeGreaterThan(15);}
 });
});
