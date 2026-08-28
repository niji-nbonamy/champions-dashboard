---
title: '4-1 Auto-Generated Student Dossier'
type: 'feature'
created: '2026-08-28'
status: 'done'
review_loop_iteration: 0
baseline_commit: '3b8739dfce84513944ebae67775b0c3ae25836b0'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 3 saves per-student dictation entries on the class grid, but teachers have no per-student view — they must mentally assemble history across multiple dictation pages (FR23).

**Approach:** Add a class-scoped dossier route at `/students/[id]` reachable from the Élèves roster. Server-side services load the student and all saved `dictation_entries` for that student. Render a dossier shell (header, empty curve placeholder, flat history list). Story 4.2 replaces the placeholder with the hero curve and adds the collapsible detail table.

## Boundaries & Constraints

**Always:**
- Auth + class scope unchanged (NFR1). Student lookup and history queries must filter by teacher's `classId` via `students` and `dictations` joins — same pattern as `getDictationEntriesByDictationId`.
- Dossier opened from Élèves tab via clickable student name → `/students/{id}`.
- Header: student `displayName` in `text-display` (28px weight 300); show `LevelBadge` when level is set; show « Archivé » label when `archived === true` (UX-DR28).
- History list shows every saved entry for the student: dictation label, formatted date, `globalPercent` %, `levelAtSave` badge — ordered newest dictation date first (match `listDictations` sort).
- Display persisted snapshot fields only — do not recompute scores via `lib/domain/scoring`.
- Empty state (zero entries): « Aucune dictée enregistrée. » (`role="status"`) plus a static empty curve placeholder box (no chart library, no trend, no %).
- Archived students: dossier remains viewable read-only; `notFound()` only when student ID is invalid or belongs to another class.
- « Retour aux élèves » back link to `/students`. French microcopy only. No student names in server logs (NFR10).

**Ask First:**
- Linking dictation rows in the history list to `/dictations/{id}` — default **exclude** (read-only dossier summary; grid navigation stays on Dictées tab).

**Never:**
- Hero curve rendering, collapsible per-category table, skeleton loader, `max-w-4xl` side-by-side layout (story 4.2).
- Promotion banner D1, validate/refuse, manual level override, Alertes, presentation mode (stories 4.3–4.7).
- Schema changes or new DB tables.
- Client-side aggregation of dictation data.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open dossier | Student has ≥1 saved entry | Header + placeholder + history list with all entries | N/A |
| No dictations | Student exists, zero entries | « Aucune dictée enregistrée. » + empty curve placeholder; no history list | N/A |
| Archived student | `archived === true`, entries exist | Same dossier view; « Archivé » label; read-only (no level picker) | N/A |
| Invalid UUID | Malformed `[id]` param | `notFound()` | N/A |
| Cross-class student | Valid UUID, wrong `classId` | `notFound()` | N/A |
| Unauthenticated | No session | Redirect `/login` | N/A |
| No class | Session without class | Redirect `/onboarding/class` | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **MODIFY** wrap `displayName` in `Link` to `/students/{id}`; preserve archive/level UI. [`roster-list.tsx:57`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L57)
- `champions-app/app/(dashboard)/students/roster-list.test.tsx` -- **MODIFY** assert dossier `href` on student rows.
- `champions-app/app/(dashboard)/students/[id]/page.tsx` -- **CREATE** server page; pattern from [`dictations/[id]/page.tsx:42`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L42) (`auth`, `getTeacherClass`, `isValidUuidV4`, `notFound`).
- `champions-app/app/(dashboard)/students/[id]/page.test.tsx` -- **CREATE** mock services; cases: auth redirect, no class, bad UUID, cross-class, empty history, populated history, archived student.
- `champions-app/lib/services/get-class-student.ts` -- **CREATE** `getClassStudent(classId, studentId)` → `{ id, displayName, level, archived }` or `null`; join `students` on `classId` (do not reject archived).
- `champions-app/lib/services/get-class-student.test.ts` -- **CREATE** found, not found, wrong class.
- `champions-app/lib/services/get-student-dictation-history.ts` -- **CREATE** `getStudentDictationHistory(classId, studentId)` joining `dictation_entries` → `dictations` → filter `studentId` + `dictations.classId`; order `desc(dictationDate), asc(label)`.
- `champions-app/lib/services/get-student-dictation-history.test.ts` -- **CREATE** class-scope guard, sort order, empty array.
- `champions-app/components/dossier/curve-placeholder.tsx` -- **CREATE** static empty chart area (bordered box, optional muted axis hint); reused by 4.2.
- `champions-app/components/dossier/dictation-history-list.tsx` -- **CREATE** flat `<ul>` list; reuse `formatDictationDateForDisplay`, `LevelBadge`.
- `champions-app/lib/services/get-dictation-entries.ts` -- **READ** join pattern for class scoping. [`get-dictation-entries.ts:24`](../../champions-app/lib/services/get-dictation-entries.ts#L24)
- `champions-app/lib/domain/dictation.ts` -- **REUSE** `isValidUuidV4`, `formatDictationDateForDisplay`.
- `champions-app/middleware.ts` -- **READ** `/students/:path*` already protected. [`middleware.ts:16`](../../champions-app/middleware.ts#L16)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/get-class-student.ts` + test -- class-scoped student lookup -- page guard + header data.
- [x] `champions-app/lib/services/get-student-dictation-history.ts` + test -- per-student entry aggregation -- FR23 data layer.
- [x] `champions-app/components/dossier/curve-placeholder.tsx` -- static empty curve area -- UX-DR22 placeholder for 4.2 swap.
- [x] `champions-app/components/dossier/dictation-history-list.tsx` -- flat history list UI -- complete history without grid hopping.
- [x] `champions-app/app/(dashboard)/students/[id]/page.tsx` + test -- dossier shell wiring -- primary user-facing route.
- [x] `champions-app/app/(dashboard)/students/roster-list.tsx` + test -- Élèves → dossier navigation -- AC entry point.

**Acceptance Criteria:**
- Given a student has one or more saved dictations, when I open their dossier from the Élèves tab, then I see their complete dictation history without cross-referencing multiple grids (FR23).
- Given I open a student's dossier, when the page loads, then data is scoped to my Class only (NFR1).
- Given a student has no saved dictations, when I view their dossier, then I see « Aucune dictée enregistrée. » with an empty curve placeholder (UX-DR22).
- Given an archived student with dictation history, when I open their dossier from the Élèves tab, then I see the history read-only with an « Archivé » label (UX-DR28).

### Review Findings

- [x] [Review][Patch] Prop `linkToDossier={false}` pour désactiver les liens dossier dans l'onboarding [`roster-list.tsx:37`, `step-levels.tsx:24`]

- [x] [Review][Patch] Tie-breaker de tri supplémentaire [`get-student-dictation-history.ts:40`]
- [x] [Review][Patch] Test header LevelBadge en état vide [`page.test.tsx:112`]
- [x] [Review][Patch] Assertion prédicat innerJoin [`get-student-dictation-history.test.ts:86`]
- [x] [Review][Patch] Test élève archivé sans historique [`page.test.tsx:173`]
- [x] [Review][Patch] Test aria-label lien dossier [`roster-list.test.tsx:45`]

- [x] [Review][Defer] Parcours e2e Élèves → dossier — deferred, pre-existing
- [x] [Review][Defer] Auth/classe dupliqués layout + page — deferred, pre-existing
- [x] [Review][Defer] Promise.all pour requêtes parallèles — deferred, pre-existing
- [x] [Review][Defer] Tests unitaires composants dossier — deferred, pre-existing
- [x] [Review][Defer] Type ClassStudentRecord dupliqué — deferred, pre-existing

## Design Notes

`CurvePlaceholder` is intentionally a dumb static shell — story 4.2 mounts the real chart inside the same slot. Keep history as a flat list in 4.1; the collapsible per-category table arrives in 4.2.

`getStudentDictationHistory` inner-joins `dictations` on `classId` (not only `students.classId`) so a mismatched entry cannot leak across classes.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: new service, page, roster-link, and dossier component tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- From Élèves, click a student with saved dictations → dossier shows name, placeholder, and full history list. Repeat for a student with zero dictations → empty message + placeholder only.

## Spec Change Log

## Suggested Review Order

**Dossier page shell**

- Server page wires auth, class scope, and dossier layout.
  [`page.tsx:20`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L20)

**Data access**

- Class-scoped student lookup allows archived dossiers without blocking access.
  [`get-class-student.ts:13`](../../champions-app/lib/services/get-class-student.ts#L13)

- Per-student history joins dictations with stable newest-first ordering.
  [`get-student-dictation-history.ts:16`](../../champions-app/lib/services/get-student-dictation-history.ts#L16)

**UI components**

- Neutral empty curve slot reserved for story 4.2 chart.
  [`curve-placeholder.tsx:5`](../../champions-app/components/dossier/curve-placeholder.tsx#L5)

- Flat history list shows snapshot label, date, level, and percent.
  [`dictation-history-list.tsx:10`](../../champions-app/components/dossier/dictation-history-list.tsx#L10)

**Élèves navigation**

- Roster names link to the new dossier route.
  [`roster-list.tsx:59`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L59)

**Tests**

- Page tests cover auth guards, empty state, history, and archived read-only.
  [`page.test.tsx:68`](../../champions-app/app/(dashboard)/students/[id]/page.test.tsx#L68)

- Service tests pin classId and studentId query filters.
  [`get-class-student.test.ts:44`](../../champions-app/lib/services/get-class-student.test.ts#L44)
