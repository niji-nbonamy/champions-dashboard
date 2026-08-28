import { CHAMPIONS_LEVELS } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";

export type PromotionEvaluationResult = {
  eligible: boolean;
  targetLevel: ChampionsLevel | null;
};

export function getPromotionThreshold(level: ChampionsLevel): number | null {
  switch (level) {
    case "yellow":
    case "green":
      return 90;
    case "violet":
      return 95;
    case "gold":
      return null;
  }
}

export function getNextLevel(level: ChampionsLevel): ChampionsLevel | null {
  const index = CHAMPIONS_LEVELS.indexOf(level);
  if (index < 0 || index >= CHAMPIONS_LEVELS.length - 1) {
    return null;
  }

  return CHAMPIONS_LEVELS[index + 1] ?? null;
}

/**
 * @param recentPercents Global % values ordered most recent first (includes the just-saved entry).
 */
export function evaluatePendingPromotion(
  level: ChampionsLevel,
  recentPercents: number[]
): PromotionEvaluationResult {
  const threshold = getPromotionThreshold(level);
  const targetLevel = getNextLevel(level);

  if (threshold === null || targetLevel === null) {
    return { eligible: false, targetLevel: null };
  }

  if (recentPercents.length < 2) {
    return { eligible: false, targetLevel: null };
  }

  const [mostRecent, previous] = recentPercents;
  const qualifies =
    mostRecent > threshold && previous > threshold;

  return {
    eligible: qualifies,
    targetLevel: qualifies ? targetLevel : null,
  };
}
