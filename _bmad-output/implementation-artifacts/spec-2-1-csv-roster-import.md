---
title: '2-1 CSV Roster Import'
type: 'feature'
created: '2026-08-26'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'db3f187ae765d08d93cd431a80826b6c5a83420b'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/roster-import.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Teachers with a Class but no students cannot populate their roster — Config tab is a stub and no `students` table exists. Year setup (levels, matrix, dictations) is blocked (FR3, CAP-3).

**Approach:** Add the `students` table, pure CSV parse/validate in `lib/domain/roster-import`, an application service that bulk-inserts scoped to `classId`, and a Config-tab upload form with French error surfacing. Import runs only when the roster is empty; created students have `level = null` and `archived = false`.

## Boundaries & Constraints

**Always:**
- CSV format: one column, header exactly `NOM + prénom`, UTF-8, one student name per row (FR3, roster-import.md).
- Empty rows skipped silently after parse.
- Duplicate names within the file (case-insensitive trim) reject the **entire** import and list duplicates (FR4).
- Non-UTF-8 → « Fichier non UTF-8. Réexportez depuis votre logiciel. » (FR4).
- Wrong header or extra columns → « Format CSV invalide. Une seule colonne avec l'en-tête « NOM + prénom » est requise. »
- Zero valid rows after parse → « Aucun élève valide dans le fichier. »
- Duplicate import rejection lists names: « Doublons détectés : {names}. »
- Import only when class has zero active students (`archived = false`); otherwise block with « La liste d'élèves existe déjà. Utilisez l'onglet Élèves pour ajouter des élèves. »
- All inserts scoped to authenticated teacher's `classId` via `getTeacherClass` (NFR1, AD-1).
- Mutations: Server Action → `importRosterFromCsv` service → domain validation → single DB transaction (AD-3).
- No `level` assigned at import; no `LevelHistoryEntry` in this story (FR7, story 2.3).
- French UI on Config import section (NFR14).
- Do not log student names in server info logs (NFR10).

**Ask First:**
- Max upload file size cap (default propose 512 KB).
- Whether header match is case-sensitive (default: exact `NOM + prénom` after trim).
- Replacing or merging roster on re-import when students already exist (default: blocked).

**Never:**
- Year-start wizard auto-open after import (story 2.5).
- Manual add UI, roster list, level dots (stories 2.2–2.3).
- Word-count matrix, year reset, archiving.
- Client-side-only validation without server re-check.
- Partial import when validation fails.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid import | Empty roster; UTF-8 CSV with header `NOM + prénom` and N name rows | N `students` rows created with `display_name` from each row, `level` null, `archived` false; success message « {N} élèves importés. » | N/A |
| Empty rows | Rows with only whitespace | Skipped; valid rows still imported | N/A |
| Non-UTF-8 | Latin-1 or invalid byte sequences | No DB changes | Encoding message (FR4) |
| Wrong header | Header `Nom` or missing | No DB changes | Format message |
| Extra columns | `NOM + prénom,Level` two-column file | No DB changes | Format message |
| In-file duplicates | `DUPONT Marie` and `dupont marie` | No DB changes | Duplicate message listing both normalized keys |
| Zero valid rows | Header only or all empty rows | No DB changes | Empty-roster message |
| Roster not empty | One or more active students exist | Import UI disabled or submit rejected | « La liste d'élèves existe déjà… » |
| Unauthenticated | No session | Redirect `/login` | N/A |
| No class | Session without class | Redirect `/onboarding/class` | N/A |
| Missing file | Submit without file selected | No DB changes | « Sélectionnez un fichier CSV. » |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **MODIFY** add `students` table (`id`, `class_id` FK → `classes.id`, `display_name`, nullable `level` text, `archived` boolean default false, `created_at`). [`schema.ts:12`](../../champions-app/lib/db/schema.ts#L12)
- `champions-app/lib/domain/roster-import.ts` -- **CREATE** pure parse/validate: UTF-8 check, header/column rules, duplicate detection, French error constants, `parseRosterCsv(bytes)` → `{ names }` or `{ error }`.
- `champions-app/lib/domain/roster-import.test.ts` -- **CREATE** matrix tests for all validation branches and happy path.
- `champions-app/lib/services/count-active-students.ts` -- **CREATE** `countActiveStudents(classId)` where `archived = false` — empty-roster gate.
- `champions-app/lib/services/import-roster-csv.ts` -- **CREATE** gate empty roster → parse → transactional bulk insert; export typed errors for action mapping.
- `champions-app/lib/services/import-roster-csv.test.ts` -- **CREATE** mocked DB tests: success, duplicate reject, non-empty roster block.
- `champions-app/lib/services/get-teacher-class.ts` -- **READ** resolve `classId` from `teacherId`. [`get-teacher-class.ts:12`](../../champions-app/lib/services/get-teacher-class.ts#L12)
- `champions-app/app/(dashboard)/config/page.tsx` -- **MODIFY** server component: load active student count; show import section when zero else read-only message.
- `champions-app/app/(dashboard)/config/actions.ts` -- **CREATE** `importRosterCsvAction`: auth → class → read `File` from FormData → service → return error or revalidate + success state.
- `champions-app/app/(dashboard)/config/csv-import-form.tsx` -- **CREATE** client form: `useActionState`, `input type="file" accept=".csv,text/csv"`, `role="alert"` on errors; mirror onboarding form pattern.
- `champions-app/app/onboarding/class/class-form.tsx` -- **READ** `useActionState` + pending + alert pattern. [`class-form.tsx`](../../champions-app/app/onboarding/class/class-form.tsx)
- `champions-app/app/(dashboard)/layout.tsx` -- **READ** auth/class guards already applied. [`layout.tsx:19`](../../champions-app/app/(dashboard)/layout.tsx#L19)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` -- Define `students` table per ER diagram -- persistence foundation.
- [x] `champions-app/lib/domain/roster-import.ts` -- Pure CSV parse and validation with French error constants -- AD-4 roster-import domain module.
- [x] `champions-app/lib/domain/roster-import.test.ts` -- Unit tests covering I/O matrix edge cases -- regression guard.
- [x] `champions-app/lib/services/count-active-students.ts` -- Active roster count helper -- empty-roster gate.
- [x] `champions-app/lib/services/import-roster-csv.ts` -- Orchestrate parse + transactional insert -- AD-3 application layer.
- [x] `champions-app/lib/services/import-roster-csv.test.ts` -- Service tests with mocked DB -- success and rejection paths.
- [x] `champions-app/app/(dashboard)/config/actions.ts` -- Server Action for file upload -- presentation entry point.
- [x] `champions-app/app/(dashboard)/config/csv-import-form.tsx` -- Upload UI with French labels -- Config tab UX.
- [x] `champions-app/app/(dashboard)/config/page.tsx` -- Replace stub with import section or existing-roster message -- FR3 delivery surface.

**Acceptance Criteria:**
- Given I am on the Config tab with an empty roster, when I upload a valid UTF-8 CSV with header `NOM + prénom` and one student per row, then Student records are created scoped to my Class with `display_name` from each row and no level assigned (FR3).
- Given a CSV with empty rows, when I import, then empty rows are skipped and valid rows are still created.
- Given a non-UTF-8 file, when I import, then I see « Fichier non UTF-8. Réexportez depuis votre logiciel. » and no students are created (FR4).
- Given a wrong header or extra columns, when I import, then I see the format error and no students are created (FR4).
- Given duplicate names (case-insensitive trim), when I import, then the entire import is rejected, duplicates are listed, and no students are created (FR4).
- Given zero valid rows after parse, when I import, then I see the empty-roster error and no students are created (FR4).

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including roster-import domain and service tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.
- `cd champions-app && npm run db:push` -- expected: `students` table created (requires `.env.local` with Neon direct URL).

**Manual checks (if no CLI):**
- Log in with a class and empty roster → Config shows CSV upload → import sample file → count active students matches file rows.
- Re-attempt import after success → blocked with existing-roster message.

## Suggested Review Order

**CSV validation (pure domain)**

- Single entry point for UTF-8, header, duplicates, and empty rows
  [`roster-import.ts:99`](../../champions-app/lib/domain/roster-import.ts#L99)

**Import orchestration**

- Empty-roster gate, parse, and bulk insert scoped to class
  [`import-roster-csv.ts:30`](../../champions-app/lib/services/import-roster-csv.ts#L30)

**Persistence**

- `students` table with nullable level and archived flag
  [`schema.ts:24`](../../champions-app/lib/db/schema.ts#L24)

**Config UI & server action**

- Auth/class guards, file upload, redirect with success count
  [`actions.ts:25`](../../champions-app/app/(dashboard)/config/actions.ts#L25)

- Conditional import form vs roster-exists message
  [`page.tsx:12`](../../champions-app/app/(dashboard)/config/page.tsx#L12)

**Tests**

- Domain matrix covering encoding, format, duplicates, empty file
  [`roster-import.test.ts:34`](../../champions-app/lib/domain/roster-import.test.ts#L34)

- Service tests for success, non-empty roster, invalid CSV
  [`import-roster-csv.test.ts:37`](../../champions-app/lib/services/import-roster-csv.test.ts#L37)
