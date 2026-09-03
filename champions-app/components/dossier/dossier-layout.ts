/** Centered dossier content; wider at 2xl so curve, dictation table, and level history use more horizontal space. */
export const DOSSIER_CONTENT_CONTAINER_CLASS =
  "mx-auto w-full max-w-4xl 2xl:max-w-6xl";

/** Stack curve + history below 2xl; side-by-side at 2xl (1536px) and up. */
export const DOSSIER_CURVE_TABLE_LAYOUT_CLASS =
  "flex flex-col gap-6 2xl:grid 2xl:grid-cols-2 2xl:items-start";
