import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMPETITIVE_GAP,
  DEMAND_FACTS,
  DIAMOND_NOTE,
  GAP_FACTS,
  HALLYU_FACTS,
  HALLYU_FANS,
  MLA_SERIES,
  PLATFORM_ADMISSION,
  PLATFORM_GAPS,
  SCHOLAR_VOICES,
  TEACHER_VOICE,
  TOPIK_SERIES,
} from '@hangyeol/content';

/*
 * 근거 원장 검사 — 13번 문서 §7 이 약속한 게이트.
 *
 * D-003 이 외부 자산에 대해 하는 일을 여기서는 외부 주장에 대해 한다.
 * 화면에 오르는 숫자와 인용은 전부 출처와 확인 시점을 달고 있어야 하고,
 * 조사 과정에서 기각한 것들은 소스 어디에도 다시 나타나면 안 된다.
 *
 * 이 검사가 특히 중요한 이유가 있다. 이 랜딩은 숫자로 설득한다 —
 * 숫자 하나가 틀린 것으로 밝혀지면 나머지 스물이 같이 죽는다.
 */

describe('수요 원장 — 출처 없는 주장을 화면에 올리지 않는다', () => {
  it('모든 숫자에 출처와 확인 시점이 있다', () => {
    for (const f of [...DEMAND_FACTS, ...GAP_FACTS, ...HALLYU_FACTS]) {
      expect(f.source, f.label).toBeTruthy();
      expect(f.sourceUrl, f.label).toMatch(/^https:\/\//);
      expect(f.checkedOn, f.label).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('인용에도 링크가 있다 — 확인할 수 없는 인용은 인용이 아니다', () => {
    const cited = [PLATFORM_ADMISSION, TEACHER_VOICE, DIAMOND_NOTE, HALLYU_FANS, MLA_SERIES];
    for (const c of cited) {
      expect(c.sourceUrl, JSON.stringify(c).slice(0, 40)).toMatch(/^https:\/\//);
    }
    for (const v of SCHOLAR_VOICES) {
      expect(v.sourceUrl, v.who).toMatch(/^https:\/\//);
      expect(v.work.trim().length, v.who).toBeGreaterThan(3);
    }
  });

  it('같은 사실을 두 번 보이지 않는다', () => {
    const labels = [...DEMAND_FACTS, ...GAP_FACTS, ...HALLYU_FACTS].map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('그래프 A — TOPIK 시계열', () => {
  it('연도가 오름차순이다 — 연표는 순서가 내용이다', () => {
    const years = TOPIK_SERIES.points.map((p) => p.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('같은 해가 두 번 나오지 않는다', () => {
    const years = TOPIK_SERIES.points.map((p) => p.year);
    expect(new Set(years).size).toBe(years.length);
  });

  /*
   * 이 검사가 이 파일에서 가장 중요하다.
   *
   * 2014 · 2021 · 2022 는 1차 출처로 확인하지 못해 비워 두었다.
   * 그 사실이 화면에 안 적히면 그래프가 매끈해 보이는 대신 거짓말을 한다 —
   * 없는 해를 건너뛴 것을 연속된 자료처럼 보이게 하는 것이기 때문이다.
   * 그래서 실제로 빠진 해가 있으면 missing 문장이 반드시 있어야 한다.
   */
  it('빠진 해가 있으면 빠졌다고 화면에 밝힌다', () => {
    const years = TOPIK_SERIES.points.map((p) => p.year);
    const span = years[years.length - 1] - years[0] + 1;
    const hasGap = span !== years.length;

    if (hasGap) {
      expect(TOPIK_SERIES.missing.trim().length).toBeGreaterThan(10);
    }
  });

  /*
   * 2020년 급락에 이유가 안 붙으면 "수요가 꺾였다" 로 읽힌다.
   * 앞뒤 해보다 크게 떨어진 해에는 설명이 있어야 한다.
   */
  it('앞 해보다 크게 떨어진 해에는 이유가 붙어 있다', () => {
    const pts = TOPIK_SERIES.points;
    for (let i = 1; i < pts.length; i += 1) {
      const dropped = pts[i].value < pts[i - 1].value * 0.85;
      if (dropped) {
        expect(pts[i].mark, `${pts[i].year}년 급락에 설명이 없다`).toBeTruthy();
      }
    }
  });

  it('값이 전부 양수다', () => {
    for (const p of TOPIK_SERIES.points) {
      expect(p.value, String(p.year)).toBeGreaterThan(0);
    }
  });
});

describe('그래프 B — 언어별 증감', () => {
  it('주인공은 하나뿐이다 — 강조가 둘이면 강조가 아니다', () => {
    expect(MLA_SERIES.bars.filter((b) => b.emphasis).length).toBe(1);
  });

  it('증가와 감소가 섞여 있다 — 한쪽만 있으면 다이버징이 아니다', () => {
    const bars = MLA_SERIES.bars;
    expect(bars.some((b) => b.percent > 0)).toBe(true);
    expect(bars.some((b) => b.percent < 0)).toBe(true);
  });

  /*
   * 유리한 것만 골라 그린 그래프는 한 번 들키면 나머지 숫자까지 같이 죽는다.
   * 15개 중 5개만 실었다는 사실을 캡션이 밝혀야 한다.
   */
  it('무엇이 빠졌는지 캡션이 밝힌다', () => {
    expect(MLA_SERIES.caption).toContain('15');
  });

  it('원문 인용과 옮긴 말이 함께 있다', () => {
    expect(MLA_SERIES.quote.trim().length).toBeGreaterThan(20);
    expect(MLA_SERIES.quoteKo.trim().length).toBeGreaterThan(10);
  });
});

describe('공백 원장 — 강사 쪽 근거', () => {
  it('직접 센 숫자에는 센 날짜가 붙어 있다', () => {
    // 실시간으로 변하는 숫자다. 날짜가 없으면 언젠가 조용히 틀린 숫자가 된다.
    for (const g of PLATFORM_GAPS) {
      expect(g.checkedOn, g.platform).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(g.teachers, g.platform).toBeGreaterThan(0);
      expect(g.how.trim().length, g.platform).toBeGreaterThan(4);
      expect(g.sourceUrl, g.platform).toMatch(/^https:\/\//);
    }
  });

  it('경쟁 지형 문단이 비어 있지 않다', () => {
    expect(COMPETITIVE_GAP.headline.trim().length).toBeGreaterThan(8);
    expect(COMPETITIVE_GAP.body.trim().length).toBeGreaterThan(50);
  });
});

/*
 * 기각한 주장이 다시 기어들어오지 못하게 막는다.
 *
 * 13번 §3 이 조사 끝에 기각한 것들이다. 원출처가 없거나(사세 · 존 맨 · 램지),
 * 언론이 재계산한 값(BTS 56조원)이거나, 공식 문서로 확인 안 된 추정치(수수료 21%)다.
 *
 * 이런 것들은 검색하면 계속 나오기 때문에 다음 사람이 선의로 주워 온다.
 * 주석으로 "쓰지 마라" 를 적어 두는 것으로는 안 막힌다 — 기계가 막아야 한다.
 */
const REJECTED = [
  { text: '모든 알파벳의 꿈', why: '존 맨의 말로 도는데 원출처가 확인되지 않는다' },
  { text: '56조', why: 'BTS 경제효과 언론 재계산치. 원 보고서 수치가 아니다' },
  { text: '가장 과학적인 언어', why: '문자와 언어를 혼동한 말이다' },
  { text: '세계에서 가장 우수한 문자', why: '출처를 댈 수 없는 자화자찬' },
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (['.ts', '.tsx'].includes(extname(name))) out.push(full);
  }
  return out;
}

/*
 * 주석은 검사하지 않는다.
 *
 * 기각한 이유를 주석으로 남기는 것이 이 저장소의 방식이고(D-003),
 * 그 기록에는 기각한 문구가 그대로 인용된다. 주석까지 걸면 기록을 못 남긴다.
 * 화면에 렌더되는 것은 문자열과 JSX 텍스트뿐이므로 주석을 지우고 본다 —
 * whitelabel-check.mjs 가 같은 이유로 같은 일을 한다.
 */
function withoutComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

describe('기각한 주장이 화면에 돌아오지 않는다', () => {
  const files = [...sourceFiles('packages/content/src'), ...sourceFiles('apps/teacher/app')];

  for (const { text, why } of REJECTED) {
    it(`"${text}" 가 코드에 없다 — ${why}`, () => {
      const hits = files.filter((f) => withoutComments(readFileSync(f, 'utf8')).includes(text));
      expect(hits, `${hits.join(', ')} 에 남아 있다`).toEqual([]);
    });
  }
});
