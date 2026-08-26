import { describe, expect, it } from "vitest";

import {
  parseRosterCsv,
  ROSTER_CSV_EMPTY_ROSTER_ERROR,
  ROSTER_CSV_ENCODING_ERROR,
  ROSTER_CSV_FORMAT_ERROR,
  ROSTER_CSV_HEADER,
  isValidUtf8,
} from "./roster-import";

function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function toLatin1Bytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index);
  }
  return bytes;
}

describe("isValidUtf8", () => {
  it("accepts valid UTF-8 text", () => {
    expect(isValidUtf8(toBytes("DUPONT Marie"))).toBe(true);
  });

  it("rejects invalid UTF-8 byte sequences", () => {
    expect(isValidUtf8(new Uint8Array([0xff, 0xfe, 0xfd]))).toBe(false);
  });
});

describe("parseRosterCsv", () => {
  it("parses a valid single-column roster", () => {
    const csv = `${ROSTER_CSV_HEADER}\nDUPONT Marie\nMARTIN Lucas`;
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({
      ok: true,
      names: ["DUPONT Marie", "MARTIN Lucas"],
    });
  });

  it("skips empty rows", () => {
    const csv = `${ROSTER_CSV_HEADER}\nDUPONT Marie\n\n   \nMARTIN Lucas`;
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({
      ok: true,
      names: ["DUPONT Marie", "MARTIN Lucas"],
    });
  });

  it("rejects non-UTF-8 files", () => {
    const bytes = toLatin1Bytes(`${ROSTER_CSV_HEADER}\nDUPONT Émilie`);
    const result = parseRosterCsv(bytes);

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_ENCODING_ERROR });
  });

  it("rejects a wrong header", () => {
    const csv = "Nom\nDUPONT Marie";
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_FORMAT_ERROR });
  });

  it("rejects extra columns", () => {
    const csv = `${ROSTER_CSV_HEADER},Level\nDUPONT Marie,yellow`;
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_FORMAT_ERROR });
  });

  it("rejects in-file duplicates case-insensitively", () => {
    const csv = `${ROSTER_CSV_HEADER}\nDUPONT Marie\ndupont marie`;
    const result = parseRosterCsv(toBytes(csv));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Doublons détectés");
      expect(result.error).toContain("DUPONT Marie");
    }
  });

  it("rejects when zero valid rows remain", () => {
    const csv = `${ROSTER_CSV_HEADER}\n   \n`;
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_EMPTY_ROSTER_ERROR });
  });

  it("rejects header-only files", () => {
    const result = parseRosterCsv(toBytes(ROSTER_CSV_HEADER));

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_EMPTY_ROSTER_ERROR });
  });
});
