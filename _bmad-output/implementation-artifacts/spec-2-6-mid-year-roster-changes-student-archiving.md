---
title: '2-6 Mid-Year Roster Changes & Student Archiving'
type: 'feature'
created: '2026-08-27'
status: 'done'
review_loop_iteration: 1
baseline_commit: '8182aa24dca3893221acf293178a765e6efc4842'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After year-start setup, teachers cannot reflect mid-year class changes: departing students have no archive path (only wizard hard-delete exists), and the Élèves tab shows active students only with no way to review archived ones (FR6, UX-DR28).

**Approach:** Add a class-scoped `archiveStudent` service and Server Action on the Élèves tab. Extend the roster list with an archive filter (actifs / archivés / tous), an « Archivé » badge on archived rows, and read-only archived rows. Reuse existing manual add + level picker for mid-year arrivals; data-layer active filters already exclude archived students from dictation grids.

## Boundaries & Constraints

**Always:**
- Mid-year add reuses `addStudent` + `LevelDotPicker` / `assignStudentLevel` — new students start with history from add date; no retroactive dictations (FR5, FR8).
- Archive sets `students.archived = true` (soft delete); **never** hard-delete a student with assigned level or any history (FR6, CAP-3).
- Archive action available only on **active** rows when `yearStartWizardCompletedAt` is set (post year-start); wizard removal stays `removeActiveStudent` hard-delete (story 2.5).
- Archived students: show « Archivé » label, display name + level badge read-only (no picker, no archive button), excluded from `listActiveStudents`, `listLeveledActiveStudents`, and nav unassigned badge counts.
- Élèves filter: three views — **Actifs** (default), **Archivés**, **Tous** — via URL search param `?filter=active|archived|all` (server-rendered).
- Archive button label « Archiver » per row on active view; success message « Élève archivé. »
- French microcopy; no school grade in labels (NFR14).
- Class-scoped auth via `getTeacherClass`; unauthenticated → `/login`; no class → `/onboarding/class`.
- Mutations: Server Action → service → DB update; `revalidatePath` on `/students`, `/dictations`, `/config`, `/onboarding/year-start` after archive.
- Do not log student names in server info logs (NFR10).
- Duplicate-name rule unchanged: name matching an **archived** student may be re-added as a new active row (story 2.2).

**Ask First:**
- Archive confirmation modal before action (default: yes — one-step confirm with student name).
- Whether to append a `levelHistoryEntries` row with `action: "archived"` on archive (default: no — `archived` flag is source of truth until dossier Epic 4).
- Filter UI control style (default: segmented button group under list heading).

**Never:**
- Unarchive / restore archived students (out of MVP scope).
- Student dossier page or inline dossier drill-down (Epic 4 — archived rows are list-only read-only here).
- Dictation grid UI changes (Epic 3 — exclusion is data-layer + revalidation only).
- Annual year reset (story 2.8).
- Reuse `removeActiveStudent` for mid-year departures.
- Client-only archive without server persistence.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mid-year add | Valid unique name on Élèves | New active row; assign level via picker; appears in active filter | Existing add validation errors |
| Mid-year add + level | Add then assign via dot picker | `level` set + `LevelHistoryEntry` `assigned`; eligible for `listLeveledActiveStudents` | « Assignation impossible. Réessayez. » |
| Archive active student | Wizard complete, active row with level | `archived=true`; removed from active list; visible under Archivés/Tous with « Archivé » badge | N/A |
| Archive unassigned | Active row, `level=null` | Archive allowed (departure before leveling) | N/A |
| Archive already archived | `archived=true` | No-op or not-found | « Élève introuvable. » |
| Wrong class | Student id from another class | No update | « Élève introuvable. » |
| Filter actifs | `?filter=active` | Active students only; archive buttons visible | Default when param absent |
| Filter archivés | `?filter=archived` | Archived rows only, read-only, « Archivé » badge | Empty: « Aucun élève archivé. » |
| Filter tous | `?filter=all` | Active + archived; archived rows read-only | N/A |
| Grid exclusion | Student archived | `listLeveledActiveStudents` omits them after revalidation | N/A (Epic 3 grid consumes same query) |
| Wizard incomplete | `yearStartWizardCompletedAt` null | No archive button on Élèves; wizard « Retirer » unchanged | N/A |
| Unauthenticated | No session | Redirect `/login` | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **READ** `students.archived` boolean already exists; no migration needed. [`schema.ts:45`](../../champions-app/lib/db/schema.ts#L45)
- `champions-app/lib/services/archive-student.ts` -- **CREATE** set `archived=true` scoped to classId; reject missing/wrong-class/already-archived.
- `champions-app/lib/services/archive-student.test.ts` -- **CREATE** success, not-found, already-archived, class-scope.
- `champions-app/lib/services/list-class-students.ts` -- **CREATE** query students by class + filter (`active`|`archived`|`all`), sorted by `display_name`.
- `champions-app/lib/services/list-class-students.test.ts` -- **CREATE** filter matrix + archived flag assertions.
- `champions-app/lib/services/list-active-students.ts` -- **READ** keep for callers needing active-only; may delegate to list-class-students. [`list-active-students.ts:24`](../../champions-app/lib/services/list-active-students.ts#L24)
- `champions-app/lib/services/list-leveled-active-students.ts` -- **READ** grid consumer already filters `archived=false`. [`list-leveled-active-students.ts:28`](../../champions-app/lib/services/list-leveled-active-students.ts#L28)
- `champions-app/lib/services/remove-active-student.ts` -- **READ** hard-delete wizard-only; do not extend. [`remove-active-student.ts:56`](../../champions-app/lib/services/remove-active-student.ts#L56)
- `champions-app/app/(dashboard)/students/actions.ts` -- **MODIFY** add `archiveStudentAction`; keep `addStudentAction` / `assignStudentLevelAction` revalidation paths.
- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **MODIFY** archived badge, read-only archived rows, per-row archive control on active rows.
- `champions-app/app/(dashboard)/students/roster-filter.tsx` -- **CREATE** client filter control syncing `?filter=` URL param.
- `champions-app/app/(dashboard)/students/page.tsx` -- **MODIFY** parse filter param, load `listClassStudents`, pass wizard-complete flag for archive visibility. [`page.tsx:33`](../../champions-app/app/(dashboard)/students/page.tsx#L33)
- `champions-app/lib/domain/student-display-name.ts` -- **MODIFY** add archive success/error French constants.
- `champions-app/app/onboarding/year-start/step-roster.tsx` -- **READ** row action pattern for archive button styling. [`step-roster.tsx:58`](../../champions-app/app/onboarding/year-start/step-roster.tsx#L58)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/student-display-name.ts` -- Add archive message constants -- consistent FR copy.
- [x] `champions-app/lib/services/archive-student.ts` -- Soft-archive service with class scope -- FR6 core mutation.
- [x] `champions-app/lib/services/archive-student.test.ts` -- Service unit tests -- I/O matrix edge cases.
- [x] `champions-app/lib/services/list-class-students.ts` -- Filtered roster query -- Élèves list data layer.
- [x] `champions-app/lib/services/list-class-students.test.ts` -- Filter tests -- active/archived/all.
- [x] `champions-app/app/(dashboard)/students/actions.ts` -- `archiveStudentAction` + revalidate paths -- AD-3 entry point.
- [x] `champions-app/app/(dashboard)/students/roster-filter.tsx` -- Filter UI (Actifs/Archivés/Tous) -- UX-DR28 filterability.
- [x] `champions-app/app/(dashboard)/students/roster-list.tsx` -- Archive button, « Archivé » badge, read-only archived rows -- UX-DR28 label.
- [x] `champions-app/app/(dashboard)/students/page.tsx` -- Wire filter, wizard gate, updated list heading -- Élèves tab orchestration.
- [x] `champions-app/app/(dashboard)/students/actions.test.ts` -- Archive action tests -- auth, errors, revalidation.
- [x] `champions-app/app/(dashboard)/students/roster-list.test.tsx` -- **CREATE** badge/read-only/archive button assertions.
- [x] `champions-app/app/(dashboard)/students/page.test.tsx` -- **UPDATE** filter param + archived empty state.

**Acceptance Criteria:**
- Given a student arrives mid-year, when I add them on Élèves and assign a starting level, then they appear on the active roster and in leveled active queries with history starting from add date — no retroactive dictations (FR5, FR8).
- Given a student departs mid-year and year-start wizard is complete, when I archive them from Élèves, then their row is soft-archived, preserved in DB, hidden from active lists and leveled queries, and never deleted (FR6).
- Given archived students exist, when I view Élèves with filter Archivés or Tous, then archived rows show an « Archivé » label and are read-only (no level picker or archive action) (UX-DR28).
- Given I archive a leveled student, when any dictation grid loads or refreshes, then that student is excluded from active grid data (via `listLeveledActiveStudents` + path revalidation).

## Design Notes

Archive vs wizard removal: `removeActiveStudent` hard-deletes only during incomplete wizard with no level/history; mid-year archive is the sole departure path once wizard is complete.

```tsx
// Archived row (read-only) — no LevelDotPicker, no archive button
<span>{student.displayName}</span>
<LevelBadge level={student.level} /> // if set
<span className="text-muted-foreground">Archivé</span>
```

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new archive service, list filter, action, and UI tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Complete wizard → add student → assign level → appears in Actifs filter.
- Archive a leveled student → disappears from Actifs → visible under Archivés with « Archivé » badge.
- Re-add a name matching an archived student → succeeds as new active row.

## Spec Change Log

- [x] [Review][Patch] `archiveStudentAction` used hardcoded not-found string instead of `STUDENT_ARCHIVE_NOT_FOUND_ERROR` [`actions.ts:168`]
- [x] [Review][Patch] Missing page tests for wizard gate, `filter=all`, and archive button visibility [`page.test.tsx`]
- [x] [Review][Patch] Missing roster-list tests for `filter=all` mixed view and `showArchiveAction={false}` [`roster-list.test.tsx`]
- [x] [Review][Patch] Missing action tests for empty `student_id` and `filter=archived` redirect [`actions.test.ts`]
- [x] [Review][Patch] `ClassStudent.archived` typed optional though always selected [`list-class-students.ts:12`]
- [x] [Review][Defer] Dedicated `roster-filter.tsx` / `archive-student-button.tsx` component tests — action and page tests cover redirect/filter wiring
- [x] [Review][Defer] `add-student` test for duplicate name against archived student — behavior unchanged from story 2.2, manual check sufficient
- [x] [Review][Reject] Extract shared filter parser — two call sites, low drift risk; defer refactor
- [x] [Review][Reject] `getYearStartWizardStatus` perf on students page — acceptable until perf story

## Suggested Review Order

**Archive mutation**

- Soft-archive service scoped to class; rejects missing or already-archived rows
  [`archive-student.ts:25`](../../champions-app/lib/services/archive-student.ts#L25)

- Server action wires auth, revalidation, and filter-preserving redirect
  [`actions.ts:146`](../../champions-app/app/(dashboard)/students/actions.ts#L146)

**Élèves UI**

- Page orchestrates filter param, wizard gate, and success notice
  [`page.tsx:33`](../../champions-app/app/(dashboard)/students/page.tsx#L33)

- Roster list renders read-only archived rows and per-row archive control
  [`roster-list.tsx:31`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L31)

- Client archive button with confirm dialog and hidden filter field
  [`archive-student-button.tsx:23`](../../champions-app/app/(dashboard)/students/archive-student-button.tsx#L23)

- Segmented filter control syncing `?filter=` URL param
  [`roster-filter.tsx:18`](../../champions-app/app/(dashboard)/students/roster-filter.tsx#L18)

**Data layer**

- Filtered roster query for active, archived, and all views
  [`list-class-students.ts:27`](../../champions-app/lib/services/list-class-students.ts#L27)

**Tests**

- Archive service and action edge cases
  [`archive-student.test.ts:1`](../../champions-app/lib/services/archive-student.test.ts#L1)

- Page wizard gate and filter param coverage
  [`page.test.tsx:113`](../../champions-app/app/(dashboard)/students/page.test.tsx#L113)
