import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { classes } from "@/lib/db/schema";

export class ConfirmYearStartRosterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfirmYearStartRosterError";
  }
}

export class ClassNotFoundError extends ConfirmYearStartRosterError {
  constructor() {
    super("Classe introuvable.");
    this.name = "ClassNotFoundError";
  }
}

export async function confirmYearStartRoster(classId: string): Promise<void> {
  const db = getDb();
  const confirmedAt = new Date();

  const [updatedClass] = await db
    .update(classes)
    .set({ yearStartRosterConfirmedAt: confirmedAt })
    .where(eq(classes.id, classId))
    .returning({ id: classes.id });

  if (!updatedClass) {
    throw new ClassNotFoundError();
  }
}
