import { describe, expect, it } from "vitest";

import {
  DOSSIER_CONTENT_CONTAINER_CLASS,
  DOSSIER_CURVE_TABLE_GRID_CLASS,
} from "./dossier-layout";

describe("dossier layout constants", () => {
  it("keeps the content container and curve/table stack in sync", () => {
    expect(DOSSIER_CONTENT_CONTAINER_CLASS).toContain("max-w-4xl");
    expect(DOSSIER_CURVE_TABLE_GRID_CLASS).toContain("flex flex-col gap-6");
  });
});
