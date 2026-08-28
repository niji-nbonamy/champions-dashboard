/**
 * Global % = (totalWords − min(Σerrors, totalWords)) / totalWords × 100, clamped [0, 100].
 */
export function calculateGlobalPercent(
  totalWords: number,
  sumErrors: number
): number {
  if (!Number.isFinite(totalWords) || totalWords <= 0) {
    return 0;
  }

  if (!Number.isFinite(sumErrors)) {
    return 0;
  }

  const normalizedErrors = Math.max(0, sumErrors);
  const cappedErrors = Math.min(normalizedErrors, totalWords);
  const rawPercent = ((totalWords - cappedErrors) / totalWords) * 100;
  const clamped = Math.max(0, Math.min(100, rawPercent));

  return Math.round(clamped);
}
