"use client";

import { useEffect } from "react";

import { DOSSIER_PRESENTATION_RETURN_FOCUS_KEY } from "./dossier-presentation-link";

export function PresentationReturnFocus() {
  useEffect(() => {
    const focusId = sessionStorage.getItem(DOSSIER_PRESENTATION_RETURN_FOCUS_KEY);

    if (!focusId) {
      return;
    }

    sessionStorage.removeItem(DOSSIER_PRESENTATION_RETURN_FOCUS_KEY);
    document.getElementById(focusId)?.focus();
  }, []);

  return null;
}
