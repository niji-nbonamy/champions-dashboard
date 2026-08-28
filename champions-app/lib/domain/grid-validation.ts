import {
  CHAMPIONS_ERROR_CATEGORIES,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";

export type CategoryErrorCounts = Record<ChampionsErrorCategoryLetter, number>;

export type GridRowValidationResult = {
  valid: boolean;
  sumErrors: number;
  wordTotal: number;
};

function categoryCount(
  counts: CategoryErrorCounts,
  letter: ChampionsErrorCategoryLetter
): number {
  const value = counts[letter] ?? 0;
  return Number.isFinite(value) ? value : 0;
}

export function sumCategoryErrors(counts: CategoryErrorCounts): number {
  return CHAMPIONS_ERROR_CATEGORIES.reduce(
    (total, category) => total + categoryCount(counts, category.letter),
    0
  );
}

export function validateGridRow(
  counts: CategoryErrorCounts,
  wordTotal: number
): GridRowValidationResult {
  const sumErrors = sumCategoryErrors(counts);

  if (!Number.isFinite(wordTotal) || wordTotal < 0) {
    return { valid: false, sumErrors, wordTotal };
  }

  if (sumErrors > wordTotal) {
    return { valid: false, sumErrors, wordTotal };
  }

  for (const category of CHAMPIONS_ERROR_CATEGORIES) {
    const count = categoryCount(counts, category.letter);
    if (count < 0 || count > wordTotal) {
      return { valid: false, sumErrors, wordTotal };
    }
  }

  return { valid: true, sumErrors, wordTotal };
}

export function formatGridRowValidationMessage(
  firstName: string,
  sumErrors: number,
  wordTotal: number
): string {
  return `Σ erreurs (${sumErrors}) > total mots (${wordTotal}) pour ${firstName}`;
}
