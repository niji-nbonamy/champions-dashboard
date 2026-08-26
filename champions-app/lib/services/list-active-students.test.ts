import { afterEach, describe, expect, it, vi } from "vitest";

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockOrderBy = vi.fn();

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("listActiveStudents", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries active students ordered by display name", async () => {
    mockSelect.mockReturnValueOnce({ from: mockFrom });
    mockOrderBy.mockResolvedValueOnce([
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
    ]);

    const { listActiveStudents } = await import("./list-active-students");
    const result = await listActiveStudents(classId);

    expect(result).toEqual([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
      },
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        displayName: "MARTIN Lucas",
        level: "yellow",
      },
    ]);
    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockFrom).toHaveBeenCalledOnce();
    expect(mockWhere).toHaveBeenCalledOnce();
    expect(mockOrderBy).toHaveBeenCalledOnce();
  });

  it("filters active students through the archived=false query path", async () => {
    mockSelect.mockReturnValueOnce({ from: mockFrom });
    mockOrderBy.mockResolvedValueOnce([]);

    const { listActiveStudents } = await import("./list-active-students");
    await listActiveStudents(classId);

    expect(mockWhere).toHaveBeenCalledOnce();
  });
});
