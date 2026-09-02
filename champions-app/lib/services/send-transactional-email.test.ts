import { afterEach, describe, expect, it, vi } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe("sendTransactionalEmail", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("sends via Resend when RESEND_API_KEY is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "CHAMPIONS <noreply@example.com>";
    mockSend.mockResolvedValueOnce({ data: { id: "email_123" }, error: null });

    const { sendTransactionalEmail } = await import("./send-transactional-email");

    await sendTransactionalEmail({
      to: "teacher@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(mockSend).toHaveBeenCalledWith({
      from: "CHAMPIONS <noreply@example.com>",
      to: "teacher@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
      text: "Hello",
    });
  });

  it("logs a dev fallback when RESEND_API_KEY is absent", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = "CHAMPIONS <noreply@example.com>";
    process.env.NODE_ENV = "development";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { sendTransactionalEmail } = await import("./send-transactional-email");

    await sendTransactionalEmail({
      to: "teacher@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(mockSend).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "XXX",
      "[email:dev-fallback]",
      expect.objectContaining({
        to: "teacher@example.com",
        subject: "Test",
      })
    );

    logSpy.mockRestore();
  });
});
