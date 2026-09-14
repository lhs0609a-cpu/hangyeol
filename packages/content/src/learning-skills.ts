/** Student-safe labels; no teacher plans or diagnosis rules are imported here. */
export const SKILLS = ['reading', 'meaning', 'listening', 'form', 'speaking', 'interaction'] as const;
export type LearningSkill = typeof SKILLS[number];
export const SKILL_LABELS: Record<LearningSkill, string> = {
  reading: '읽기·소리', meaning: '어휘·뜻', listening: '듣기·이해', form: '문장 만들기', speaking: '혼자 말하기', interaction: '질문·연결',
};
