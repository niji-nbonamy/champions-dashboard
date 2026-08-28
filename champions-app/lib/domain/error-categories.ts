export type ChampionsErrorCategoryLetter =
  | "C"
  | "H"
  | "A"
  | "M"
  | "P"
  | "I"
  | "O"
  | "N"
  | "S";

export type ChampionsErrorCategory = {
  letter: ChampionsErrorCategoryLetter;
  name: string;
  definition: string;
  headerBackground: string;
  headerForeground: string;
};

export const CHAMPIONS_ERROR_CATEGORIES = [
  {
    letter: "C",
    name: "Conjugaison",
    definition: "Les verbes sont-ils correctement conjugués ?",
    headerBackground: "#E70A16",
    headerForeground: "#FFFFFF",
  },
  {
    letter: "H",
    name: "Homophones",
    definition:
      "Confusion d'homophones (et/est, a/à, son/sont…)",
    headerBackground: "#FE6382",
    headerForeground: "#FFFFFF",
  },
  {
    letter: "A",
    name: "Accords",
    definition:
      "Accords dans le groupe nominal et entre sujet et verbe",
    headerBackground: "#F98801",
    headerForeground: "#FFFFFF",
  },
  {
    letter: "M",
    name: "Majuscules",
    definition: "Majuscules en début de phrase et pour les noms propres",
    headerBackground: "#FACD01",
    headerForeground: "#1A1A1A",
  },
  {
    letter: "P",
    name: "Ponctuation",
    definition: "Les points et les virgules sont-ils présents ?",
    headerBackground: "#89CF30",
    headerForeground: "#1A1A1A",
  },
  {
    letter: "I",
    name: "Illisibilité",
    definition: "L'écriture est-elle propre et lisible ?",
    headerBackground: "#237A21",
    headerForeground: "#FFFFFF",
  },
  {
    letter: "O",
    name: "Orthographe",
    definition:
      "Les mots du vocabulaire sont-ils correctement mémorisés et orthographiés ?",
    headerBackground: "#32A4EF",
    headerForeground: "#FFFFFF",
  },
  {
    letter: "N",
    name: "Néant / Non-présent / Non-sens",
    definition: "Des mots manquent-ils ? (absence, omission, non-sens)",
    headerBackground: "#013191",
    headerForeground: "#FFFFFF",
  },
  {
    letter: "S",
    name: "Son",
    definition: "Les sons complexes ont-ils la bonne graphie ?",
    headerBackground: "#7E44AC",
    headerForeground: "#FFFFFF",
  },
] as const satisfies readonly ChampionsErrorCategory[];

export const CHAMPIONS_ERROR_CATEGORY_LETTERS =
  CHAMPIONS_ERROR_CATEGORIES.map((category) => category.letter);

export function getChampionsErrorCategory(
  letter: ChampionsErrorCategoryLetter
): ChampionsErrorCategory {
  const category = CHAMPIONS_ERROR_CATEGORIES.find(
    (entry) => entry.letter === letter
  );

  if (!category) {
    throw new Error(`Unknown CHAMPIONS error category letter: ${letter}`);
  }

  return category;
}

export function formatGridCellAriaLabel(
  firstName: string,
  categoryName: string,
  value: number
): string {
  return `${firstName}, ${categoryName}, ${value} erreurs`;
}

export type DictationEntryErrorColumns = {
  errorsC: number;
  errorsH: number;
  errorsA: number;
  errorsM: number;
  errorsP: number;
  errorsI: number;
  errorsO: number;
  errorsN: number;
  errorsS: number;
};

const ERROR_LETTER_TO_COLUMN: Record<
  ChampionsErrorCategoryLetter,
  keyof DictationEntryErrorColumns
> = {
  C: "errorsC",
  H: "errorsH",
  A: "errorsA",
  M: "errorsM",
  P: "errorsP",
  I: "errorsI",
  O: "errorsO",
  N: "errorsN",
  S: "errorsS",
};

export function categoryErrorsToDbColumns(
  counts: Record<ChampionsErrorCategoryLetter, number>
): DictationEntryErrorColumns {
  return CHAMPIONS_ERROR_CATEGORIES.reduce((columns, category) => {
    const column = ERROR_LETTER_TO_COLUMN[category.letter];
    const value = counts[category.letter] ?? 0;
    columns[column] = Number.isFinite(value) ? value : 0;
    return columns;
  }, {} as DictationEntryErrorColumns);
}
