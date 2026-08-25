import { describe, expect, it } from "vitest";

import { mapJwtTokenToSession, mapUserToJwtToken } from "./session-mapping";

describe("session mapping", () => {
  it("maps Teacher.id into JWT sub on sign in", () => {
    const token = mapUserToJwtToken({}, {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "teacher@example.com",
    });

    expect(token.sub).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(token.email).toBe("teacher@example.com");
  });

  it("preserves existing JWT fields when user is absent", () => {
    const token = mapUserToJwtToken(
      { sub: "existing-id", email: "existing@example.com" },
      null
    );

    expect(token.sub).toBe("existing-id");
    expect(token.email).toBe("existing@example.com");
  });

  it("maps JWT sub into session.user.id", () => {
    const session = mapJwtTokenToSession(
      {
        user: { id: "", email: "", name: null, image: null },
        expires: "2099-01-01T00:00:00.000Z",
      },
      {
        sub: "550e8400-e29b-41d4-a716-446655440000",
        email: "teacher@example.com",
      }
    );

    expect(session.user.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(session.user.email).toBe("teacher@example.com");
  });
});
