"use client";

import { useEffect } from "react";

import { STUDENT_SHEET_PRESENTATION_RETURN_FOCUS_KEY } from "./student-sheet-presentation-link";

export function PresentationReturnFocus() {
  useEffect(() => {
    const focusId = sessionStorage.getItem(STUDENT_SHEET_PRESENTATION_RETURN_FOCUS_KEY);

    if (!focusId) {
      return;
    }

    sessionStorage.removeItem(STUDENT_SHEET_PRESENTATION_RETURN_FOCUS_KEY);
    document.getElementById(focusId)?.focus();
  }, []);

  return null;
}
