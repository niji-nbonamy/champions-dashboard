import { describe, expect, it } from "vitest";

import {
  CLASS_ONBOARDING_ERROR_MESSAGE,
  MAX_SCHOOL_YEAR_LABEL_LENGTH,
  SCHOOL_YEAR_LABEL_EMPTY_MESSAGE,
  getSchoolYearLabelValidationError,
  validateSchoolYearLabel,
} from "./class";

describe("class domain", () => {
  it("accepts a trimmed school year label", () => {
    expect(validateSchoolYearLabel("  2025-2026  ")).toBe("2025-2026");
  });

  it("rejects an empty school year label", () => {
    expect(validateSchoolYearLabel("")).toBeNull();
    expect(validateSchoolYearLabel("   ")).toBeNull();
    expect(getSchoolYearLabelValidationError("")).toBe(
      SCHOOL_YEAR_LABEL_EMPTY_MESSAGE
    );
  });

  it("rejects labels longer than the maximum length", () => {
    const tooLong = "a".repeat(MAX_SCHOOL_YEAR_LABEL_LENGTH + 1);
    expect(validateSchoolYearLabel(tooLong)).toBeNull();
    expect(getSchoolYearLabelValidationError(tooLong)).toBe(
      CLASS_ONBOARDING_ERROR_MESSAGE
    );
  });

  it("returns no validation error for valid labels", () => {
    expect(getSchoolYearLabelValidationError("2025-2026")).toBeNull();
  });
});
