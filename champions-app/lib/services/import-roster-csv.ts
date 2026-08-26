import {
  formatRosterImportSuccessMessage,
  parseRosterCsv,
  ROSTER_CSV_ROSTER_EXISTS_ERROR,
} from "@/lib/domain/roster-import";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

import { countActiveStudents } from "./count-active-students";

export class RosterImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RosterImportError";
  }
}

export class RosterNotEmptyError extends RosterImportError {
  constructor() {
    super(ROSTER_CSV_ROSTER_EXISTS_ERROR);
    this.name = "RosterNotEmptyError";
  }
}

export type ImportRosterCsvResult = {
  importedCount: number;
  successMessage: string;
};

export async function importRosterFromCsv(
  classId: string,
  fileBytes: Uint8Array
): Promise<ImportRosterCsvResult> {
  const activeCount = await countActiveStudents(classId);
  if (activeCount > 0) {
    throw new RosterNotEmptyError();
  }

  const parsed = parseRosterCsv(fileBytes);
  if (!parsed.ok) {
    throw new RosterImportError(parsed.error);
  }

  const db = getDb();
  const rows = parsed.names.map((displayName) => ({
    classId,
    displayName,
    archived: false,
  }));

  await db.insert(students).values(rows);

  const importedCount = parsed.names.length;
  return {
    importedCount,
    successMessage: formatRosterImportSuccessMessage(importedCount),
  };
}
