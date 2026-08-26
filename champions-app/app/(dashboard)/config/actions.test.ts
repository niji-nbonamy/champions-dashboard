import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ROSTER_CSV_ENCODING_ERROR,
  ROSTER_CSV_FILE_TOO_LARGE_ERROR,
  ROSTER_CSV_MAX_FILE_BYTES,
  ROSTER_CSV_MISSING_FILE_ERROR,
} from "@/lib/domain/roster-import";
import {
  WORD_COUNT_CELL_INVALID_ERROR,
  WORD_COUNT_MATRIX_GENERIC_ERROR,
  WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE,
} from "@/lib/domain/word-count-matrix";

const {
  redirect,
  revalidatePath,
  mockImportRosterFromCsv,
  mockReplaceWordCountMatrix,
  mockAuth,
  mockGetTeacherClass,
} = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  mockImportRosterFromCsv: vi.fn(),
  mockReplaceWordCountMatrix: vi.fn(),
  mockAuth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
}));

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

vi.mock("@/lib/services/replace-word-count-matrix", () => ({
  replaceWordCountMatrix: mockReplaceWordCountMatrix,
  WordCountMatrixValidationError: class WordCountMatrixValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "WordCountMatrixValidationError";
    }
  },
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
    });
  });

  it("returns validation errors to the client", async () => {
    mockAuthenticatedSession();
    const { WordCountMatrixValidationError } = await import(
      "@/lib/services/replace-word-count-matrix"
    );
    mockReplaceWordCountMatrix.mockRejectedValueOnce(
      new WordCountMatrixValidationError(WORD_COUNT_CELL_INVALID_ERROR)
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

    expect(result.error).toBe(WORD_COUNT_CELL_INVALID_ERROR);
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
    const duplicateError = "Labels de dictée en double : Dictée 1, dictée 1.";
    const { WordCountMatrixValidationError } = await import(
      "@/lib/services/replace-word-count-matrix"
    );
    mockReplaceWordCountMatrix.mockRejectedValueOnce(
      new WordCountMatrixValidationError(duplicateError)
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

    expect(result.error).toBe(duplicateError);
  });
});
