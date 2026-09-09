/** Placement applies only before the first unit; retests never reset progress. */
export function nextUnitNo(current: number, outcome?: string | null, levelCode?: string | null): number {
  if (current === 0) return ({ topik1: 1, topik2: 31, topik3: 71, topik4: 121, topik5: 171, topik6: 211 } as Record<string, number>)[levelCode ?? ''] ?? 1;
  return outcome !== 'pass' ? current : current + 1;
}
