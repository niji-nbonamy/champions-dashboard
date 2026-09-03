import { describe, expect, it } from "vitest";

import {
  STUDENT_SHEET_CONTENT_CONTAINER_CLASS,
  STUDENT_SHEET_CURVE_TABLE_LAYOUT_CLASS,
} from "./student-sheet-layout";

describe("student sheet layout constants", () => {
  it("keeps the content container and curve/table layout in sync", () => {
    expect(STUDENT_SHEET_CONTENT_CONTAINER_CLASS).toContain("max-w-4xl");
    expect(STUDENT_SHEET_CONTENT_CONTAINER_CLASS).toContain("2xl:max-w-6xl");
    expect(STUDENT_SHEET_CURVE_TABLE_LAYOUT_CLASS).toContain("flex flex-col gap-6");
    expect(STUDENT_SHEET_CURVE_TABLE_LAYOUT_CLASS).toContain("2xl:grid-cols-2");
  });
});
