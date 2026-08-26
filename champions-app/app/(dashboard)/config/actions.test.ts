import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ROSTER_CSV_ENCODING_ERROR,
  ROSTER_CSV_FILE_TOO_LARGE_ERROR,
  ROSTER_CSV_MAX_FILE_BYTES,
  ROSTER_CSV_MISSING_FILE_ERROR,
} from "@/lib/domain/roster-import";

const {
  redirect,
  revalidatePath,
  mockImportRosterFromCsv,
  mockAuth,
  mockGetTeacherClass,
} = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  mockImportRosterFromCsv: vi.fn(),
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
