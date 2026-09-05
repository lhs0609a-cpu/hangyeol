import { describe, expect, it } from 'vitest';
import {
  BUILD_STATUS,
  MARKET_HEADLINE,
  MARKET_SIZE,
  TEACHER_PAIN,
  VALUE_PROPS,
  LESSON_PLANS,
} from '@hangyeol/content';

/*
 * 랜딩 숫자 검사.
 *
 * 마케팅 숫자는 반드시 낡는다. 낡는 것 자체는 막을 수 없지만,
 * 출처 없는 숫자가 화면에 오르는 것은 막을 수 있다.
 * 그게 이 검사의 전부다.
 */

describe('시장 근거 — 출처 없는 숫자를 화면에 올리지 않는다', () => {
  const all = [...MARKET_HEADLINE, ...MARKET_SIZE];

  it('모든 숫자에 출처와 링크가 있다', () => {
    for (const f of all) {
      expect(f.source, f.label).toBeTruthy();
      expect(f.sourceUrl, f.label).toMatch(/^https:\/\//);
    }
  });

  it('확인 시점이 기록되어 있다', () => {
    // 숫자가 언제 것인지와, 우리가 언제 확인했는지는 다르다.
    for (const f of all) {
      expect(f.checkedOn, f.label).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('라벨이 중복되지 않는다 — 같은 숫자를 두 번 보이지 않는다', () => {
    const labels = all.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('랜딩 카피', () => {
  it('강사의 문제와 우리가 주는 것이 짝을 이룬다', () => {
    // 문제만 늘어놓거나 기능만 늘어놓으면 어느 쪽도 안 읽힌다.
    expect(TEACHER_PAIN.length).toBe(VALUE_PROPS.length);
  });

  it('각 가치 제안에 측정 가능한 값이 붙어 있다', () => {
    for (const v of VALUE_PROPS) {
      expect(v.metric, v.title).toBeTruthy();
    }
  });
});

describe('공개 현황은 실제 콘텐츠와 어긋나지 않는다', () => {
  it('랜딩이 말하는 차시 수가 실제 지도안 수와 같다', () => {
    // 랜딩에 70차시라고 써 놓고 실제로 40개만 있으면 첫 수업에서 들킨다.
    expect(BUILD_STATUS.unitsWritten).toBe(LESSON_PLANS.length);
  });

  it('목표 차시를 넘겨 말하지 않는다', () => {
    expect(BUILD_STATUS.unitsWritten).toBeLessThanOrEqual(BUILD_STATUS.unitsTarget);
  });
});
