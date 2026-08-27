import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id")
    .notNull()
    .unique()
    .references(() => teachers.id),
  schoolYearLabel: text("school_year_label").notNull(),
  yearStartRosterConfirmedAt: timestamp("year_start_roster_confirmed_at", {
    withTimezone: true,
  }),
  yearStartWizardCompletedAt: timestamp("year_start_wizard_completed_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id),
  displayName: text("display_name").notNull(),
  level: text("level"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const levelHistoryEntries = pgTable("level_history_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  level: text("level").notNull(),
  action: text("action").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const wordCountMatrixRows = pgTable(
  "word_count_matrix_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    dictationLabelKey: text("dictation_label_key").notNull(),
    wordsYellow: integer("words_yellow").notNull(),
    wordsGreen: integer("words_green").notNull(),
    wordsViolet: integer("words_violet").notNull(),
    wordsGold: integer("words_gold").notNull(),
  },
  (table) => [
    uniqueIndex("word_count_matrix_rows_class_label_uidx").on(
      table.classId,
      table.dictationLabelKey
    ),
  ]
);

export const dictations = pgTable("dictations", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id),
  label: text("label").notNull(),
  dictationLabelKey: text("dictation_label_key").notNull(),
  dictationDate: date("dictation_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
