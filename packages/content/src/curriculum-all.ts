import { LEVEL1_UNITS, type CurriculumUnitDraft } from './curriculum.js';
import { LEVEL2_UNITS } from './curriculum-2.js';

/**
 * 전 급 커리큘럼. 차시 번호로 찾을 때 여기를 쓴다.
 *
 * 급별 파일을 따로 두는 이유는 검수 단위를 나누기 위해서다.
 * 조회는 한곳에서 해야 "이 차시가 어느 파일에 있더라" 를 매번 찾지 않는다.
 */
export const ALL_UNITS: readonly CurriculumUnitDraft[] = Object.freeze(
  [...LEVEL1_UNITS, ...LEVEL2_UNITS].sort((a, b) => a.unitNo - b.unitNo),
);

export function unitByNo(unitNo: number): CurriculumUnitDraft | null {
  return ALL_UNITS.find((u) => u.unitNo === unitNo) ?? null;
}

export const CURRICULUM_ALL_STATUS = {
  written: ALL_UNITS.length,
  target: 250,
  levels: { topik1: LEVEL1_UNITS.length, topik2: LEVEL2_UNITS.length },
} as const;
