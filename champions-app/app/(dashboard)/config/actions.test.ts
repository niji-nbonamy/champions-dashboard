import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ROSTER_CSV_ENCODING_ERROR,
  ROSTER_CSV_FILE_TOO_LARGE_ERROR,
  ROSTER_CSV_MAX_FILE_BYTES,
  ROSTER_CSV_MISSING_FILE_ERROR,
} from "@/lib/domain/roster-import";
import {
  DICTATION_LABEL_TOO_LONG_ERROR,
  formatDuplicateDictationLabelsError,
  formatWordCountMatrixRowError,
  WORD_COUNT_CELL_INVALID_ERROR,
  WORD_COUNT_MATRIX_GENERIC_ERROR,
  WORD_COUNT_MATRIX_MAX_ROWS,
  WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE,
  WORD_COUNT_MATRIX_TOO_MANY_ROWS_ERROR,
} from "@/lib/domain/word-count-matrix";

const {
  redirect,
  revalidatePath,
  mockImportRosterFromCsv,
  mockReplaceWordCountMatrix,
  mockAuth,
  mockGetTeacherClass,
  WordCountMatrixValidationError,
} = vi.hoisted(() => {
  class WordCountMatrixValidationError extends Error {
    rowIndex?: number;
    field?: string;

    constructor(
      message: string,
      options?: { rowIndex?: number; field?: string }
    ) {
      super(message);
      this.name = "WordCountMatrixValidationError";
      this.rowIndex = options?.rowIndex;
      this.field = options?.field;
    }
  }

  return {
    redirect: vi.fn((url: string): never => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    revalidatePath: vi.fn(),
    mockImportRosterFromCsv: vi.fn(),
    mockReplaceWordCountMatrix: vi.fn(),
    mockAuth: vi.fn(),
    mockGetTeacherClass: vi.fn(),
    WordCountMatrixValidationError,
  };
});

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/import-roster-csv", () => ({
  importRosterFromCsv: mockImportRosterFromCsv,
  RosterImportError: class RosterImportError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "RosterImportError";
    }
  },
  RosterNotEmptyError: class RosterNotEmptyError extends Error {
    constructor() {
      super("La liste d'élèves existe déjà. Utilisez l'onglet Élèves pour ajouter des élèves.");
      this.name = "RosterNotEmptyError";
    }
  },
}));

function mockValidationOnlyReplace() {
  mockReplaceWordCountMatrix.mockImplementation(async (_classId, rawRows) => {
    const { validateWordCountMatrix } = await import(
      "@/lib/domain/word-count-matrix"
    );
    const validation = validateWordCountMatrix(rawRows);
    if (!validation.ok) {
      throw new WordCountMatrixValidationError(validation.error, {
        rowIndex: validation.rowIndex,
        field: validation.field,
      });
    }
  });
}

vi.mock("@/lib/services/replace-word-count-matrix", () => ({
  replaceWordCountMatrix: mockReplaceWordCountMatrix,
  WordCountMatrixValidationError,
}));

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

function mockAuthenticatedSession() {
  mockAuth.mockResolvedValueOnce({
    user: { id: teacherId, email: "t@example.com" },
  });
  mockGetTeacherClass.mockResolvedValueOnce({
    id: classId,
    teacherId,
    schoolYearLabel: "2025-2026",
  });
}

describe("importRosterCsvAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { importRosterCsvAction } = await import("./actions");

    await expect(
      importRosterCsvAction({ error: null, success: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("returns a French error when no file is selected", async () => {
    mockAuthenticatedSession();

    const { importRosterCsvAction } = await import("./actions");
    const result = await importRosterCsvAction(
      { error: null, success: null },
      new FormData()
    );

    expect(result.error).toBe(ROSTER_CSV_MISSING_FILE_ERROR);
    expect(mockImportRosterFromCsv).not.toHaveBeenCalled();
  });

  it("returns a French error when the file is too large", async () => {
    mockAuthenticatedSession();

    const { importRosterCsvAction } = await import("./actions");
    const formData = new FormData();
    const largeFile = new File(["x"], "roster.csv", { type: "text/csv" });
    Object.defineProperty(largeFile, "size", {
      value: ROSTER_CSV_MAX_FILE_BYTES + 1,
    });
    formData.set("csv_file", largeFile);

    const result = await importRosterCsvAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(ROSTER_CSV_FILE_TOO_LARGE_ERROR);
    expect(mockImportRosterFromCsv).not.toHaveBeenCalled();
  });

  it("redirects with the imported count after a successful import", async () => {
    mockAuthenticatedSession();
    mockImportRosterFromCsv.mockResolvedValueOnce({
      importedCount: 2,
      successMessage: "2 élèves importés.",
    });

    const { importRosterCsvAction } = await import("./actions");
    const formData = new FormData();
    formData.set(
      "csv_file",
      new File(["NOM + prénom\nDUPONT Marie"], "roster.csv", {
        type: "text/csv",
      })
    );

    await expect(
      importRosterCsvAction({ error: null, success: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/config?imported=2");

    expect(revalidatePath).toHaveBeenCalledWith("/config");
  });

  it("returns roster import validation errors to the client", async () => {
    mockAuthenticatedSession();
    const { RosterImportError } = await import("@/lib/services/import-roster-csv");
    mockImportRosterFromCsv.mockRejectedValueOnce(
      new RosterImportError(ROSTER_CSV_ENCODING_ERROR)
    );

    const { importRosterCsvAction } = await import("./actions");
    const formData = new FormData();
    formData.set("csv_file", new File(["bad"], "roster.csv", { type: "text/csv" }));

    const result = await importRosterCsvAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(ROSTER_CSV_ENCODING_ERROR);
  });

  it("returns a generic French error for unexpected failures", async () => {
    mockAuthenticatedSession();
    mockImportRosterFromCsv.mockRejectedValueOnce(new Error("database down"));

    const { importRosterCsvAction } = await import("./actions");
    const formData = new FormData();
    formData.set("csv_file", new File(["ok"], "roster.csv", { type: "text/csv" }));

    const result = await importRosterCsvAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe("Import impossible. Réessayez.");
  });
});

describe("saveWordCountMatrixAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { saveWordCountMatrixAction } = await import("./actions");

    await expect(
      saveWordCountMatrixAction({ error: null, success: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const { saveWordCountMatrixAction } = await import("./actions");

    await expect(
      saveWordCountMatrixAction({ error: null, success: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("saves a valid matrix and revalidates config", async () => {
    mockAuthenticatedSession();
    mockReplaceWordCountMatrix.mockResolvedValueOnce(undefined);

    const { saveWordCountMatrixAction } = await import("./actions");
    const formData = new FormData();
    formData.set("rows[0].label", "Dictée 1");
    formData.set("rows[0].words_yellow", "10");
    formData.set("rows[0].words_green", "12");
    formData.set("rows[0].words_violet", "14");
    formData.set("rows[0].words_gold", "16");

    const result = await saveWordCountMatrixAction(
      { error: null, success: null },
      formData
    );

    expect(mockReplaceWordCountMatrix).toHaveBeenCalledWith(classId, [
      {
        label: "Dictée 1",
        wordsYellow: "10",
        wordsGreen: "12",
        wordsViolet: "14",
        wordsGold: "16",
      },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/config");
    expect(result).toEqual({
      error: null,
      success: WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE,
      errorRowIndex: null,
      errorField: null,
    });
  });

  it("returns validation errors to the client", async () => {
    mockAuthenticatedSession();
    const { WordCountMatrixValidationError } = await import(
      "@/lib/services/replace-word-count-matrix"
    );
    const validationError = formatWordCountMatrixRowError(
      1,
      "Dictée 1",
      WORD_COUNT_CELL_INVALID_ERROR
    );
    mockReplaceWordCountMatrix.mockRejectedValueOnce(
      new WordCountMatrixValidationError(validationError, {
        rowIndex: 0,
        field: "wordsYellow",
      })
    );

    const { saveWordCountMatrixAction } = await import("./actions");
    const formData = new FormData();
    formData.set("rows[0].label", "Dictée 1");
    formData.set("rows[0].words_yellow", "0");
    formData.set("rows[0].words_green", "12");
    formData.set("rows[0].words_violet", "14");
    formData.set("rows[0].words_gold", "16");

    const result = await saveWordCountMatrixAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(validationError);
    expect(result.errorRowIndex).toBe(0);
    expect(result.errorField).toBe("wordsYellow");
  });

  it("returns a generic French error for unexpected failures", async () => {
    mockAuthenticatedSession();
    mockReplaceWordCountMatrix.mockRejectedValueOnce(new Error("database down"));

    const { saveWordCountMatrixAction } = await import("./actions");
    const formData = new FormData();

    const result = await saveWordCountMatrixAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(WORD_COUNT_MATRIX_GENERIC_ERROR);
  });

  it("saves an empty matrix when no rows are submitted", async () => {
    mockAuthenticatedSession();
    mockReplaceWordCountMatrix.mockResolvedValueOnce(undefined);

    const { saveWordCountMatrixAction } = await import("./actions");
    const result = await saveWordCountMatrixAction(
      { error: null, success: null },
      new FormData()
    );

    expect(mockReplaceWordCountMatrix).toHaveBeenCalledWith(classId, []);
    expect(result.success).toBe(WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE);
  });

  it("returns duplicate label validation errors to the client", async () => {
    mockAuthenticatedSession();
    const duplicateError = formatDuplicateDictationLabelsError([
      "Dictée 1",
      "dictée 1",
    ]);
    const { WordCountMatrixValidationError } = await import(
      "@/lib/services/replace-word-count-matrix"
    );
    mockReplaceWordCountMatrix.mockRejectedValueOnce(
      new WordCountMatrixValidationError(duplicateError, { field: "duplicate" })
    );

    const { saveWordCountMatrixAction } = await import("./actions");
    const formData = new FormData();
    formData.set("rows[0].label", "Dictée 1");
    formData.set("rows[0].words_yellow", "10");
    formData.set("rows[0].words_green", "12");
    formData.set("rows[0].words_violet", "14");
    formData.set("rows[0].words_gold", "16");
    formData.set("rows[1].label", "dictée 1");
    formData.set("rows[1].words_yellow", "9");
    formData.set("rows[1].words_green", "11");
    formData.set("rows[1].words_violet", "13");
    formData.set("rows[1].words_gold", "15");

    const result = await saveWordCountMatrixAction(
      { error: null, success: null },
      formData
    );

    expect(mockReplaceWordCountMatrix).toHaveBeenCalledWith(classId, [
      {
        label: "Dictée 1",
        wordsYellow: "10",
        wordsGreen: "12",
        wordsViolet: "14",
        wordsGold: "16",
      },
      {
        label: "dictée 1",
        wordsYellow: "9",
        wordsGreen: "11",
        wordsViolet: "13",
        wordsGold: "15",
      },
    ]);
    expect(result.error).toBe(duplicateError);
    expect(result.errorField).toBe("duplicate");
  });

  it("rejects more than the maximum number of rows via real validation", async () => {
    mockAuthenticatedSession();
    mockValidationOnlyReplace();

    const { saveWordCountMatrixAction } = await import("./actions");
    const formData = new FormData();

    for (let index = 0; index < WORD_COUNT_MATRIX_MAX_ROWS + 1; index += 1) {
      formData.set(`rows[${index}].label`, `Dictée ${index + 1}`);
      formData.set(`rows[${index}].words_yellow`, "10");
      formData.set(`rows[${index}].words_green`, "12");
      formData.set(`rows[${index}].words_violet`, "14");
      formData.set(`rows[${index}].words_gold`, "16");
    }

    const result = await saveWordCountMatrixAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(WORD_COUNT_MATRIX_TOO_MANY_ROWS_ERROR);
    expect(result.success).toBeNull();
  });

  it("rejects labels longer than 80 characters via real validation", async () => {
    mockAuthenticatedSession();
    mockValidationOnlyReplace();

    const { saveWordCountMatrixAction } = await import("./actions");
    const formData = new FormData();
    formData.set("rows[0].label", "a".repeat(81));
    formData.set("rows[0].words_yellow", "10");
    formData.set("rows[0].words_green", "12");
    formData.set("rows[0].words_violet", "14");
    formData.set("rows[0].words_gold", "16");

    const result = await saveWordCountMatrixAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(
      formatWordCountMatrixRowError(1, "a".repeat(81), DICTATION_LABEL_TOO_LONG_ERROR)
    );
    expect(result.errorRowIndex).toBe(0);
    expect(result.errorField).toBe("label");
    expect(result.success).toBeNull();
  });

  it("forwards only remaining rows after a simulated row removal", async () => {
    mockAuthenticatedSession();
    mockReplaceWordCountMatrix.mockResolvedValueOnce(undefined);

    const { saveWordCountMatrixAction } = await import("./actions");
    const formData = new FormData();
    formData.set("rows[0].label", "Dictée 2");
    formData.set("rows[0].words_yellow", "9");
    formData.set("rows[0].words_green", "11");
    formData.set("rows[0].words_violet", "13");
    formData.set("rows[0].words_gold", "15");

    const result = await saveWordCountMatrixAction(
      { error: null, success: null },
      formData
    );

    expect(mockReplaceWordCountMatrix).toHaveBeenCalledWith(classId, [
      {
        label: "Dictée 2",
        wordsYellow: "9",
        wordsGreen: "11",
        wordsViolet: "13",
        wordsGold: "15",
      },
    ]);
    expect(result.success).toBe(WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE);
  });
});
