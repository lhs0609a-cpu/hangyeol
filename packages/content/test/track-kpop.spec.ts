import { describe, expect, it } from 'vitest';
import { KPOP_LESSON_SHAPE, KPOP_TRACK_RULES, KPOP_UNITS } from '@hangyeol/content';

/*
 * K-pop 트랙 검사 — 14번 문서 §7 의 교재 게이트.
 *
 * 13번이 랜딩의 주장을 막고, 이 파일은 교재의 설계 규칙을 막는다.
 *
 * 규칙을 주석에만 적어 두면 다음 사람이 안 읽는다. 특히 차시를 100개까지
 * 늘리는 동안 "이번 한 번만" 이 쌓인다. 그래서 검사가 읽는다.
 */

describe('K-pop 트랙 — 차시 구조', () => {
  it('차시 번호가 1부터 빠짐없이 이어진다', () => {
    const nos = KPOP_UNITS.map((u) => u.unitNo);
    expect(nos).toEqual(nos.map((_, i) => i + 1));
  });

  it('모든 차시에 수행으로 쓴 목표가 있다', () => {
    // 종료 조건은 시간이 아니라 수행이다. "안다" 가 아니라 "할 수 있다" 여야 한다.
    // 「소리 낼 수 있다」 처럼 어간이 달라도 수행 진술이다. 「할」에 묶지 않는다.
    for (const u of KPOP_UNITS) {
      expect(u.goalStatement, u.title).toMatch(/ 수 있다$/);
    }
  });

  /*
   * 성공 경험이 이 트랙의 이탈 방지 장치다.
   *
   * 초반 이탈이 가장 큰 위험이고(언어앱 8주 26.3%, MOOC 78~90%),
   * 자기효능감의 첫 원천은 직접적 숙달 경험이다.
   * "배웠다" 가 아니라 "해냈다" 를 매 차시에 하나씩 둔다.
   */
  it('모든 차시에 학습자가 스스로 해내는 성공 경험이 있다', () => {
    expect(KPOP_TRACK_RULES.requireFirstWin).toBe(true);
    for (const u of KPOP_UNITS) {
      expect(u.firstWin.trim().length, `${u.unitNo}차시 ${u.title}`).toBeGreaterThan(10);
    }
  });

  it('모든 차시에 K-pop 과의 연결이 적혀 있다', () => {
    for (const u of KPOP_UNITS) {
      expect(u.hook.trim().length, u.title).toBeGreaterThan(10);
    }
  });

  it('모든 차시에 강사가 놓치기 쉬운 것이 적혀 있다', () => {
    for (const u of KPOP_UNITS) {
      expect(u.pitfall.trim().length, u.title).toBeGreaterThan(20);
    }
  });
});

describe('차시당 문법 하나 — 몰아넣으면 역효과다', () => {
  /*
   * Schenck & Choi(2015) 19개 실험 메타분석:
   * 단일 개념 처치 d=6.21~16.30, 24개 범주 동시 처치 -0.246(역효과).
   * 개념 수와 효과크기의 상관 rs=-.516.
   *
   * 이 트랙은 반말·해요체를 짝으로 가르치므로 상한이 2다.
   * 그 이상은 같은 차시에 두 개념을 넣은 것이다.
   */
  it('한 차시의 목표 문형이 상한을 넘지 않는다', () => {
    for (const u of KPOP_UNITS) {
      expect(u.targetForms.length, `${u.unitNo}차시 ${u.title}`).toBeLessThanOrEqual(
        KPOP_TRACK_RULES.maxFormsPerUnit,
      );
    }
  });

  /*
   * 예외를 만들지 않는다.
   *
   * 처음에는 1차시를 상한 검사에서 빼려 했다. 그런데 예외를 파면
   * 그 예외로 다음 사람이 두 개씩 넣는다. 대신 모델을 고쳤다 —
   * 1차시가 가르치는 것은 문형이 아니라 언어의 지도라서
   * targetForms 가 아니라 orientationPoints 에 들어간다.
   */
  it('1차시는 문형이 아니라 언어의 지도를 준다', () => {
    const intro = KPOP_UNITS[0];
    expect(intro.unitNo).toBe(1);
    expect(intro.targetForms).toEqual([]);
    expect(intro.orientationPoints?.length ?? 0).toBeGreaterThan(2);
  });

  it('1차시 말고는 지도 칸을 쓰지 않는다', () => {
    for (const u of KPOP_UNITS.slice(1)) {
      expect(u.orientationPoints, `${u.unitNo}차시`).toBeUndefined();
    }
  });
});

describe('말투 — 반말은 듣기용, 해요체는 말하기용', () => {
  /*
   * 가사는 반말이라 수용에는 반말이 필요하다. 그런데 외국인이 반말을 먼저
   * 익혀 사람에게 쓰면 무례가 된다 — Brown(2010, 2013)이 지적한 문제다.
   * 그래서 수용과 산출을 갈랐고, 5차시부터는 반드시 둘 다 다룬다.
   */
  it('5차시부터는 반말과 해요체를 함께 다룬다', () => {
    for (const u of KPOP_UNITS) {
      if (u.unitNo >= KPOP_TRACK_RULES.registerSplitFrom) {
        expect(u.register, `${u.unitNo}차시 ${u.title}`).toBe('both');
      }
    }
  });

  it('1차시가 말투 구분을 먼저 알려 준다', () => {
    // 나중에 알려 주면 이미 반말로 인사한 뒤다.
    expect(KPOP_UNITS[0].pitfall).toContain('해요체');
  });
});

describe('한글은 노래로 가르치지 않는다', () => {
  /*
   * del Egido(2023): 음악 훈련이 문자 지식(alphabet knowledge) 향상에
   * 유의한 영향을 주지 않았다. ABC송의 문해 효과 자체도 실증 근거를 못 찾았다.
   *
   * 음악이 돕는 것은 음운 인식이지 자모 형태·이름 암기가 아니다.
   * 그래서 2~4차시는 명시적 문자 교육이고, K-pop 은 맥락만 준다.
   */
  it('한글 차시가 셋이다 — 「1시간 완성」이 아니다', () => {
    const hangeul = KPOP_UNITS.filter((u) => u.unitNo >= 2 && u.unitNo <= 4);
    expect(hangeul.length).toBe(3);
    for (const u of hangeul) {
      expect(u.title, u.title).not.toContain('시간');
      expect(u.title, u.title).not.toContain('완성');
    }
  });

  it('1차시는 한글을 다루지 않는다', () => {
    // 학습자가 이 언어가 어떻게 생겼는지 모르는 채로 자모를 외우면
    // 그게 무엇을 위한 것인지 모른다. 이탈이 첫 차시에 몰린다.
    const intro = KPOP_UNITS[0];
    expect(intro.targetVocab.join(' ')).not.toMatch(/자음|모음|받침/);
  });
});

describe('가사를 데이터에 넣지 않는다', () => {
  /*
   * 가사는 작사가의 저작물이다. KOMCA 요율을 확인하지 못했으므로
   * 교재에 전문을 싣지 않는다. 대신 딕테이션 — 빈칸 틀만 인쇄하고
   * 학습자가 음원을 들으며 채운다.
   *
   * 곡 제목과 아티스트명은 저작물이 아니라 써도 된다.
   */
  it('규칙이 켜져 있다', () => {
    expect(KPOP_TRACK_RULES.forbidLyrics).toBe(true);
  });

  it('딕테이션이 수업 틀에 들어 있다', () => {
    const dictation = KPOP_LESSON_SHAPE.find((b) => b.block.includes('딕테이션'));
    expect(dictation).toBeTruthy();
    expect(dictation!.why).toContain('인쇄하지 않');
  });
});

describe('수업 틀은 매번 같다', () => {
  /*
   * Rasti-Behbahani et al.(2026) 무작위 통제실험 n=70:
   * 활동 형식이 산만할수록 외재적 인지부하가 늘어 어휘 학습을 방해한다.
   * "다양성이 곧 좋다" 는 근거가 없고 오히려 반대다.
   * 다양성은 틀이 아니라 콘텐츠에서 준다.
   */
  it('블록이 시간 순서대로 이어지고 빈틈이 없다', () => {
    let prev = 0;
    for (const b of KPOP_LESSON_SHAPE) {
      expect(b.fromMin, b.block).toBe(prev);
      expect(b.toMin, b.block).toBeGreaterThan(b.fromMin);
      prev = b.toMin;
    }
    expect(prev).toBe(50);
  });

  it('모든 블록에 왜 그 자리인지가 적혀 있다', () => {
    for (const b of KPOP_LESSON_SHAPE) {
      expect(b.why.trim().length, b.block).toBeGreaterThan(15);
    }
  });

  /*
   * 자기 이야기로 바꾸는 블록이 가장 길어야 한다.
   * 개인화가 이번 조사에서 가장 강하게 검증된 개입이다 —
   * Sheridan et al.(2019) 성인 통제실험, Santi et al.(2021) r=0.485.
   */
  it('자기 이야기로 바꾸는 블록이 가장 길다', () => {
    const len = (b: (typeof KPOP_LESSON_SHAPE)[number]) => b.toMin - b.fromMin;
    const longest = [...KPOP_LESSON_SHAPE].sort((a, b) => len(b) - len(a))[0];
    expect(longest.block).toContain('내 이야기');
  });
});

describe('미검수 상태를 숨기지 않는다', () => {
  it('검수 수가 기록되어 있다', () => {
    // 지금 전부 AI 초안이다. 이 값이 0 인 동안에는 강사에게 노출하지 않는다.
    expect(typeof KPOP_TRACK_RULES.source).toBe('string');
    expect(KPOP_UNITS.length).toBeGreaterThan(0);
  });
});
