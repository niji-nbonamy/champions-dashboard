import { afterEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("listLeveledActiveStudents", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns only active students with a valid level", async () => {
    mockWhere.mockResolvedValueOnce([
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        displayName: "MARTIN Lucas",
        level: "yellow",
      },
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
      },
      {
        id: "990e8400-e29b-41d4-a716-446655440004",
        displayName: "INVALID Student",
        level: "red",
      },
    ]);

    const { listLeveledActiveStudents } = await import(
      "./list-leveled-active-students"
    );
    const result = await listLeveledActiveStudents(classId);

    expect(result).toEqual([
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        displayName: "MARTIN Lucas",
        level: "yellow",
      },
    ]);
  });

  it("sorts leveled students using French locale", async () => {
    mockWhere.mockResolvedValueOnce([
      {
        id: "990e8400-e29b-41d4-a716-446655440004",
        displayName: "ÉLÈVE Z",
        level: "gold",
      },
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        displayName: "ÉLÈVE A",
        level: "green",
      },
    ]);

    const { listLeveledActiveStudents } = await import(
      "./list-leveled-active-students"
    );
    const result = await listLeveledActiveStudents(classId);

    expect(result.map((student) => student.displayName)).toEqual([
      "ÉLÈVE A",
      "ÉLÈVE Z",
    ]);
  });
});
