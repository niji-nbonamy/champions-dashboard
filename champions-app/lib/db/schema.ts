import {
  boolean,
  date,
  index,
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

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("password_reset_tokens_token_hash_idx").on(table.tokenHash),
    index("password_reset_tokens_teacher_id_idx").on(table.teacherId),
  ]
);

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

export const dictationEntries = pgTable(
  "dictation_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dictationId: uuid("dictation_id")
      .notNull()
      .references(() => dictations.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    levelAtSave: text("level_at_save").notNull(),
    wordDenominator: integer("word_denominator").notNull(),
    globalPercent: integer("global_percent").notNull(),
    errorsC: integer("errors_c").notNull().default(0),
    errorsH: integer("errors_h").notNull().default(0),
    errorsA: integer("errors_a").notNull().default(0),
    errorsM: integer("errors_m").notNull().default(0),
    errorsP: integer("errors_p").notNull().default(0),
    errorsI: integer("errors_i").notNull().default(0),
    errorsO: integer("errors_o").notNull().default(0),
    errorsN: integer("errors_n").notNull().default(0),
    errorsS: integer("errors_s").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("dictation_entries_dictation_student_uidx").on(
      table.dictationId,
      table.studentId
    ),
  ]
);

export const pendingPromotions = pgTable(
  "pending_promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    targetLevel: text("target_level").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("pending_promotions_student_uidx").on(table.studentId),
  ]
);
