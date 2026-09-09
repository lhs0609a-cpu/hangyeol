import { describe, expect, it } from 'vitest';
import { EMPTY_PROGRESS, readProgress } from '../app/learn/progress';

describe('Browser workbook progress recovery', () => {
  it('recovers from corrupt, null, array, primitive, or old-version storage', () => {
    for (const raw of [null, '{broken', 'null', '[]', '42', '{"version":0,"completed":["cafe-order"]}']) {
      expect(readProgress(raw)).toEqual(EMPTY_PROGRESS);
    }
  });
  it('keeps real IDs once, rejects foreign fields, and clamps long notes', () => {
    const result = readProgress(JSON.stringify({ ...EMPTY_PROGRESS, completed: ['cafe-order', 'missing', 'cafe-order', 42], lastLesson: 'missing', notes: { 'cafe-order': 'a'.repeat(2500), missing: 'bad' }, language: 'xx', dailyMinutes: -100, goal: 'missing' }));
    expect(result.completed).toEqual(['cafe-order']);
    expect(result.lastLesson).toBe(EMPTY_PROGRESS.lastLesson);
    expect(Object.keys(result.notes)).toEqual(['cafe-order']);
    expect(result.notes['cafe-order']).toHaveLength(2000);
    expect(result.language).toBe('en');
    expect(result.dailyMinutes).toBe(10);
  });
  it('restores the learner choices and notes without sharing default mutable objects', () => {
    const saved = { ...EMPTY_PROGRESS, completed: ['say-hello'], lastLesson: 'say-hello', notes: { 'say-hello': '저는 미나예요.' }, language: 'ko', dailyMinutes: 15, goal: 'connection', started: true };
    expect(readProgress(JSON.stringify(saved))).toEqual(saved);
    const blank = readProgress(null);
    blank.completed.push('cafe-order');
    expect(readProgress(null).completed).toEqual([]);
  });
});
