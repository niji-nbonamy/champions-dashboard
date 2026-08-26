---
title: '2-2 Manual Student Add & Roster List'
type: 'feature'
created: '2026-08-26'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'cb64d3502e25979d796fcc53bd6c5c8a59455192'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/roster-import.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Teachers who already have a roster (CSV import or mid-year) cannot add individual students — the Élèves tab is a stub and no manual-add path exists (FR5). Config already directs them here when the roster is non-empty.

**Approach:** Extract shared display-name validation/normalization from roster-import domain logic, add `listActiveStudents` and `addStudent` application services, and replace the Élèves stub with a server-rendered active roster list plus a manual-add form using the existing Server Action + `useActionState` pattern. New students get `level = null`, `archived = false`.

## Boundaries & Constraints

**Always:**
- Manual add on Élèves tab only; one `display_name` per submit (FR5, roster-import.md).
- Trim whitespace on names; reject empty after trim.
- Max name length 200 chars (same as CSV, `ROSTER_CSV_MAX_DISPLAY_NAME_LENGTH`).
- Duplicate names within the class (case-insensitive trim) rejected with French message listing the conflicting name — same normalization as CSV import (`normalizeDuplicateKey`).
- Inserts scoped to authenticated teacher's `classId` via `getTeacherClass` (NFR1).
- Mutations: Server Action → `addStudent` service → domain validation → DB insert (AD-3).
- No `level` assigned at add; no `LevelHistoryEntry` (story 2.3).
- List shows active students only (`archived = false`), sorted alphabetically by `display_name` (French locale).
- Each row shows `display_name` and level status: `LevelBadge` when level is set; plain text « Niveau non assigné » when null (not the « niveau requis » badge — story 2.3).
- French UI microcopy on Élèves (NFR14).
- Do not log student names in server info logs (NFR10).
- Success message after add: « Élève ajouté. »

**Ask First:**
- Add DB unique index on `(class_id, lower(trim(display_name)))` vs application-only duplicate check (default: application check matching CSV; defer DB constraint if migration risk).

**Never:**
- Color-dot level picker, tab badge for unassigned count (story 2.3).
- Archiving, editing, or deleting students (story 2.6).
- CSV re-import when roster exists (unchanged from 2.1).
- Empty-roster CTA to Config (story 2.7).
- Client-side-only validation without server re-check.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy add | Valid unique name | One `students` row; appears in list with « Niveau non assigné » | Success toast/message |
| Trim name | `"  DUPONT Marie  "` | Stored as `DUPONT Marie` | N/A |
| Empty name | Whitespace only | No DB change | « Saisissez le nom de l'élève. » |
| Too long | Name > 200 chars | No DB change | « Nom trop long (max 200 caractères). » |
| Duplicate | Existing `dupont marie`, add `DUPONT Marie` | No DB change | « Un élève avec ce nom existe déjà : {name}. » |
| List roster | 3 active, 1 archived | List shows 3 with name + level status | N/A |
| Empty roster | Zero active students | Empty state message + add form still visible | N/A |
| Unauthenticated | No session | Redirect `/login` | N/A |
| No class | Session without class | Redirect `/onboarding/class` | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/students/page.tsx` -- **MODIFY** replace stub: load roster server-side, render list + add form. [`page.tsx:1`](../../champions-app/app/(dashboard)/students/page.tsx#L1)
- `champions-app/app/(dashboard)/students/actions.ts` -- **CREATE** `addStudentAction`: auth → class → read `display_name` from FormData → service → `revalidatePath("/students")`.
- `champions-app/app/(dashboard)/students/add-student-form.tsx` -- **CREATE** client form mirroring `csv-import-form.tsx` pattern (`useActionState`, `role="alert"`, `pending`).
- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **CREATE** presentational list: name + `LevelBadge` or « Niveau non assigné ».
- `champions-app/lib/domain/student-display-name.ts` -- **CREATE** extract `normalizeDisplayName`, `normalizeDuplicateKey`, max-length and empty checks; export French error constants for manual add.
- `champions-app/lib/domain/student-display-name.test.ts` -- **CREATE** unit tests for validation matrix.
- `champions-app/lib/domain/roster-import.ts` -- **MODIFY** import shared normalization from `student-display-name.ts` (DRY with CSV path). [`roster-import.ts:97`](../../champions-app/lib/domain/roster-import.ts#L97)
- `champions-app/lib/services/list-active-students.ts` -- **CREATE** query active students for class, ordered by `display_name`.
- `champions-app/lib/services/list-active-students.test.ts` -- **CREATE** mocked DB tests including archived filter.
- `champions-app/lib/services/add-student.ts` -- **CREATE** validate → check duplicate against active roster → insert single row.
- `champions-app/lib/services/add-student.test.ts` -- **CREATE** success, duplicate reject, validation errors.
- `champions-app/lib/db/schema.ts` -- **READ** `students` table already exists. [`schema.ts:24`](../../champions-app/lib/db/schema.ts#L24)
- `champions-app/lib/services/get-teacher-class.ts` -- **READ** resolve `classId`. [`get-teacher-class.ts:12`](../../champions-app/lib/services/get-teacher-class.ts#L12)
- `champions-app/lib/services/count-active-students.ts` -- **READ** archived filter pattern. [`count-active-students.ts:12`](../../champions-app/lib/services/count-active-students.ts#L12)
- `champions-app/app/(dashboard)/config/actions.ts` -- **READ** Server Action auth/class guard pattern. [`actions.ts:25`](../../champions-app/app/(dashboard)/config/actions.ts#L25)
- `champions-app/app/(dashboard)/config/csv-import-form.tsx` -- **READ** form UX pattern. [`csv-import-form.tsx:17`](../../champions-app/app/(dashboard)/config/csv-import-form.tsx#L17)
- `champions-app/components/ui/level-badge.tsx` -- **READ** render assigned levels. [`level-badge.tsx:29`](../../champions-app/components/ui/level-badge.tsx#L29)
- `champions-app/app/(dashboard)/layout.tsx` -- **READ** auth/class guards already applied. [`layout.tsx:15`](../../champions-app/app/(dashboard)/layout.tsx#L15)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/student-display-name.ts` -- Shared name validation/normalization + French errors -- DRY with CSV import.
- [x] `champions-app/lib/domain/student-display-name.test.ts` -- Unit tests for I/O matrix edge cases -- regression guard.
- [x] `champions-app/lib/domain/roster-import.ts` -- Reuse shared normalization module -- avoid drift between CSV and manual add.
- [x] `champions-app/lib/services/list-active-students.ts` -- Query active roster sorted by name -- list data layer.
- [x] `champions-app/lib/services/list-active-students.test.ts` -- Mocked DB tests -- archived filter coverage.
- [x] `champions-app/lib/services/add-student.ts` -- Validate + duplicate check + insert -- AD-3 application layer.
- [x] `champions-app/lib/services/add-student.test.ts` -- Service tests -- success and rejection paths.
- [x] `champions-app/app/(dashboard)/students/actions.ts` -- Server Action entry point -- presentation layer.
- [x] `champions-app/app/(dashboard)/students/add-student-form.tsx` -- Manual add UI -- Élèves tab UX.
- [x] `champions-app/app/(dashboard)/students/roster-list.tsx` -- Roster list with level status -- FR5 list view.
- [x] `champions-app/app/(dashboard)/students/page.tsx` -- Wire list + form on Élèves tab -- replace stub.
- [x] `champions-app/app/(dashboard)/students/actions.test.ts` -- Action tests mirroring config pattern -- auth/error coverage.
- [x] `champions-app/app/(dashboard)/students/page.test.tsx` -- Page render tests -- list, empty state, form presence.

**Acceptance Criteria:**
- Given I am on the Élèves tab, when I add a student manually with a display name, then a new Student record is created on my active roster with no level assigned (FR5).
- Given a student was added or imported, when I view the Élèves tab, then they appear in the roster list with their name and level status (assigned badge or « Niveau non assigné »).
- Given my class has active and archived students, when I view the Élèves tab, then only active (non-archived) students are listed.
- Given an active student named `DUPONT Marie` exists, when I add `dupont marie`, then the add is rejected with a duplicate error and no new row is created.
- Given I submit an empty or whitespace-only name, when I submit the form, then I see a validation error and no student is created.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new domain, service, action, and page tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Log in with a class → Élèves shows roster (or empty state) and add form → add one student → appears in list with « Niveau non assigné ».
- Attempt duplicate name → error shown, list unchanged.
- Config tab with existing roster still shows message pointing to Élèves for manual add.

## Suggested Review Order

**Name validation (shared domain)**

- Single module for trim, length, and duplicate-key normalization used by CSV and manual add
  [`student-display-name.ts:37`](../../champions-app/lib/domain/student-display-name.ts#L37)

- CSV import reuses shared normalization to prevent drift
  [`roster-import.ts:1`](../../champions-app/lib/domain/roster-import.ts#L1)

**Add orchestration**

- Validate name, check active roster for duplicates, insert one row
  [`add-student.ts:39`](../../champions-app/lib/services/add-student.ts#L39)

**Roster query**

- Active students only, French locale sort after fetch
  [`list-active-students.ts:38`](../../champions-app/lib/services/list-active-students.ts#L38)

**Élèves UI & server action**

- Auth/class guards, add service call, revalidate students and config
  [`actions.ts:275`](../../champions-app/app/(dashboard)/students/actions.ts#L275)

- Form with accessibility, max length, reset on success
  [`add-student-form.tsx:31`](../../champions-app/app/(dashboard)/students/add-student-form.tsx#L31)

- Roster list with level badge or unassigned label
  [`roster-list.tsx:480`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L480)

- Server page wiring list + form
  [`page.tsx:8`](../../champions-app/app/(dashboard)/students/page.tsx#L8)

**Tests**

- Domain, service, action, and UI coverage for I/O matrix
  [`student-display-name.test.ts:35`](../../champions-app/lib/domain/student-display-name.test.ts#L35)

  [`add-student.test.ts:51`](../../champions-app/lib/services/add-student.test.ts#L51)

  [`actions.test.ts:199`](../../champions-app/app/(dashboard)/students/actions.test.ts#L199)

### Review Findings

- [x] [Review][Patch] Tri locale FR via `localeCompare` après requête — [`list-active-students.ts:51`](../../champions-app/lib/services/list-active-students.ts#L51)
- [x] [Review][Patch] `revalidatePath("/config")` après ajout manuel — [`actions.ts:297`](../../champions-app/app/(dashboard)/students/actions.ts#L297)
- [x] [Review][Patch] Tests action doublon et nom trop long — [`actions.test.ts:221`](../../champions-app/app/(dashboard)/students/actions.test.ts#L221)
- [x] [Review][Patch] Accessibilité formulaire (`maxLength`, `aria-invalid`, reset) — [`add-student-form.tsx:47`](../../champions-app/app/(dashboard)/students/add-student-form.tsx#L47)
- [x] [Review][Patch] Tests UI formulaire et liste — [`add-student-form.test.tsx:27`](../../champions-app/app/(dashboard)/students/add-student-form.test.tsx#L27)
- [x] [Review][Defer] Atomicité TOCTOU ajout manuel sans contrainte DB unique — accepté MVP (story 2-1)
- [x] [Review][Defer] `auth()` redondant dans `page.tsx` vs layout — pattern existant Config
