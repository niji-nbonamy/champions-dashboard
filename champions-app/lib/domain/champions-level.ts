import type { ChampionsLevel } from "@/lib/design/tokens";

export const CHAMPIONS_LEVELS = [
  "yellow",
  "green",
  "violet",
  "gold",
] as const satisfies readonly ChampionsLevel[];

const CHAMPIONS_LEVEL_SET = new Set<string>(CHAMPIONS_LEVELS);

const CHAMPIONS_LEVEL_FRENCH_LABELS: Record<ChampionsLevel, string> = {
  yellow: "jaune",
  green: "vert",
  violet: "violet",
  gold: "or",
};

export const ASSIGN_STUDENT_LEVEL_GENERIC_ERROR =
  "Assignation impossible. Réessayez.";

export function isChampionsLevel(value: string): value is ChampionsLevel {
  return CHAMPIONS_LEVEL_SET.has(value);
}

export function parseChampionsLevel(value: string): ChampionsLevel | null {
  return isChampionsLevel(value) ? value : null;
}

export function getChampionsLevelFrenchLabel(level: ChampionsLevel): string {
  return CHAMPIONS_LEVEL_FRENCH_LABELS[level];
}
