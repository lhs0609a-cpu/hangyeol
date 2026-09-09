import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_UNITS, FIRST_STEPS, LEARNING_SCENES, buildDeck } from '@hangyeol/content';

describe('First Steps workbook integrity', () => {
  it('uses unique stable IDs and reviews only earlier missions', () => {
    const ids = FIRST_STEPS.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    FIRST_STEPS.forEach((lesson, index) => {
      for (const id of lesson.review) {
        expect(ids.indexOf(id)).toBeGreaterThanOrEqual(0);
        expect(ids.indexOf(id)).toBeLessThan(index);
      }
    });
  });
  it('every quiz has a real answer and bilingual explanation, and every mission maps to a teacher unit', () => {
    for (const lesson of FIRST_STEPS) {
      expect(ALL_UNITS.some((unit) => unit.unitNo === lesson.teacherUnit)).toBe(true);
      expect(lesson.questions.length).toBeGreaterThan(0);
      for (const question of lesson.questions) {
        expect(question.options[question.answer]).toBeTruthy();
        expect(Number.isInteger(question.answer)).toBe(true);
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.explanation.en.length).toBeGreaterThan(10);
        expect(question.explanation.ko.length).toBeGreaterThan(10);
      }
    }
  });
  it('all scene references resolve to shipped, public artwork with bilingual alt text', () => {
    for (const artwork of Object.values(LEARNING_SCENES)) {
      expect(artwork.src.startsWith('/photos/learning/')).toBe(true);
      expect(existsSync(`apps/teacher/public${artwork.src}`), artwork.src).toBe(true);
      expect(artwork.alt.en).toBeTruthy();
      expect(artwork.alt.ko).toBeTruthy();
    }
    for (const lesson of FIRST_STEPS) expect(LEARNING_SCENES[lesson.scene]).toBeDefined();
  });
  it('teacher cover and conversation artwork remains separate from vocabulary and teacher instructions', () => {
    for (const unit of ALL_UNITS) {
      const deck = buildDeck(unit.unitNo)!;
      expect(deck.slides[0]!.illustration?.src).toBeTruthy();
      for (const slide of deck.slides) {
        if (slide.illustration) {
          expect(['cover', 'dialogue', 'roleplay']).toContain(slide.kind);
          expect(existsSync(`apps/teacher/public${slide.illustration.src}`)).toBe(true);
        }
      }
    }
  });
});
