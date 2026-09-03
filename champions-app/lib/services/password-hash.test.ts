import { hash } from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
  hash: vi.fn(async () => "hashed-password"),
}));

describe("hashPassword", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("hashes passwords with bcrypt cost factor 12", async () => {
    const { hashPassword } = await import("./password-hash");

    await hashPassword("Password1!");

    expect(hash).toHaveBeenCalledWith("Password1!", 12);
  });
});
