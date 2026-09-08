import { isValidUtf8 } from "@/lib/domain/roster-import";
import {
  validateWordCountMatrix,
  type ValidateWordCountMatrixResult,
  type WordCountMatrixRowInput,
} from "@/lib/domain/word-count-matrix";

export const WORD_COUNT_MATRIX_CSV_MAX_FILE_BYTES = 512 * 1024;

export const WORD_COUNT_MATRIX_CSV_ENCODING_ERROR =
  "Fichier non UTF-8. Réexportez depuis votre logiciel.";

export const WORD_COUNT_MATRIX_CSV_FORMAT_ERROR =
  "Format CSV invalide. Cinq colonnes par ligne (dictée, jaune, vert, violet, or) séparées par des point-virgules.";

export const WORD_COUNT_MATRIX_CSV_EMPTY_ERROR =
  "Aucune ligne valide dans le fichier.";

export const WORD_COUNT_MATRIX_CSV_MISSING_FILE_ERROR =
  "Sélectionnez un fichier CSV.";

export const WORD_COUNT_MATRIX_CSV_FILE_TOO_LARGE_ERROR =
  "Le fichier est trop volumineux (max 512 KB).";

export const WORD_COUNT_MATRIX_CSV_IMPORT_SUCCESS_MESSAGE =
  "Matrice importée.";

export const WORD_COUNT_MATRIX_CSV_GENERIC_ERROR =
  "Import impossible. Réessayez.";

export const WORD_COUNT_MATRIX_CSV_EXPORT_EMPTY_MESSAGE =
  "Rien à exporter.";

export const WORD_COUNT_MATRIX_CSV_EXPORT_FILENAME =
  "matrice-mots-champions.csv";

export const WORD_COUNT_MATRIX_CSV_OVERWRITE_TITLE =
  "Remplacer la matrice ?";

export function formatWordCountMatrixCsvOverwriteMessage(
  existingRowCount: number
): string {
  const lineLabel = existingRowCount === 1 ? "ligne" : "lignes";
  return `L'import remplace entièrement votre matrice actuelle (${existingRowCount} ${lineLabel}). Cette action est irréversible.`;
}

export type WordCountMatrixCsvParseSuccess = {
  ok: true;
  rows: WordCountMatrixRowInput[];
};

export type WordCountMatrixCsvParseFailure = {
  ok: false;
  error: string;
  validation?: ValidateWordCountMatrixResult;
};

export type WordCountMatrixCsvParseResult =
  | WordCountMatrixCsvParseSuccess
  | WordCountMatrixCsvParseFailure;

function escapeSemicolonCsvField(value: string): string {
  if (
    value.includes(";") ||
    value.includes("\"") ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

function parseSemicolonCsvRow(line: string): string[] {
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

    if (char === ";") {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

export function serializeWordCountMatrixCsv(
  rows: WordCountMatrixRowInput[]
): string {
  return rows
    .map((row) =>
      [
        escapeSemicolonCsvField(row.label),
        row.wordsYellow,
        row.wordsGreen,
        row.wordsViolet,
        row.wordsGold,
      ].join(";")
    )
    .join("\n")
    .concat("\n");
}

export function parseWordCountMatrixCsv(
  bytes: Uint8Array
): WordCountMatrixCsvParseResult {
  if (!isValidUtf8(bytes)) {
    return { ok: false, error: WORD_COUNT_MATRIX_CSV_ENCODING_ERROR };
  }

  const text = new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedText.split("\n");
  const rows: WordCountMatrixRowInput[] = [];

  for (const rawLine of lines) {
    if (rawLine.trim() === "") {
      continue;
    }

    const fields = parseSemicolonCsvRow(rawLine);
    if (fields.length !== 5) {
      return { ok: false, error: WORD_COUNT_MATRIX_CSV_FORMAT_ERROR };
    }

    rows.push({
      label: fields[0],
      wordsYellow: fields[1],
      wordsGreen: fields[2],
      wordsViolet: fields[3],
      wordsGold: fields[4],
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: WORD_COUNT_MATRIX_CSV_EMPTY_ERROR };
  }

  const validation = validateWordCountMatrix(rows);
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error,
      validation,
    };
  }

  return { ok: true, rows };
}
