import { describe, expect, it } from "vitest";

import { parseSpeechTherapyFormValue } from "./student-speech-therapy";

describe("parseSpeechTherapyFormValue", () => {
  it("returns true only for the string true", () => {
    expect(parseSpeechTherapyFormValue("true")).toBe(true);
  });

  it("returns false for any other value", () => {
    expect(parseSpeechTherapyFormValue("false")).toBe(false);
    expect(parseSpeechTherapyFormValue(null)).toBe(false);
    expect(parseSpeechTherapyFormValue("on")).toBe(false);
  });
});
