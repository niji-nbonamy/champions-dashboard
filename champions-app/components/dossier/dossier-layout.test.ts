import { describe, expect, it } from "vitest";

import {
  DOSSIER_CONTENT_CONTAINER_CLASS,
  DOSSIER_CURVE_TABLE_LAYOUT_CLASS,
} from "./dossier-layout";

describe("dossier layout constants", () => {
  it("keeps the content container and curve/table layout in sync", () => {
    expect(DOSSIER_CONTENT_CONTAINER_CLASS).toContain("max-w-4xl");
    expect(DOSSIER_CONTENT_CONTAINER_CLASS).toContain("2xl:max-w-6xl");
    expect(DOSSIER_CURVE_TABLE_LAYOUT_CLASS).toContain("flex flex-col gap-6");
    expect(DOSSIER_CURVE_TABLE_LAYOUT_CLASS).toContain("2xl:grid-cols-2");
  });
});
