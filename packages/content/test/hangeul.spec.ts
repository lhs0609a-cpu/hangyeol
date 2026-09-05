import { describe, expect, it } from 'vitest';
import {
  FEATURAL_CLAIM,
  HALLYU_SPIKES,
  HANGEUL_FACTS,
  JAMO_ORIGINS,
  JAMO_SOURCE,
  JEONGINJI_LINE,
  KDH_FACT,
  SAMAT_ORIGIN,
  SAMJAE,
  WORLD_LEARNERS,
} from '@hangyeol/content';

/*
 * 랜딩의 훈민정음 구간과 한류 구간 검사.
 *
 * market.spec 과 같은 규칙이다 — 출처 없는 주장을 화면에 올리지 않는다.
 * 역사 항목은 숫자보다 더 위험하다. "세계에서 가장 과학적인 문자" 같은 말은
 * 출처가 없으면 자화자찬이 되고, 읽는 사람은 우리가 파는 물건까지 같이 의심한다.
 * 그래서 이 구간에 들어가는 모든 주장에 링크를 강제한다.
 */

/** 출처를 단 주장. 화면에서 링크가 되는 것들이다. */
const CITED = [
  { what: 'SAMAT_ORIGIN', it: SAMAT_ORIGIN },
  { what: 'JAMO_SOURCE', it: JAMO_SOURCE },
  { what: 'FEATURAL_CLAIM', it: FEATURAL_CLAIM },
  { what: 'JEONGINJI_LINE', it: JEONGINJI_LINE },
  { what: 'WORLD_LEARNERS', it: WORLD_LEARNERS },
];

describe('훈민정음 구간 — 출처 없는 주장을 화면에 올리지 않는다', () => {
  it('모든 주장에 출처와 링크가 있다', () => {
    for (const { what, it: c } of CITED) {
      expect(c.source.trim().length, what).toBeGreaterThan(1);
      expect(c.sourceUrl, what).toMatch(/^https:\/\//);
    }
  });

  it('숫자에는 출처와 확인 시점이 함께 있다', () => {
    for (const f of [...HANGEUL_FACTS, KDH_FACT]) {
      expect(f.source, f.label).toBeTruthy();
      expect(f.sourceUrl, f.label).toMatch(/^https:\/\//);
      expect(f.checkedOn, f.label).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('같은 사실을 두 번 보이지 않는다', () => {
    const labels = HANGEUL_FACTS.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('이름의 내력', () => {
  /*
   * 카드에 떼어 놓는 낱말은 위 문장에서 뽑은 것이다.
   * 문장을 고치면서 낱말을 그대로 두면 화면에서 둘이 어긋난다 —
   * 이름의 출처를 보이는 구간에서 그 어긋남은 치명적이다.
   */
  it('풀이하는 낱말이 서문 문장 안에 실제로 있다', () => {
    expect(SAMAT_ORIGIN.line).toContain(SAMAT_ORIGIN.word);
  });

  it('제품 이름이 그 낱말에서 왔다는 것이 보인다', () => {
    expect(SAMAT_ORIGIN.word.startsWith('사맛')).toBe(true);
  });

  /*
   * 원문은 아래아와 반치음이 섞인 옛한글이고, 화면에 올리는 것은 옮긴 것이다.
   * 그 사실을 밝히지 않으면 원문인 척하는 것이 된다.
   */
  it('옮긴 표기라는 사실을 화면에 밝힌다', () => {
    expect(SAMAT_ORIGIN.note.trim().length).toBeGreaterThan(4);
  });

  it('현대 뜻풀이가 함께 있다 — 옛말만 두면 아무도 못 읽는다', () => {
    expect(SAMAT_ORIGIN.modern.trim().length).toBeGreaterThan(8);
    expect(SAMAT_ORIGIN.gloss.trim().length).toBeGreaterThan(1);
  });
});

/*
 * 자모 표는 글꼴이 그려 준다. 그래서 현대 한글 호환 자모를 벗어나면
 * 그 자리에 네모가 뜬다 — 한글을 설명하는 화면에서 한글이 깨진다.
 * 옛한글(여린히읗 ㆆ U+3186 · 반치음 ㅿ U+317F)은 이 범위 밖이라 여기서 걸린다.
 */
const MODERN_JAMO = /^[ㄱ-ㅎ]$/;

describe('자모 상형 표', () => {
  it('표에 찍는 글자가 전부 현대 한글 자모다 — 네모가 뜨지 않는다', () => {
    for (const row of JAMO_ORIGINS) {
      expect(row.base, `기본자 ${row.base}`).toMatch(MODERN_JAMO);
      for (const d of row.derived) {
        expect(d, `${row.base} 의 가획자 ${d}`).toMatch(MODERN_JAMO);
      }
    }
  });

  it('기본자 다섯이 서로 다르다', () => {
    const bases = JAMO_ORIGINS.map((r) => r.base);
    expect(bases.length).toBe(5);
    expect(new Set(bases).size).toBe(5);
  });

  it('가획자가 어느 기본자에도 겹치지 않는다', () => {
    // 같은 글자가 두 줄에 나오면 획이 붙는 순서가 거짓말이 된다.
    const all = JAMO_ORIGINS.flatMap((r) => [r.base, ...r.derived]);
    expect(new Set(all).size).toBe(all.length);
  });

  it('기본자마다 어디를 본떴는지 적혀 있다', () => {
    for (const row of JAMO_ORIGINS) {
      expect(row.shape.trim().length, row.base).toBeGreaterThan(4);
      expect(row.derived.length, row.base).toBeGreaterThan(0);
    }
  });

  /* 하늘 · 땅 · 사람. 화면이 점 · 가로선 · 세로선으로 직접 그린다. */
  it('모음 기본자 셋이 그릴 수 있는 표시로만 되어 있다', () => {
    expect(SAMJAE.map((s) => s.mark)).toEqual(['dot', 'horizontal', 'vertical']);
    for (const s of SAMJAE) {
      expect(s.means.trim().length, s.mark).toBeGreaterThan(0);
      expect(s.became.trim().length, s.mark).toBeGreaterThan(0);
    }
  });
});

describe('한류 연표 — 줄마다 출처가 붙는다', () => {
  /*
   * 넷플릭스 시청 수와 듀오링고 등록 수는 전혀 다른 곳에서 온 숫자다.
   * 각주 하나로 묶으면 둘 다 못 믿을 숫자가 된다. 그래서 줄 안에 넣었고,
   * 줄을 추가하는 사람이 출처를 빠뜨리지 못하도록 여기서 막는다.
   */
  it('모든 줄에 저마다의 출처와 링크가 있다', () => {
    expect(HALLYU_SPIKES.length).toBeGreaterThan(0);
    for (const d of HALLYU_SPIKES) {
      expect(d.source.trim().length, d.what).toBeGreaterThan(1);
      expect(d.sourceUrl, d.what).toMatch(/^https:\/\//);
      expect(d.when.trim().length, d.what).toBeGreaterThan(1);
      expect(d.effect.trim().length, d.what).toBeGreaterThan(1);
    }
  });

  it('같은 줄이 두 번 나오지 않는다', () => {
    const keys = HALLYU_SPIKES.map((d) => `${d.when}·${d.what}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('연도가 오름차순이다 — 연표는 순서가 내용이다', () => {
    const years = HALLYU_SPIKES.map((d) => Number(d.when.slice(0, 4)));
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });
});
