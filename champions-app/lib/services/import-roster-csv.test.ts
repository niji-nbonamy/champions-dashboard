import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ROSTER_CSV_ENCODING_ERROR,
  ROSTER_CSV_ROSTER_EXISTS_ERROR,
} from "@/lib/domain/roster-import";

const mockValues = vi.fn();
const mockInsert = vi.fn(() => ({ values: mockValues }));

const getDb = vi.fn(() => ({
  insert: mockInsert,
}));

const mockCountActiveStudents = vi.fn();

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

vi.mock("./count-active-students", () => ({
  countActiveStudents: mockCountActiveStudents,
}));

describe("importRosterFromCsv", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("imports students when the roster is empty", async () => {
    mockCountActiveStudents.mockResolvedValueOnce(0);
    mockValues.mockResolvedValueOnce(undefined);

    const csv = "DUPONT Marie\nMARTIN Lucas";
    const bytes = new TextEncoder().encode(csv);

    const { importRosterFromCsv } = await import("./import-roster-csv");
    const result = await importRosterFromCsv(classId, bytes);

    expect(result).toEqual({
      importedCount: 2,
      successMessage: "2 élèves importés.",
    });
    expect(mockValues).toHaveBeenCalledWith([
      {
        classId,
        displayName: "DUPONT Marie",
        archived: false,
      },
      {
        classId,
        displayName: "MARTIN Lucas",
        archived: false,
      },
    ]);
  });

  it("returns a singular French success message for one student", async () => {
    mockCountActiveStudents.mockResolvedValueOnce(0);
    mockValues.mockResolvedValueOnce(undefined);

    const csv = "DUPONT Marie";
    const bytes = new TextEncoder().encode(csv);

    const { importRosterFromCsv } = await import("./import-roster-csv");
    const result = await importRosterFromCsv(classId, bytes);

    expect(result.successMessage).toBe("1 élève importé.");
  });

  it("rejects duplicate names in the CSV without inserting", async () => {
    mockCountActiveStudents.mockResolvedValueOnce(0);

    const csv = "DUPONT Marie\ndupont marie";
    const bytes = new TextEncoder().encode(csv);

    const { importRosterFromCsv } = await import(
      "./import-roster-csv"
    );

    await expect(importRosterFromCsv(classId, bytes)).rejects.toMatchObject({
      name: "RosterImportError",
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects import when the roster is not empty", async () => {
    mockCountActiveStudents.mockResolvedValueOnce(3);

    const csv = "DUPONT Marie";
    const bytes = new TextEncoder().encode(csv);

    const { importRosterFromCsv } = await import(
      "./import-roster-csv"
    );

    await expect(importRosterFromCsv(classId, bytes)).rejects.toMatchObject({
      name: "RosterNotEmptyError",
      message: ROSTER_CSV_ROSTER_EXISTS_ERROR,
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects invalid CSV without inserting", async () => {
    mockCountActiveStudents.mockResolvedValueOnce(0);

    const bytes = new Uint8Array([0xff, 0xfe, 0xfd]);

    const { importRosterFromCsv } = await import(
      "./import-roster-csv"
    );

    await expect(importRosterFromCsv(classId, bytes)).rejects.toMatchObject({
      name: "RosterImportError",
      message: ROSTER_CSV_ENCODING_ERROR,
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
