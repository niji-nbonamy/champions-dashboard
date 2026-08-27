import { describe, expect, it } from "vitest";

import {
  parseRosterCsv,
  ROSTER_CSV_EMPTY_ROSTER_ERROR,
  ROSTER_CSV_ENCODING_ERROR,
  ROSTER_CSV_FORMAT_ERROR,
  ROSTER_CSV_LEGACY_HEADER,
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
  it("parses a valid single-column roster without a header", () => {
    const csv = "DUPONT Marie\nMARTIN Lucas";
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({
      ok: true,
      names: ["DUPONT Marie", "MARTIN Lucas"],
    });
  });

  it("skips a legacy header row when present", () => {
    const csv = `${ROSTER_CSV_LEGACY_HEADER}\nDUPONT Marie\nMARTIN Lucas`;
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({
      ok: true,
      names: ["DUPONT Marie", "MARTIN Lucas"],
    });
  });

  it("skips empty rows", () => {
    const csv = "DUPONT Marie\n\n   \nMARTIN Lucas";
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({
      ok: true,
      names: ["DUPONT Marie", "MARTIN Lucas"],
    });
  });

  it("rejects non-UTF-8 files", () => {
    const bytes = toLatin1Bytes("DUPONT Émilie");
    const result = parseRosterCsv(bytes);

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_ENCODING_ERROR });
  });

  it("rejects extra columns", () => {
    const csv = "DUPONT Marie,yellow";
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_FORMAT_ERROR });
  });

  it("rejects in-file duplicates case-insensitively", () => {
    const csv = "DUPONT Marie\ndupont marie";
    const result = parseRosterCsv(toBytes(csv));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Doublons détectés");
      expect(result.error).toContain("DUPONT Marie");
      expect(result.error).toContain("dupont marie");
    }
  });

  it("accepts UTF-8 files with a byte-order mark", () => {
    const csv = `\uFEFFDUPONT Marie`;
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({
      ok: true,
      names: ["DUPONT Marie"],
    });
  });

  it("rejects display names longer than 200 characters", () => {
    const longName = "A".repeat(201);
    const csv = longName;
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_FORMAT_ERROR });
  });

  it("rejects when zero valid rows remain", () => {
    const csv = "   \n";
    const result = parseRosterCsv(toBytes(csv));

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_EMPTY_ROSTER_ERROR });
  });

  it("rejects legacy header-only files", () => {
    const result = parseRosterCsv(toBytes(ROSTER_CSV_LEGACY_HEADER));

    expect(result).toEqual({ ok: false, error: ROSTER_CSV_EMPTY_ROSTER_ERROR });
  });
});
