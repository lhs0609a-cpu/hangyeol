import { describe, expect, it } from 'vitest';
import {
  ALL_UNITS,
  LESSON_PLANS,
  LEVEL2_UNITS,
  buildDeck,
  planFor,
  unitByNo,
} from '@hangyeol/content';

/*
 * 2급 40차시와 슬라이드 생성기 검사.
 *
 * 40개를 사람이 손으로 훑을 수 없다. 뒤로 갈수록 밀도가 떨어지는 것이
 * AI 초안의 전형적인 실패 방식인데, 그건 읽어야만 보인다.
 * 그래서 "대본인가" 를 기계가 판정할 수 있는 형태로 바꿔 검사한다.
 */

describe('2급 커리큘럼 — 31~70차시', () => {
  it('차시 번호가 31부터 70까지 연속이다', () => {
    const nos = LEVEL2_UNITS.map((u) => u.unitNo);
    expect(nos).toEqual(Array.from({ length: 40 }, (_, i) => i + 31));
  });

  it('1급과 이어 붙여도 번호가 겹치거나 비지 않는다', () => {
    const nos = ALL_UNITS.map((u) => u.unitNo);
    expect(nos).toEqual(Array.from({ length: 70 }, (_, i) => i + 1));
  });

  it('은/는 대조는 이/가와 을/를을 충분히 쓴 뒤에 나온다', () => {
    // 1급에서 미룬 이유가 여기서도 지켜져야 한다.
    // 오류율 39% 항목이라 조사 두 개가 몸에 붙기 전에 넣으면 실패한다.
    const contrast = LEVEL2_UNITS.find((u) => u.targetForms.includes('은/는 (대조)'))!;
    const object = ALL_UNITS.find((u) => u.targetForms.includes('을/를'))!;
    expect(contrast.unitNo - object.unitNo).toBeGreaterThan(20);
  });

  it('-거든요와 -잖아요가 이웃한다 — 이 둘은 짝으로만 익는다', () => {
    const a = LEVEL2_UNITS.find((u) => u.targetForms.includes('-거든요'))!;
    const b = LEVEL2_UNITS.find((u) => u.targetForms.includes('-잖아요'))!;
    expect(Math.abs(a.unitNo - b.unitNo)).toBe(1);
  });

  it('관형형이 그것을 쓰는 문형보다 먼저 나온다', () => {
    const adnominal = LEVEL2_UNITS.find((u) => u.targetForms.includes('관형형 -(으)ㄴ/는'))!;
    // -는 것, -것 같다 는 관형형 위에 얹힌 형태다. 순서가 뒤집히면 설명이 불가능해진다.
    for (const dependent of ['-는 것', '-(으)ㄴ/는/-(으)ㄹ 것 같다']) {
      const u = LEVEL2_UNITS.find((x) => x.targetForms.includes(dependent))!;
      expect(u.unitNo).toBeGreaterThan(adnominal.unitNo);
    }
  });

  it('재등장 차시는 실제로 존재하는 차시를 가리킨다', () => {
    for (const u of LEVEL2_UNITS) {
      for (const r of u.recycleFrom) {
        expect(unitByNo(r), `${u.unitNo}차시가 없는 ${r}차시를 참조한다`).not.toBeNull();
        expect(r).toBeLessThan(u.unitNo);
      }
    }
  });
});

describe('2급 지도안 — 대본인가', () => {
  const plans = LESSON_PLANS.filter((p) => p.unitNo >= 31 && p.unitNo <= 70);

  it('40차시가 빠짐없이 있다', () => {
    expect(plans.map((p) => p.unitNo)).toEqual(Array.from({ length: 40 }, (_, i) => i + 31));
  });

  it('모든 차시가 커리큘럼과 같은 목표문을 쓴다', () => {
    // 두 곳에 적힌 목표가 어긋나면 강사는 어느 쪽을 믿을지 모른다.
    for (const p of plans) {
      expect(unitByNo(p.unitNo)!.goalStatement).toBe(p.goalStatement);
    }
  });

  it('6단계가 모두 있고 순서가 같다', () => {
    for (const p of plans) {
      expect(p.blocks.map((b) => b.phase)).toEqual([
        'review',
        'model',
        'drill',
        'roleplay',
        'free',
        'wrap',
      ]);
    }
  });

  it('모든 블록에 그대로 읽을 대사가 있다', () => {
    // 이게 이 제품의 정의다. 강사가 판단할 여지를 남기지 않는다.
    for (const p of plans) {
      for (const b of p.blocks) {
        expect(b.say.length, `${p.unitNo}차시 ${b.phase}`).toBeGreaterThan(0);
      }
    }
  });

  it('드릴 블록은 학생이 무엇을 말할지 명시한다', () => {
    for (const p of plans) {
      const drill = p.blocks.find((b) => b.phase === 'drill')!;
      expect(drill.studentOutput, `${p.unitNo}차시`).toBeTruthy();
      expect(drill.ifStuck ?? drill.studentOutput).toBeTruthy();
    }
  });

  it('뒤로 갈수록 밀도가 떨어지지 않는다', () => {
    // AI 초안이 무너지는 전형적인 방식이다. 앞 20개와 뒤 20개의 대사량을 비교한다.
    const volume = (from: number, to: number) =>
      plans
        .filter((p) => p.unitNo >= from && p.unitNo <= to)
        .reduce((sum, p) => sum + p.blocks.reduce((s, b) => s + b.say.length, 0), 0);

    const front = volume(31, 50);
    const back = volume(51, 70);
    expect(back).toBeGreaterThan(front * 0.85);
  });

  it('강사의 흔한 실수를 차시마다 짚는다', () => {
    for (const p of plans) {
      expect(p.teacherPitfalls.length, `${p.unitNo}차시`).toBeGreaterThanOrEqual(3);
    }
  });

  it('다섯 개 언어권 모두에 모국어 간섭 메모가 있다', () => {
    for (const p of plans) {
      for (const lang of ['en', 'ja', 'zh', 'vi', 'es'] as const) {
        expect(p.l1Notes[lang], `${p.unitNo}차시 ${lang}`).toBeTruthy();
      }
    }
  });

  it('52차시는 한 번에 잡히지 않는다고 지도안이 말한다', () => {
    // 오류율이 가장 높은 항목이다. 강사가 "안 됐다" 고 판단하면 진도가 멈춘다.
    const p = planFor(52)!;
    const text = [...p.teacherPitfalls, ...p.blocks.flatMap((b) => b.say)].join(' ');
    expect(text).toContain('정상');
  });
});

describe('슬라이드 생성기', () => {
  it('지도안이 있는 모든 차시에 덱이 만들어진다', () => {
    for (const u of ALL_UNITS) {
      expect(buildDeck(u.unitNo), `${u.unitNo}차시`).not.toBeNull();
    }
  });

  it('덱은 표지로 시작하고 마무리로 끝난다', () => {
    for (const u of ALL_UNITS) {
      const d = buildDeck(u.unitNo)!;
      expect(d.slides[0]!.kind).toBe('cover');
      expect(d.slides.at(-1)!.kind).toBe('wrap');
    }
  });

  it('슬라이드 번호가 1부터 연속이다', () => {
    for (const u of ALL_UNITS) {
      const d = buildDeck(u.unitNo)!;
      expect(d.slides.map((s) => s.no)).toEqual(d.slides.map((_, i) => i + 1));
    }
  });

  it('빈 슬라이드가 없다 — 모든 장에 읽을 것이 있다', () => {
    for (const u of ALL_UNITS) {
      for (const s of buildDeck(u.unitNo)!.slides) {
        const has = s.headline || (s.lines?.length ?? 0) > 0 || (s.chips?.length ?? 0) > 0;
        expect(has, `${u.unitNo}차시 ${s.no}번`).toBeTruthy();
      }
    }
  });

  it('강사 지시문이 학생이 보는 본문으로 새지 않는다', () => {
    // 지도안의 do[] 와 괄호 지시는 강사용이다. 슬라이드 본문에 뜨면 수업이 우스워진다.
    for (const u of ALL_UNITS) {
      for (const s of buildDeck(u.unitNo)!.slides) {
        for (const line of s.lines ?? []) {
          expect(line.startsWith('('), `${u.unitNo}차시 ${s.no}번: ${line}`).toBe(false);
        }
      }
    }
  });

  it('차시당 최소 8장은 나온다', () => {
    for (const u of ALL_UNITS) {
      expect(buildDeck(u.unitNo)!.slides.length, `${u.unitNo}차시`).toBeGreaterThanOrEqual(8);
    }
  });

  it('덱 목표문은 커리큘럼과 같다', () => {
    for (const u of ALL_UNITS) {
      expect(buildDeck(u.unitNo)!.goalStatement).toBe(u.goalStatement);
    }
  });

  it('없는 차시는 null 을 준다 — 빈 덱을 만들지 않는다', () => {
    expect(buildDeck(999)).toBeNull();
  });
});
