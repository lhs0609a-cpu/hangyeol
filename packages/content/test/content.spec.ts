import { describe, expect, it } from 'vitest';
import {
  buildTokenManifest,
  CLASSROOM_ENGLISH,
  CONTEXTS,
  CONTRASTS,
  FLUENCY_TOPICS,
  INITIAL_QUIZ_STATE,
  LEVEL1_UNITS,
  matchNode,
  pickNext,
  SCENARIOS,
  TALKER_COUNT,
  TRIAL_PACKS,
  type QuizState,
} from '@hangyeol/content';

/*
 * 콘텐츠는 데이터지만 규칙을 갖고 있다.
 * 그 규칙이 깨지면 HVPT 가 HVPT 가 아니게 되고, 커리큘럼 배열이 근거를 잃는다.
 * 사람이 손으로 채우는 데이터일수록 기계가 지켜야 한다.
 */

describe('HVPT 음원 매니페스트 — 08번 문서 §3 필수 3요건', () => {
  const manifest = buildTokenManifest();

  it('화자 8명 × 맥락 4종을 빠짐없이 만든다', () => {
    for (const contrast of CONTRASTS) {
      for (const token of contrast.tokens) {
        for (let talker = 0; talker < TALKER_COUNT; talker += 1) {
          for (const context of CONTEXTS) {
            const hit = manifest.find(
              (m) =>
                m.contrastId === contrast.id &&
                m.token === token &&
                m.talkerIdx === talker &&
                m.context === context,
            );
            expect(hit, `${contrast.id}/${token}/t${talker}/${context}`).toBeDefined();
          }
        }
      }
    }
  });

  it('audioKey 가 전부 유일하다 — 겹치면 덮어써진다', () => {
    const keys = manifest.map((m) => m.audioKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('08번 문서의 추정치(약 416개)와 맞는다', () => {
    expect(manifest.length).toBe(416);
  });

  it('맥락별 발화문이 비어 있지 않다', () => {
    for (const m of manifest) {
      expect(m.utterance.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('HVPT 출제기 — 동일 화자 연속 2회 금지', () => {
  const pool = buildTokenManifest().filter((t) => t.contrastId === 'g3');

  it('직전 화자를 다시 내지 않는다', () => {
    let state: QuizState = INITIAL_QUIZ_STATE;
    let previous = -1;

    for (let i = 0; i < 60; i += 1) {
      const next = pickNext(pool, state);
      expect(next.spec.talkerIdx).not.toBe(previous);
      previous = next.spec.talkerIdx;
      state = next.state;
    }
  });

  it('세션이 진행되면 화자 8명이 전원 등장한다', () => {
    let state: QuizState = INITIAL_QUIZ_STATE;
    for (let i = 0; i < 40; i += 1) {
      state = pickNext(pool, state).state;
    }
    expect(new Set(state.usedTalkers).size).toBe(TALKER_COUNT);
  });

  it('빈 풀은 조용히 넘어가지 않고 터뜨린다', () => {
    expect(() => pickNext([], INITIAL_QUIZ_STATE)).toThrow(/empty/);
  });
});

describe('시나리오 판정 — 1차 룰 매칭이 90% 를 처리해야 한다', () => {
  const cafe = SCENARIOS.find((s) => s.unitNo === 15)!;
  const n1 = cafe.nodes.find((n) => n.id === 'n1')!;

  it('기대 표현이 들어 있으면 다음 노드로 간다', () => {
    expect(matchNode(n1, '아메리카노 주세요')).toEqual({ next: 'n2', matched: true });
  });

  it('공백 차이를 흡수한다', () => {
    expect(matchNode(n1, '아 메 리 카 노 주세요').matched).toBe(true);
  });

  it('못 알아들으면 재시도 노드로 보낸다 — 대화가 끊기지 않는다', () => {
    expect(matchNode(n1, '음...')).toEqual({ next: 'n1_retry', matched: false });
  });

  it('모든 노드에 fallback 이 있거나 종료 노드다', () => {
    for (const s of SCENARIOS) {
      for (const node of s.nodes) {
        if (node.expect.length === 0) continue; // 종료 노드
        expect(
          node.expect.some((e) => e.kind === 'fallback'),
          `${s.unitNo}/${node.id} 에 fallback 이 없다`,
        ).toBe(true);
      }
    }
  });

  it('모든 next 가 실재하는 노드를 가리킨다', () => {
    for (const s of SCENARIOS) {
      const ids = new Set(s.nodes.map((n) => n.id));
      for (const node of s.nodes) {
        for (const rule of node.expect) {
          expect(ids.has(rule.next), `${s.unitNo}/${node.id} → ${rule.next}`).toBe(true);
        }
      }
    }
  });
});

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

describe('4·3·2 주제 — 아는 것만 쓴다', () => {
  it('쓸 표현이 비어 있는 주제가 없다', () => {
    for (const topic of FLUENCY_TOPICS) {
      expect(topic.useExpressions.length, topic.prompt).toBeGreaterThan(0);
    }
  });

  it('id 가 유일하다', () => {
    const ids = FLUENCY_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
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
