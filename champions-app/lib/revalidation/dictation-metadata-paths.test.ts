import { afterEach, describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

import { revalidateDictationMetadataPaths } from "./dictation-metadata-paths";

const dictationId = "880e8400-e29b-41d4-a716-446655440003";
const studentId = "770e8400-e29b-41d4-a716-446655440002";

describe("revalidateDictationMetadataPaths", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates dictation list, detail, and mobile routes", () => {
    revalidateDictationMetadataPaths(dictationId, []);

    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    expect(revalidatePath).toHaveBeenCalledWith(`/dictations/${dictationId}`);
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dictations/${dictationId}/mobile`
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dictations/${dictationId}/mobile/summary`
    );
  });

  it("revalidates student dossier and presentation paths for affected students", () => {
    revalidateDictationMetadataPaths(dictationId, [studentId, studentId]);

    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith(
      `/students/${studentId}/present`
    );
    expect(revalidatePath).toHaveBeenCalledTimes(6);
  });
});
