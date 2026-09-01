import { LESSON_PLANS } from './lesson-plan.js';
import { PRONUNCIATION_ITEMS } from './pronunciation.js';
import { TRIAL_PACKS } from './trial-packs.js';

/*
 * 이미지 자산 레지스트리.
 *
 * 만들어야 할 이미지가 어디에 몇 장 필요한지, 그리고 그것을 생성하기 위한
 * 프롬프트를 한곳에 모은다. 관리자가 프롬프트를 복사해 이미지를 만들고
 * 올리면 그 자리에 자동으로 들어간다.
 *
 * 슬라이드 목록을 손으로 적지 않고 지도안에서 유도하는 이유:
 * 지도안이 바뀌면 슬라이드도 바뀌어야 하는데, 두 곳에 적으면 반드시 어긋난다.
 */

/**
 * 06번 문서의 디자인 시스템을 프롬프트로 옮긴 것.
 *
 * 모든 이미지에 이 문단이 앞에 붙는다. 이게 없으면 차시마다 톤이 달라지고,
 * 그 순간 교재가 아니라 짜깁기가 된다.
 */
export const STYLE_PREFIX = [
  'Flat vector illustration for a Korean-language teaching slide.',
  'Style: minimal, editorial, calm. Built from clean strokes — no gradients, no drop shadows, no 3D, no glossy effects.',
  'Palette strictly limited to: deep ink #14161C, muted slate #3B4254, warm paper #FAFAFB, indigo accent #26418F, jade accent #1E7A5F, ochre accent #A9761A.',
  'Generous white space. One idea per image. No decorative clutter.',
  'IMPORTANT: render no text, no letters, no numbers, and no speech bubbles with writing. Any Korean text is added separately by the app.',
  '16:9 aspect ratio, 1600x900.',
].join(' ');

export type ImageSlot =
  | 'unit_cover'
  | 'unit_goal'
  | 'unit_vocab'
  | 'unit_dialogue'
  | 'unit_roleplay'
  | 'pronunciation_diagram'
  | 'trial_cover';

export interface ImageAsset {
  /** 안정적인 식별자. 업로드된 파일이 이 id 로 저장된다. */
  id: string;
  slot: ImageSlot;
  /** 이 이미지가 실제로 어디에 뜨는가. */
  usedAt: string;
  /** 이미지 생성 프롬프트. STYLE_PREFIX 가 앞에 붙는다. */
  prompt: string;
  /** 슬라이드가 아닌 것(단면도 등)은 비율이 다르다. */
  aspect: '16:9' | '4:3' | '1:1';
  unitNo?: number;
}

const slideAspect = '16:9' as const;

/** 지도안에서 슬라이드 사양을 유도한다. 한 차시당 5장. */
function unitAssets(): ImageAsset[] {
  const out: ImageAsset[] = [];

  for (const plan of LESSON_PLANS) {
    const model = plan.blocks.find((b) => b.phase === 'model');
    const roleplay = plan.blocks.find((b) => b.phase === 'roleplay');

    out.push({
      id: `unit-${plan.unitNo}-cover`,
      slot: 'unit_cover',
      usedAt: `${plan.unitNo}차시 표지`,
      aspect: slideAspect,
      unitNo: plan.unitNo,
      prompt:
        `A single quiet scene that sets up the lesson theme "${plan.title}". ` +
        `Wide composition with the subject slightly off-center, lots of empty paper-toned space on the left third. ` +
        `Mood: inviting, unhurried. No people's faces in detail — figures may be simplified silhouettes.`,
    });

    out.push({
      id: `unit-${plan.unitNo}-goal`,
      slot: 'unit_goal',
      usedAt: `${plan.unitNo}차시 목표 제시`,
      aspect: slideAspect,
      unitNo: plan.unitNo,
      prompt:
        `An illustration of the moment a learner accomplishes this: "${plan.goalStatement}". ` +
        `Show the situation, not a classroom. One learner figure and at most one other person. ` +
        `The indigo accent marks the learner. Everything else stays in ink and slate.`,
    });

    out.push({
      id: `unit-${plan.unitNo}-vocab`,
      slot: 'unit_vocab',
      usedAt: `${plan.unitNo}차시 어휘 카드 배경`,
      aspect: slideAspect,
      unitNo: plan.unitNo,
      prompt:
        `A calm arrangement of 3 to 5 distinct objects related to "${plan.title}", ` +
        `evenly spaced on a plain paper-toned surface, viewed from directly above. ` +
        `Each object clearly separated so a label can be placed beside it. Objects must be unmistakable at a glance.`,
    });

    if (model) {
      out.push({
        id: `unit-${plan.unitNo}-dialogue`,
        slot: 'unit_dialogue',
        usedAt: `${plan.unitNo}차시 모델 대화 배경`,
        aspect: slideAspect,
        unitNo: plan.unitNo,
        prompt:
          `The setting where this conversation happens, drawn as an empty stage with no people: ` +
          `"${(model.say[1] ?? plan.title).replace(/^\s*—\s*/, '')}". ` +
          `Two clear standing positions are implied by the composition so speaker figures can be overlaid later. ` +
          `Keep the center third uncluttered.`,
      });
    }

    if (roleplay) {
      out.push({
        id: `unit-${plan.unitNo}-roleplay`,
        slot: 'unit_roleplay',
        usedAt: `${plan.unitNo}차시 롤플레이 배경`,
        aspect: slideAspect,
        unitNo: plan.unitNo,
        prompt:
          `The same setting as the dialogue slide for "${plan.title}", but from the learner's point of view — ` +
          `as if the learner is standing in the scene about to speak. ` +
          `The other role's position is empty and clearly marked by composition. Jade accent on that empty position.`,
      });
    }
  }

  return out;
}

/** 발음 단면도 — 08번 §5. 개인 강사가 절대 못 만드는 자산이다. */
function pronunciationAssets(): ImageAsset[] {
  const diagrams: Record<string, string> = {
    'eo-o':
      'Two side-by-side cross-sections of a human mouth seen from the side, showing lip rounding. ' +
      'Left: lips relaxed and unrounded. Right: lips pushed forward and rounded. ' +
      'The difference in lip shape must be obvious at a glance. Indigo accent on the lips only.',
    eu:
      'A side cross-section of the mouth showing tongue position for a high back unrounded vowel. ' +
      'Tongue pulled back and raised, lips flat and spread. A faint ghosted outline shows a rounded-lip position for contrast.',
    g3:
      'Three side-by-side illustrations of a hand holding a thin sheet of paper in front of a mouth. ' +
      'Left: the paper barely moves. Middle: the paper bends strongly outward. Right: the paper is completely still. ' +
      'Motion shown with simple stroke arcs, no motion blur.',
    coda:
      'Three side cross-sections of the mouth showing where the tongue or lips stop the airflow at the end of a syllable: ' +
      'back of the tongue against the soft palate, tip of the tongue against the ridge behind the teeth, and lips pressed together. ' +
      'A small ochre marker sits at each stopping point.',
    linking:
      'A simple audio waveform drawn as a clean stroke, with a vertical divider showing where a written syllable boundary sits ' +
      'and a second divider showing where the spoken boundary actually falls. The two dividers are clearly offset from each other.',
    nasal:
      'A side cross-section of the head showing airflow rerouting from the mouth up into the nasal cavity, ' +
      'drawn as a single continuous stroke path. Jade accent on the nasal path only.',
  };

  return PRONUNCIATION_ITEMS.map((item) => ({
    id: `pron-${item.id}`,
    slot: 'pronunciation_diagram' as const,
    usedAt: `발음 시트 — ${item.title}`,
    aspect: '4:3' as const,
    prompt:
      diagrams[item.id] ??
      `A clear anatomical side-view diagram illustrating: ${item.whyHard}. Single continuous strokes, no shading.`,
  }));
}

/** 체험수업 팩 표지 — 08번 §8. 전환율이 걸린 자산이다. */
function trialAssets(): ImageAsset[] {
  const scenes: Record<string, string> = {
    kcontent: 'A phone lying flat on a desk with a paused video on screen, headphones coiled beside it.',
    travel: 'A small counter at a street food stall, seen from the customer side, with one empty stool.',
    eps: 'A tidy workbench with gloves and a helmet set down neatly, morning light.',
    topik: 'A desk with an open notebook, a pencil, and a single sheet of paper, viewed from above.',
  };

  return TRIAL_PACKS.map((pack) => ({
    id: `trial-${pack.track}`,
    slot: 'trial_cover' as const,
    usedAt: `체험수업 팩 — ${pack.label}`,
    aspect: '16:9' as const,
    prompt:
      `${scenes[pack.track] ?? pack.label} ` +
      `The scene should feel like the moment just before something begins. No people. ` +
      `Left third kept empty for a title placed by the app.`,
  }));
}

export const IMAGE_ASSETS: readonly ImageAsset[] = Object.freeze([
  ...unitAssets(),
  ...pronunciationAssets(),
  ...trialAssets(),
]);

/** 생성기에 그대로 붙여 넣을 수 있는 완성 프롬프트. */
export function fullPrompt(asset: ImageAsset): string {
  const aspect =
    asset.aspect === '16:9'
      ? '16:9 aspect ratio, 1600x900.'
      : asset.aspect === '4:3'
        ? '4:3 aspect ratio, 1200x900.'
        : '1:1 aspect ratio, 1200x1200.';

  return `${STYLE_PREFIX.replace('16:9 aspect ratio, 1600x900.', aspect)}\n\n${asset.prompt}`;
}

/** R2 저장 키. 업로드된 파일이 여기로 간다. */
export function imageStorageKey(assetId: string): string {
  return `img/${assetId}.webp`;
}

export function assetsByUnit(unitNo: number): ImageAsset[] {
  return IMAGE_ASSETS.filter((a) => a.unitNo === unitNo);
}

export const IMAGE_ASSET_STATUS = {
  total: IMAGE_ASSETS.length,
  slides: IMAGE_ASSETS.filter((a) => a.slot.startsWith('unit_')).length,
  diagrams: IMAGE_ASSETS.filter((a) => a.slot === 'pronunciation_diagram').length,
  trialCovers: IMAGE_ASSETS.filter((a) => a.slot === 'trial_cover').length,
  note:
    '프롬프트만 준비돼 있다. 실제 이미지는 관리자가 생성해 올린다. ' +
    '올리면 그 자리에 자동으로 들어간다 — 코드를 고칠 필요가 없다.',
} as const;
