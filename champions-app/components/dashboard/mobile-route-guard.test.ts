import { describe, expect, it } from "vitest";

import { isBlockedMobilePath } from "./mobile-route-guard";

const dictationId = "880e8400-e29b-41d4-a716-446655440003";

describe("isBlockedMobilePath", () => {
  it("blocks students, config, and alerts routes", () => {
    expect(isBlockedMobilePath("/students")).toBe(true);
    expect(isBlockedMobilePath("/students/770e8400-e29b-41d4-a716-446655440002")).toBe(
      true
    );
    expect(isBlockedMobilePath("/config")).toBe(true);
    expect(isBlockedMobilePath("/alerts")).toBe(true);
  });

  it("allows the dictations hub", () => {
    expect(isBlockedMobilePath("/dictations")).toBe(false);
  });

  it("blocks the class grid but allows mobile capture routes", () => {
    expect(isBlockedMobilePath(`/dictations/${dictationId}`)).toBe(true);
    expect(isBlockedMobilePath(`/dictations/${dictationId}/mobile`)).toBe(false);
    expect(isBlockedMobilePath(`/dictations/${dictationId}/mobile/summary`)).toBe(
      false
    );
  });

  it("allows unrelated dashboard routes", () => {
    expect(isBlockedMobilePath("/onboarding/class")).toBe(false);
    expect(isBlockedMobilePath("/login")).toBe(false);
  });
});
