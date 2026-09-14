import { describe,it,expect } from 'vitest';
import { existsSync } from 'node:fs';
import { ALL_UNITS,buildStudentBook,buildTeacherGuide,SKILLS,buildDeck } from '../src/index.js';

describe('student coursebooks and private teacher guides',()=>{
  it('covers all 250 units with student-safe models, images, activities and teacher probes',()=>{
    expect(ALL_UNITS).toHaveLength(250);
    for(const unit of ALL_UNITS){
      const book=buildStudentBook(unit.unitNo)!,guide=buildTeacherGuide(unit.unitNo)!;
      expect(book.unitNo).toBe(unit.unitNo);
      expect(book.model.length,`model for ${unit.unitNo}`).toBeGreaterThan(0);
      expect(book.model.every(line=>!/^\s*\(/.test(line))).toBe(true);
      expect(book.images.length).toBeGreaterThanOrEqual(3);
      for(const picture of book.images){
        for(const app of ['teacher','note'])expect(existsSync(`apps/${app}/public${picture.artwork.src}`),`${app} ${picture.artwork.src}`).toBe(true);
      }
      expect(guide.probes.map(p=>p.skill)).toEqual([...SKILLS]);
      expect(guide.stages).toHaveLength(4);
      expect(book).not.toHaveProperty('probes');expect(book).not.toHaveProperty('teacherPitfalls');
      expect(buildDeck(unit.unitNo)!.slides.filter(s=>s.illustration).length).toBeGreaterThanOrEqual(2);
    }
  });
  it('varies scaffolding by level and uses the actual unit vocabulary and goal',()=>{
    expect(buildTeacherGuide(1)!.scaffold).not.toBe(buildTeacherGuide(211)!.scaffold);
    expect(buildTeacherGuide(15)!.probes.find(p=>p.skill==='form')!.ask).toContain('주세요');
    expect(buildTeacherGuide(211)!.probes.find(p=>p.skill==='interaction')!.ask).toContain('이유·예외');
    expect(buildStudentBook(0)).toBeNull();expect(buildTeacherGuide(251)).toBeNull();
  });
});
