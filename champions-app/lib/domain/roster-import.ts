import {
  normalizeDisplayName,
  normalizeDuplicateKey,
  STUDENT_DISPLAY_NAME_MAX_LENGTH,
} from "./student-display-name";

export const ROSTER_CSV_LEGACY_HEADER = "NOM + prénom";

export const ROSTER_CSV_ENCODING_ERROR =
  "Fichier non UTF-8. Réexportez depuis votre logiciel.";

export const ROSTER_CSV_FORMAT_ERROR =
  "Format CSV invalide. Une seule colonne avec un nom d'élève par ligne est requise.";

export const ROSTER_CSV_EMPTY_ROSTER_ERROR =
  "Aucun élève valide dans le fichier.";

export const ROSTER_CSV_MISSING_FILE_ERROR = "Sélectionnez un fichier CSV.";

export const ROSTER_CSV_FILE_TOO_LARGE_ERROR =
  "Le fichier est trop volumineux (max 512 KB).";

export const ROSTER_CSV_ROSTER_EXISTS_ERROR =
  "La liste d'élèves existe déjà. Utilisez l'onglet Élèves pour ajouter des élèves.";

export const ROSTER_CSV_MAX_FILE_BYTES = 512 * 1024;

export const ROSTER_CSV_MAX_DISPLAY_NAME_LENGTH = STUDENT_DISPLAY_NAME_MAX_LENGTH;

export type RosterCsvParseSuccess = {
  ok: true;
  names: string[];
};

export type RosterCsvParseFailure = {
  ok: false;
  error: string;
};

export type RosterCsvParseResult = RosterCsvParseSuccess | RosterCsvParseFailure;

export function formatRosterImportSuccessMessage(importedCount: number): string {
  if (importedCount === 1) {
    return "1 élève importé.";
  }
  return `${importedCount} élèves importés.`;
}

function formatDuplicateError(duplicateNames: string[]): string {
  return `Doublons détectés : ${duplicateNames.join(", ")}.`;
}

export function isValidUtf8(bytes: Uint8Array): boolean {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    decoder.decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (inQuotes) {
      if (char === "\"") {
        if (line[index + 1] === "\"") {
          current += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

function isLegacyRosterHeader(displayName: string): boolean {
  return displayName === ROSTER_CSV_LEGACY_HEADER;
}

export function parseRosterCsv(bytes: Uint8Array): RosterCsvParseResult {
  if (!isValidUtf8(bytes)) {
    return { ok: false, error: ROSTER_CSV_ENCODING_ERROR };
  }

  const text = new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedText.split("\n");

  const names: string[] = [];
  const namesByKey = new Map<string, string[]>();
  const duplicateKeys = new Set<string>();

  for (const rawLine of lines) {
    if (rawLine.trim() === "") {
      continue;
    }

    const fields = parseCsvRow(rawLine);
    if (fields.length !== 1) {
      return { ok: false, error: ROSTER_CSV_FORMAT_ERROR };
    }

    const displayName = normalizeDisplayName(fields[0]);
    if (!displayName) {
      continue;
    }

    if (isLegacyRosterHeader(displayName)) {
      continue;
    }

    if (displayName.length > ROSTER_CSV_MAX_DISPLAY_NAME_LENGTH) {
      return { ok: false, error: ROSTER_CSV_FORMAT_ERROR };
    }

    const key = normalizeDuplicateKey(displayName);
    const existingNames = namesByKey.get(key);
    if (existingNames) {
      existingNames.push(displayName);
      duplicateKeys.add(key);
      continue;
    }

    namesByKey.set(key, [displayName]);
    names.push(displayName);
  }

  if (duplicateKeys.size > 0) {
    const duplicateNames = [...duplicateKeys]
      .flatMap((key) => namesByKey.get(key) ?? [])
      .sort((left, right) => left.localeCompare(right, "fr"));
    return { ok: false, error: formatDuplicateError(duplicateNames) };
  }

  if (names.length === 0) {
    return { ok: false, error: ROSTER_CSV_EMPTY_ROSTER_ERROR };
  }

  return { ok: true, names };
}
