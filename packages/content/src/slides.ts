import { ALL_UNITS } from './curriculum-all.js';
import { LESSON_PLANS } from './lesson-plan.js';

/*
 * 슬라이드 생성기 — 08번 문서 §2 "강사 슬라이드 · 이미지 시퀀스 16~20장".
 *
 * 이미지 생성을 기다리지 않는다.
 * 언어 수업 슬라이드에 들어가는 것은 대부분 글자다 — 목표문, 어휘, 문형, 대화문.
 * 그건 지도안과 커리큘럼에 이미 다 있다. 데이터에서 만들면 된다.
 *
 * 그림이 필요한 자리(어휘 카드 배경, 장면 설정)는 imageAssetId 를 달아 두고,
 * 관리자가 올리면 그 자리에만 들어간다. 없어도 슬라이드는 성립한다.
 *
 * 손으로 슬라이드를 짜지 않는 이유: 지도안이 바뀌면 슬라이드도 바뀌어야 하는데
 * 두 곳에 적으면 반드시 어긋난다. 30차시 × 18장이면 어긋난 걸 아무도 못 찾는다.
 */

export type SlideKind =
  | 'cover'
  | 'goal'
  | 'review'
  | 'dialogue'
  | 'form'
  | 'vocab'
  | 'drill'
  | 'roleplay'
  | 'expand'
  | 'wrap';

export interface Slide {
  no: number;
  kind: SlideKind;
  /** 화면 상단 라벨. eyebrow 로 렌더된다. */
  eyebrow: string;
  /** 큰 글자. 없을 수 있다 — 대화 슬라이드는 줄로만 이루어진다. */
  headline?: string;
  /** 본문 줄. 대화면 화자별 한 줄씩. */
  lines?: string[];
  /** 어휘 카드처럼 낱개로 보여줄 것. */
  chips?: string[];
  /** 그림이 있으면 좋은 자리. 없으면 글자만으로 성립한다. */
  imageAssetId?: string;
  /** 강사에게만 보이는 진행 지시. 학생 화면에는 나가지 않는다. */
  teacherNote?: string;
}

export interface SlideDeck {
  unitNo: number;
  title: string;
  goalStatement: string;
  slides: Slide[];
}

/** 대사 줄에서 화자 표시(— )를 떼어낸다. */
function stripDash(line: string): string {
  return line.replace(/^\s*—\s*/, '').trim();
}

/** 괄호 안 지시문은 강사용이다. 슬라이드에 띄우지 않는다. */
function isDirection(line: string): boolean {
  return /^\s*\(/.test(line);
}

export function buildDeck(unitNo: number): SlideDeck | null {
  const unit = ALL_UNITS.find((u) => u.unitNo === unitNo);
  if (!unit) return null;

  const plan = LESSON_PLANS.find((p) => p.unitNo === unitNo);
  const slides: Slide[] = [];
  const push = (s: Omit<Slide, 'no'>) => slides.push({ ...s, no: slides.length + 1 });

  // 1 · 표지
  push({
    kind: 'cover',
    eyebrow: `${unit.unitNo}차시`,
    headline: unit.title,
    imageAssetId: `unit-${unitNo}-cover`,
  });

  // 2 · 오늘의 목표. 종료 조건은 시간이 아니라 수행이다.
  push({
    kind: 'goal',
    eyebrow: '오늘 끝나면',
    headline: unit.goalStatement,
    imageAssetId: `unit-${unitNo}-goal`,
  });

  // 3 · 복습 — 지난 리포트에서 채워지므로 자리만 만든다.
  push({
    kind: 'review',
    eyebrow: '지난 시간',
    headline: '기억나요?',
    teacherNote: '지난 리포트의 표현이 여기 들어옵니다. 말로 대답하게 하세요',
  });

  // 4~5 · 모델 대화. 지도안의 model 블록에서 대사만 뽑는다.
  const model = plan?.blocks.find((b) => b.phase === 'model');
  const dialogue = (model?.say ?? []).filter((l) => l.trim().startsWith('—')).map(stripDash);

  if (dialogue.length > 0) {
    push({
      kind: 'dialogue',
      eyebrow: '들어 보세요',
      lines: dialogue,
      imageAssetId: `unit-${unitNo}-dialogue`,
      teacherNote: '정상 속도 → 70% → 끊어읽기. 강사가 직접 세 번 읽습니다',
    });
  }

  // 6~8 · 오늘의 문형. 하나에 한 장씩 — 한 화면에 두 개를 넣으면 둘 다 안 남는다.
  for (const form of unit.targetForms) {
    push({
      kind: 'form',
      eyebrow: '오늘 배울 것',
      headline: form,
      lines: dialogue.filter((d) => d.includes(form.replace(/^-|\/.*$/g, ''))).slice(0, 1),
      teacherNote: '설명 30초. 나머지는 반복입니다',
    });
  }

  // 9 · 어휘
  if (unit.targetVocab.length > 0) {
    push({
      kind: 'vocab',
      eyebrow: '오늘 단어',
      chips: unit.targetVocab,
      imageAssetId: `unit-${unitNo}-vocab`,
    });
  }

  // 10~12 · 드릴. 지도안의 반복 지시를 그대로 띄운다.
  const drill = plan?.blocks.find((b) => b.phase === 'drill');
  const drillLines = (drill?.say ?? []).filter((l) => !isDirection(l));

  for (let i = 0; i < drillLines.length; i += 3) {
    push({
      kind: 'drill',
      eyebrow: '따라 하세요',
      lines: drillLines.slice(i, i + 3),
      ...(drill?.studentOutput ? { teacherNote: `학생이 말할 것 · ${drill.studentOutput}` } : {}),
    });
  }

  // 13~15 · 롤플레이
  const roleplay = plan?.blocks.find((b) => b.phase === 'roleplay');
  if (roleplay) {
    push({
      kind: 'roleplay',
      eyebrow: '역할을 나눠요',
      lines: roleplay.say.filter((l) => !isDirection(l)).map(stripDash),
      imageAssetId: `unit-${unitNo}-roleplay`,
      ...(roleplay.ifStuck ? { teacherNote: `막히면 · ${roleplay.ifStuck}` } : {}),
    });
  }

  // 16 · 자유 확장
  const free = plan?.blocks.find((b) => b.phase === 'free');
  if (free) {
    push({
      kind: 'expand',
      eyebrow: '이제 ○○ 씨 이야기',
      lines: free.say.filter((l) => !isDirection(l)),
      teacherNote: '조사 오류를 고치지 않습니다. 발화가 이어지는 것이 먼저입니다',
    });
  }

  // 17 · 마무리
  push({
    kind: 'wrap',
    eyebrow: '오늘 배운 것',
    chips: unit.targetForms.length > 0 ? unit.targetForms : unit.targetVocab.slice(0, 3),
    teacherNote: '3분 리포트를 남기세요. 이게 다음 주 복습이 됩니다',
  });

  return { unitNo, title: unit.title, goalStatement: unit.goalStatement, slides };
}

export function deckSize(unitNo: number): number {
  return buildDeck(unitNo)?.slides.length ?? 0;
}

export const SLIDE_STATUS = {
  units: ALL_UNITS.filter((u) => buildDeck(u.unitNo) !== null).length,
  totalSlides: ALL_UNITS.reduce((sum, u) => sum + deckSize(u.unitNo), 0),
  note:
    '슬라이드는 지도안과 커리큘럼에서 생성된다. 이미지가 없어도 성립한다 — ' +
    '그림은 있으면 좋은 자리에만 들어간다.',
} as const;
