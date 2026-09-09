import { describe, expect, it } from 'vitest';
import { tuitionShare } from '../src/tuition-math.js';
describe('tuition allocation', () => {
  it('preserves the package price and total commission to the won', () => {
    for (const amount of [1001, 19999, 5000000]) for (const sessions of [1,3,7,100]) for (const bps of [0,1000,3333,10000]) {
      const rows = Array.from({length:sessions}, (_,i) => tuitionShare(amount,sessions,bps,i+1));
      expect(rows.reduce((s,r)=>s+r.gross,0)).toBe(amount);
      expect(rows.reduce((s,r)=>s+r.fee,0)).toBe(Math.floor(amount*bps/10000));
      expect(rows.every(r=>r.net>=0 && r.gross===r.net+r.fee)).toBe(true);
    }
  });
  it('keeps unused refund plus consumed lessons equal to the original price', () => {
    for(let used=0;used<=7;used++) {
      const earned=Array.from({length:used},(_,i)=>tuitionShare(10001,7,1500,i+1).gross).reduce((a,b)=>a+b,0);
      expect(earned + 10001-Math.floor(10001*used/7)).toBe(10001);
    }
  });
  it('rejects invalid and exhausted allocations',()=>{
    expect(()=>tuitionShare(10000,0,1000,1)).toThrow();
    expect(()=>tuitionShare(10000,3,1000,4)).toThrow();
    expect(()=>tuitionShare(10000,3,-1,1)).toThrow();
  });
});
