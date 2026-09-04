export const STUDENT_SPEECH_THERAPY_LABEL = "Suivi orthophoniste";

export const SET_STUDENT_SPEECH_THERAPY_GENERIC_ERROR =
  "Mise à jour du suivi orthophoniste impossible. Réessayez.";

export function parseSpeechTherapyFormValue(
  rawValue: FormDataEntryValue | null
): boolean {
  return rawValue === "true";
}
