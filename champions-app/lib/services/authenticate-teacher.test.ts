import { afterEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
}));

describe("authenticateTeacher", () => {
  const teacherId = "550e8400-e29b-41d4-a716-446655440000";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the teacher when credentials are valid", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: teacherId,
        email: "teacher@example.com",
        passwordHash: "hashed-password",
      },
    ]);

    const { compare } = await import("bcryptjs");
    vi.mocked(compare).mockResolvedValueOnce(true as never);

    const { authenticateTeacher } = await import("./authenticate-teacher");
    const result = await authenticateTeacher(
      "Teacher@Example.com",
      "password12"
    );

    expect(result).toEqual({
      id: teacherId,
      email: "teacher@example.com",
    });
    expect(compare).toHaveBeenCalledWith("password12", "hashed-password");
  });

  it("returns null when the password is incorrect", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: teacherId,
        email: "teacher@example.com",
        passwordHash: "hashed-password",
      },
    ]);

    const { compare } = await import("bcryptjs");
    vi.mocked(compare).mockResolvedValueOnce(false as never);

    const { authenticateTeacher } = await import("./authenticate-teacher");
    const result = await authenticateTeacher(
      "teacher@example.com",
      "wrongpassword"
    );

    expect(result).toBeNull();
  });

  it("returns null when the email is unknown", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { compare } = await import("bcryptjs");
    vi.mocked(compare).mockResolvedValueOnce(false as never);

    const { authenticateTeacher } = await import("./authenticate-teacher");
    const result = await authenticateTeacher(
      "unknown@example.com",
      "password12"
    );

    expect(result).toBeNull();
    expect(compare).toHaveBeenCalledWith(
      "password12",
      "$2b$12$7h4ZiGN2a6hCmiI3tS6il.JhdLbF3aYwTBu4iaeQGEGWyDDS3Jp32"
    );
  });

  it("returns null for invalid input without querying the database", async () => {
    const { authenticateTeacher } = await import("./authenticate-teacher");
    const result = await authenticateTeacher("bad-email", "password12");

    expect(result).toBeNull();
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns null when the database query fails", async () => {
    mockLimit.mockRejectedValueOnce(new Error("db down"));

    const { authenticateTeacher } = await import("./authenticate-teacher");
    const result = await authenticateTeacher(
      "teacher@example.com",
      "password12"
    );

    expect(result).toBeNull();
  });
});
