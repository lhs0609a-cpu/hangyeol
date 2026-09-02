import { describe, expect, it } from 'vitest';
import {
  ALL_UNITS,
  CLASSROOM_ENGLISH,
  LESSON_FRAME,
  LESSON_PLANS,
  LEVEL1_UNITS,
  TRIAL_PACKS,
} from '@hangyeol/content';


/*
 * 콘텐츠는 데이터지만 규칙을 갖고 있다.
 * 그 규칙이 깨지면 커리큘럼 배열이 근거를 잃고, 지도안이 대본이 아니게 된다.
 * 사람이 손으로 채우는 데이터일수록 기계가 지켜야 한다.
 */

describe('커리큘럼 배열 — 08번 문서의 확정 순서', () => {
  it('차시 번호가 1부터 연속이다', () => {
    const nos = LEVEL1_UNITS.map((u) => u.unitNo);
    expect(nos).toEqual(Array.from({ length: nos.length }, (_, i) => i + 1));
  });

  it('주격(이/가)이 목적격(을/를)보다 먼저 나온다 — 습득 순서', () => {
    const subject = LEVEL1_UNITS.find((u) => u.targetForms.includes('이/가'))!;
    const object = LEVEL1_UNITS.find((u) => u.targetForms.includes('을/를'))!;
    expect(subject.unitNo).toBeLessThan(object.unitNo);
  });

  it('은/는 대조 용법은 1급에 넣지 않는다', () => {
    // 화제-대조 오류율이 39% 를 넘으므로 조기 도입은 실패한다.
    const has = LEVEL1_UNITS.some((u) => u.targetForms.some((f) => f.includes('은/는')));
    expect(has).toBe(false);
  });

  it('나선형 재등장이 앞 차시만 가리킨다', () => {
    for (const unit of LEVEL1_UNITS) {
      for (const from of unit.recycleFrom) {
        expect(from, `${unit.unitNo} → ${from}`).toBeLessThan(unit.unitNo);
      }
    }
  });

  it('모든 차시에 수행 가능한 목표문이 있다', () => {
    for (const unit of LEVEL1_UNITS) {
      // 종료 조건은 시간이 아니라 수행이다.
      // "말할 수 있다" · "쓰고 읽을 수 있다" 처럼 학생이 해내야 할 행동으로 끝나야 한다.
      expect(unit.goalStatement, `${unit.unitNo}차시`).toMatch(/수 있다$/);
    }
  });
});

describe('체험수업 팩 — 8~15분 구간이 전환율을 결정한다', () => {
  it('4종 전부 한글 이름 쓰기 구간을 갖는다', () => {
    for (const pack of TRIAL_PACKS) {
      const segment = pack.segments.find((s) => s.fromMin === 8 && s.toMin === 15);
      expect(segment, pack.track).toBeDefined();
      expect(segment!.title).toContain('이름');
    }
  });

  it('30분을 빈틈없이 채운다', () => {
    for (const pack of TRIAL_PACKS) {
      const sorted = [...pack.segments].sort((a, b) => a.fromMin - b.fromMin);
      expect(sorted[0]!.fromMin).toBe(0);
      expect(sorted[sorted.length - 1]!.toMin).toBe(30);
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i]!.fromMin, `${pack.track} 구간 사이가 비었다`).toBe(sorted[i - 1]!.toMin);
      }
    }
  });

  it('강사가 그대로 읽을 대사가 들어 있다', () => {
    for (const pack of TRIAL_PACKS) {
      for (const segment of pack.segments) {
        expect(segment.script.length, `${pack.track}/${segment.title}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('교실영어 — 08번 문서 §10', () => {
  it('250문장을 채웠다', () => {
    expect(CLASSROOM_ENGLISH.length).toBe(250);
  });

  it('id 가 유일하다', () => {
    const ids = CLASSROOM_ENGLISH.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('세 묶음이 전부 존재한다', () => {
    for (const bucket of ['student_says', 'teacher_says', 'grammar'] as const) {
      expect(CLASSROOM_ENGLISH.some((p) => p.bucket === bucket), bucket).toBe(true);
    }
  });
});

describe('지도안 — 요약이 아니라 대본이어야 한다', () => {
  it('50분 틀이 빈틈없이 이어진다', () => {
    expect(LESSON_FRAME[0]!.fromMin).toBe(0);
    expect(LESSON_FRAME[LESSON_FRAME.length - 1]!.toMin).toBe(50);
    for (let i = 1; i < LESSON_FRAME.length; i += 1) {
      expect(LESSON_FRAME[i]!.fromMin).toBe(LESSON_FRAME[i - 1]!.toMin);
    }
  });

  it('모든 지도안이 6단계를 전부 갖는다', () => {
    const phases = LESSON_FRAME.map((f) => f.phase);
    for (const plan of LESSON_PLANS) {
      expect(plan.blocks.map((b) => b.phase), `${plan.unitNo}차시`).toEqual(phases);
    }
  });

  it('모든 블록에 강사가 그대로 읽을 말이 있다', () => {
    // "핵심 표현을 도입한다" 같은 문장은 지도안이 아니다.
    // 무엇을 말할지 적혀 있어야 준비 시간이 0 이 된다.
    for (const plan of LESSON_PLANS) {
      for (const block of plan.blocks) {
        expect(block.say.length, `${plan.unitNo}차시 ${block.phase}`).toBeGreaterThan(0);
        for (const line of block.say) {
          expect(line.trim().length, `${plan.unitNo}차시 ${block.phase}`).toBeGreaterThan(1);
        }
      }
    }
  });

  it('학생이 말할 것이 지정돼 있다 — 없으면 강의가 된다', () => {
    for (const plan of LESSON_PLANS) {
      // 마무리(wrap)는 정리 구간이라 예외.
      const teaching = plan.blocks.filter((b) => b.phase !== 'wrap' && b.phase !== 'model');
      for (const block of teaching) {
        expect(block.studentOutput, `${plan.unitNo}차시 ${block.phase}`).toBeTruthy();
      }
    }
  });

  it('통과 판정 기준이 있다', () => {
    for (const plan of LESSON_PLANS) {
      expect(plan.exitTicket.length, `${plan.unitNo}차시`).toBeGreaterThan(0);
    }
  });

  it('강사가 흔히 하는 실수가 적혀 있다 — 판단할 여지를 남기지 않는다', () => {
    for (const plan of LESSON_PLANS) {
      expect(plan.teacherPitfalls.length, `${plan.unitNo}차시`).toBeGreaterThan(0);
    }
  });

  it('모국어별 주의사항이 최소 하나는 있다', () => {
    for (const plan of LESSON_PLANS) {
      expect(Object.keys(plan.l1Notes).length, `${plan.unitNo}차시`).toBeGreaterThan(0);
    }
  });

  it('지도안이 커리큘럼에 실재하는 차시를 가리킨다', () => {
    // 1급뿐 아니라 전 급을 본다. 지도안이 늘어나도 이 규칙은 그대로다.
    const unitNos = new Set(ALL_UNITS.map((u) => u.unitNo));
    for (const plan of LESSON_PLANS) {
      expect(unitNos.has(plan.unitNo), `${plan.unitNo}차시가 커리큘럼에 없다`).toBe(true);
    }
  });

  it('목표문이 커리큘럼과 일치한다', () => {
    for (const plan of LESSON_PLANS) {
      const unit = ALL_UNITS.find((u) => u.unitNo === plan.unitNo)!;
      expect(plan.goalStatement, `${plan.unitNo}차시`).toBe(unit.goalStatement);
    }
  });
});

describe('1급 30차시가 빠짐없이 있다', () => {
  it('커리큘럼의 모든 차시에 지도안이 있다', () => {
    // 하나라도 비면 강사가 그 주에 스스로 준비해야 한다.
    // 그 순간 "교재 없이는 감도 안 온다"가 깨진다.
    const planned = new Set(LESSON_PLANS.map((p) => p.unitNo));
    const missing = LEVEL1_UNITS.filter((u) => !planned.has(u.unitNo)).map((u) => u.unitNo);
    expect(missing, `지도안 없는 차시: ${missing.join(', ')}`).toEqual([]);
  });

  it('지도안이 차시 번호 순으로 정렬돼 있다', () => {
    const nos = LESSON_PLANS.map((p) => p.unitNo);
    expect(nos).toEqual([...nos].sort((a, b) => a - b));
  });

  it('차시 번호가 중복되지 않는다', () => {
    const nos = LESSON_PLANS.map((p) => p.unitNo);
    expect(new Set(nos).size).toBe(nos.length);
  });

  it('드릴 구간에 반복 지시가 들어 있다', () => {
    // 08번 §2: 설명 30초 / 반복 9분.
    // 드릴에서 반복을 시키지 않으면 강의가 된다.
    for (const plan of LESSON_PLANS) {
      const drill = plan.blocks.find((b) => b.phase === 'drill')!;
      const text = [...drill.say, ...(drill.do ?? []), drill.studentOutput ?? ''].join(' ');
      expect(text, `${plan.unitNo}차시 드릴에 반복 지시가 없다`).toMatch(/따라 하세요|더요|번|반복/);
    }
  });

  it('자유 확장 구간에서 학생이 자기 얘기를 한다', () => {
    for (const plan of LESSON_PLANS) {
      const free = plan.blocks.find((b) => b.phase === 'free')!;
      expect(free.studentOutput, `${plan.unitNo}차시`).toBeTruthy();
    }
  });

  it('마무리에서 3분 리포트를 남기게 한다', () => {
    // 리포트가 없으면 다음 주 복습 슬라이드가 비고, SRS 도 적립되지 않는다.
    for (const plan of LESSON_PLANS) {
      const wrap = plan.blocks.find((b) => b.phase === 'wrap')!;
      const text = (wrap.do ?? []).join(' ');
      expect(text, `${plan.unitNo}차시 마무리에 리포트 지시가 없다`).toMatch(/리포트/);
    }
  });
});
