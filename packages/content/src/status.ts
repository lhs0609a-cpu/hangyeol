import { CLASSROOM_ENGLISH_STATUS } from './classroom-english.js';
import { CURRICULUM_STATUS } from './curriculum.js';
import { HVPT_STATUS } from './hvpt.js';
import { SCENARIO_STATUS } from './scenarios.js';
import { FLUENCY_STATUS } from './fluency.js';
import { PRONUNCIATION_STATUS } from './pronunciation.js';
import { TRIAL_PACK_STATUS } from './trial-packs.js';
import { LISTENING_STATUS } from './listening.js';

/**
 * 콘텐츠 제작 현황.
 *
 * 관리자 화면이 이 값을 그대로 보여준다.
 * "다 만들었다"고 착각하지 않으려면 목표 대비 실제를 항상 눈에 두어야 한다.
 * 특히 audio 는 코드로 만들 수 없다 — 녹음 또는 TTS 배치가 필요하다.
 */
export const CONTENT_STATUS = {
  curriculum: CURRICULUM_STATUS,
  classroomEnglish: CLASSROOM_ENGLISH_STATUS,
  hvpt: HVPT_STATUS,
  scenarios: SCENARIO_STATUS,
  fluency: FLUENCY_STATUS,
  pronunciation: PRONUNCIATION_STATUS,
  trialPacks: TRIAL_PACK_STATUS,
  listening: LISTENING_STATUS,
} as const;

/** 오디오 자산은 하나도 없다. 이 값이 0 인 동안은 HVPT·다청이 실제로 돌지 않는다. */
export const AUDIO_ASSETS_READY = 0;
