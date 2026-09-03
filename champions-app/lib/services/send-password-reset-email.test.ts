import { afterEach, describe, expect, it, vi } from "vitest";

const mockSendTransactionalEmail = vi.fn(async () => {});

vi.mock("./send-transactional-email", () => ({
  sendTransactionalEmail: mockSendTransactionalEmail,
}));

describe("send-password-reset-email", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("builds a reset URL from AUTH_URL without a trailing slash", async () => {
    process.env.AUTH_URL = "https://champions.example.com/";

    const { buildPasswordResetEmailContent } = await import(
      "./send-password-reset-email"
    );
    const { subject, html, text } = buildPasswordResetEmailContent("token-123");

    expect(subject).toBe(
      "Réinitialisation de votre mot de passe CHAMPIONS"
    );
    expect(html).toContain(
      "https://champions.example.com/reset-password?token=token-123"
    );
    expect(text).toContain(
      "https://champions.example.com/reset-password?token=token-123"
    );
    expect(html).toContain("60 minutes");
  });

  it("sends the reset email through sendTransactionalEmail", async () => {
    process.env.AUTH_URL = "https://champions.example.com";

    const { sendPasswordResetEmail } = await import(
      "./send-password-reset-email"
    );

    await sendPasswordResetEmail("teacher@example.com", "token-123");

    expect(mockSendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "teacher@example.com",
        subject: "Réinitialisation de votre mot de passe CHAMPIONS",
        html: expect.stringContaining("token-123"),
        text: expect.stringContaining("token-123"),
      })
    );
  });

  it("requires AUTH_URL in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_URL;

    const { buildPasswordResetEmailContent } = await import(
      "./send-password-reset-email"
    );

    expect(() => buildPasswordResetEmailContent("token-123")).toThrow(
      "AUTH_URL is required in production."
    );
  });
});
