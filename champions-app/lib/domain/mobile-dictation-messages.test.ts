import { describe, expect, it } from "vitest";

import {
  formatMobileHubCaptureAriaLabel,
  formatMobileHubSummaryAriaLabel,
  MOBILE_NO_LEVELED_STUDENTS_MESSAGE,
} from "./mobile-dictation-messages";

describe("mobile-dictation-messages", () => {
  it("exposes the shared zero-leveled status copy", () => {
    expect(MOBILE_NO_LEVELED_STUDENTS_MESSAGE).toBe(
      "Aucun élève nivelé pour saisir."
    );
  });

  it("formats contextual hub link labels", () => {
    expect(formatMobileHubCaptureAriaLabel("Dictée 1")).toBe(
      "Saisir les erreurs pour Dictée 1"
    );
    expect(formatMobileHubSummaryAriaLabel("Dictée 1")).toBe(
      "Voir le résumé de Dictée 1"
    );
  });
});
