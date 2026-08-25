import { eq } from "drizzle-orm";

import {
  CLASS_ONBOARDING_ERROR_MESSAGE,
  validateSchoolYearLabel,
} from "@/lib/domain/class";
import { getDb } from "@/lib/db";
import { classes } from "@/lib/db/schema";

import { getTeacherClass, type TeacherClass } from "./get-teacher-class";

export class ClassCreationFailedError extends Error {
  constructor() {
    super(CLASS_ONBOARDING_ERROR_MESSAGE);
    this.name = "ClassCreationFailedError";
  }
}

export async function createClass(
  teacherId: string,
  schoolYearLabel: string
): Promise<TeacherClass> {
  const label = validateSchoolYearLabel(schoolYearLabel);
  if (!label) {
    throw new ClassCreationFailedError();
  }

  const existing = await getTeacherClass(teacherId);
  if (existing) {
    throw new ClassCreationFailedError();
  }

  const db = getDb();

  try {
    const [created] = await db
      .insert(classes)
      .values({
        teacherId,
        schoolYearLabel: label,
      })
      .returning({
        id: classes.id,
        teacherId: classes.teacherId,
        schoolYearLabel: classes.schoolYearLabel,
      });

    if (!created) {
      throw new ClassCreationFailedError();
    }

    return created;
  } catch (error) {
    if (error instanceof ClassCreationFailedError) {
      throw error;
    }

    const duplicate = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.teacherId, teacherId))
      .limit(1);

    if (duplicate.length > 0) {
      throw new ClassCreationFailedError();
    }

    throw new ClassCreationFailedError();
  }
}
