import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { classes } from "@/lib/db/schema";

export type TeacherClass = {
  id: string;
  teacherId: string;
  schoolYearLabel: string;
};

export async function getTeacherClass(
  teacherId: string
): Promise<TeacherClass | null> {
  const db = getDb();

  const [row] = await db
    .select({
      id: classes.id,
      teacherId: classes.teacherId,
      schoolYearLabel: classes.schoolYearLabel,
    })
    .from(classes)
    .where(eq(classes.teacherId, teacherId))
    .limit(1);

  return row ?? null;
}
