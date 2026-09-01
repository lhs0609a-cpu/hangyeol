import { CLASSROOM_ENGLISH_STATUS } from './classroom-english.js';
import { CURRICULUM_STATUS } from './curriculum.js';
import { LESSON_PLAN_STATUS } from './lesson-plan.js';
import { PRONUNCIATION_STATUS } from './pronunciation.js';
import { TRIAL_PACK_STATUS } from './trial-packs.js';

/**
 * 콘텐츠 제작 현황.
 *
 * 관리자 화면이 이 값을 그대로 보여준다.
 * "다 만들었다"고 착각하지 않으려면 목표 대비 실제를 항상 눈에 두어야 한다.
 *
 * 오디오 항목이 없는 이유: 수업은 강사가 실시간으로 한다.
 * 우리가 음원을 만들면 그건 파파고와 같은 것을 파는 셈이고,
 * 이 플랫폼을 쓸 이유가 사라진다. 결정 기록은 docs/12 를 볼 것.
 */
export const CONTENT_STATUS = {
  lessonPlans: LESSON_PLAN_STATUS,
  curriculum: CURRICULUM_STATUS,
  classroomEnglish: CLASSROOM_ENGLISH_STATUS,
  pronunciation: PRONUNCIATION_STATUS,
  trialPacks: TRIAL_PACK_STATUS,
} as const;
