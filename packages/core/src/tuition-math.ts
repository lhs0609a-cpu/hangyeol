/** Cumulative integer allocation preserves every won, including uneven packages. */
export function tuitionShare(amount: number, sessions: number, feeBps: number, index: number) {
  if (![amount, sessions, feeBps, index].every(Number.isSafeInteger) || amount < 1 || amount > 5_000_000 || sessions < 1 || sessions > 100 || index < 1 || index > sessions || feeBps < 0 || feeBps > 10000) throw new Error('Invalid tuition allocation');
  const prior = Math.floor(amount * (index - 1) / sessions);
  const earned = Math.floor(amount * index / sessions);
  const gross = earned - prior;
  const fee = Math.floor(earned * feeBps / 10000) - Math.floor(prior * feeBps / 10000);
  return { gross, fee, net: gross - fee };
}
