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
};

export const CHAMPIONS_ERROR_CATEGORIES = [
  {
    letter: "C",
    name: "Conjugaison",
    definition: "Les verbes sont-ils correctement conjugués ?",
  },
  {
    letter: "H",
    name: "Homophones",
    definition:
      "Confusion d'homophones (et/est, a/à, son/sont…)",
  },
  {
    letter: "A",
    name: "Accords",
    definition:
      "Accords dans le groupe nominal et entre sujet et verbe",
  },
  {
    letter: "M",
    name: "Majuscules",
    definition: "Majuscules en début de phrase et pour les noms propres",
  },
  {
    letter: "P",
    name: "Ponctuation",
    definition: "Les points et les virgules sont-ils présents ?",
  },
  {
    letter: "I",
    name: "Illisibilité",
    definition: "L'écriture est-elle propre et lisible ?",
  },
  {
    letter: "O",
    name: "Orthographe",
    definition:
      "Les mots du vocabulaire sont-ils correctement mémorisés et orthographiés ?",
  },
  {
    letter: "N",
    name: "Néant / Non-présent / Non-sens",
    definition: "Des mots manquent-ils ? (absence, omission, non-sens)",
  },
  {
    letter: "S",
    name: "Son",
    definition: "Les sons complexes ont-ils la bonne graphie ?",
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
