import { FIRST_STEPS, FIRST_STEPS_VERSION } from '@hangyeol/content';

export const PROGRESS_KEY = 'samat-first-steps-v1';
export interface WorkbookProgress {
  version: number;
  completed: string[];
  lastLesson: string;
  language: 'en' | 'ko';
  goal: 'foundation' | 'travel' | 'connection';
  dailyMinutes: 10 | 15;
  started: boolean;
  notes: Record<string, string>;
}
export const EMPTY_PROGRESS: WorkbookProgress = {
  version: FIRST_STEPS_VERSION, completed: [], lastLesson: FIRST_STEPS[0]!.id,
  language: 'en', goal: 'foundation', dailyMinutes: 10, started: false, notes: {},
};

/** Browser storage is untrusted and may contain an older workbook's data. */
export function readProgress(raw: string | null): WorkbookProgress {
  if (!raw) return { ...EMPTY_PROGRESS, completed: [], notes: {} };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...EMPTY_PROGRESS, completed: [], notes: {} };
    const v = value as Record<string, unknown>;
    if (v.version !== FIRST_STEPS_VERSION) return { ...EMPTY_PROGRESS, completed: [], notes: {} };
    const ids = new Set(FIRST_STEPS.map((lesson) => lesson.id));
    const completed = Array.isArray(v.completed) ? [...new Set(v.completed.filter((id): id is string => typeof id === 'string' && ids.has(id)))] : [];
    const notes: Record<string, string> = {};
    if (v.notes && typeof v.notes === 'object') for (const [id, note] of Object.entries(v.notes)) {
      if (ids.has(id) && typeof note === 'string') notes[id] = note.slice(0, 2000);
    }
    return { ...EMPTY_PROGRESS, completed, notes,
      lastLesson: typeof v.lastLesson === 'string' && ids.has(v.lastLesson) ? v.lastLesson : EMPTY_PROGRESS.lastLesson,
      language: v.language === 'ko' ? 'ko' : 'en',
      goal: v.goal === 'travel' || v.goal === 'connection' ? v.goal : 'foundation',
      dailyMinutes: v.dailyMinutes === 15 ? 15 : 10,
      started: v.started === true,
    };
  } catch { return { ...EMPTY_PROGRESS, completed: [], notes: {} }; }
}
