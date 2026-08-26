---
title: '2-3 Level Assignment & Color-Dot Picker (E1)'
type: 'feature'
created: '2026-08-26'
status: 'done'
review_loop_iteration: 0
baseline_commit: '75d4868b91b59e076532d1df153b151241a81b02'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/level-system.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/ux-decisions.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Students imported or added manually have `level = null`. Teachers cannot assign CHAMPIONS color levels on Élèves, so no student is eligible for future dictation grids and unassigned counts are invisible (FR7, FR8, FR9, UX-DR18, UX-DR22).

**Approach:** Add `level_history_entries` table and an `assignStudentLevel` service (transaction: set `students.level`, insert history with action `assigned`). Replace roster unassigned label with a « niveau requis » badge plus a four-dot picker (E1) per unassigned row. Expose unassigned count on the Élèves nav tab and a `listLeveledActiveStudents` query for Epic 3 grid filtering.

## Boundaries & Constraints

**Always:**
- Assign level only via Élèves tab color-dot picker (E1) in this story (FR8).
- Valid levels: `yellow`, `green`, `violet`, `gold` only.
- Assignment allowed only when student is active (`archived = false`), belongs to authenticated teacher's class, and `level` is currently `null`.
- On success: update `students.level` and insert one `level_history_entries` row with `action = assigned`, `occurred_at = now()` (FR7, FR8, FR33 partial).
- Unassigned rows show « niveau requis » badge (not « Niveau non assigné ») plus four tappable color dots with French text labels alongside dots (UX-DR25).
- Assigned rows show `LevelBadge` only — no picker, no re-assignment UI (story 4.4).
- Nav Élèves tab shows warning count badge when unassigned active students > 0 (UX-DR22); hidden when zero.
- `listLeveledActiveStudents(classId)` returns active students with non-null level, sorted like roster — Epic 3 grid must use this (FR9); dictation UI stub unchanged.
- Mutations: Server Action → service → DB transaction (AD-3).
- French microcopy; do not log student names in server info logs (NFR10).

**Ask First:**
- Allow changing an already-assigned level from Élèves in this story vs defer to story 4.4 (default: defer — server rejects if level already set).

**Never:**
- Year-start wizard bulk assignment (story 2.5).
- Manual override, promotion validate/refuse, or history actions other than `assigned` (stories 4.x).
- Assign level at CSV import or manual add (stories 2.1–2.2).
- Client-only assignment without server re-check.
- Dictation grid UI or mobile entry blocking (Epic 3/5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy assign | Unassigned active student, tap `green` dot | `level = green`; history `assigned`; row shows `LevelBadge`; tab count decrements | N/A |
| Already assigned | Student with level set | No picker shown | Server rejects if forced |
| Invalid level | Bad enum in payload | No DB change | Generic French error |
| Wrong class / unknown id | Student not in teacher class | No DB change | « Élève introuvable. » |
| Archived student | `archived = true` | No DB change | « Élève introuvable. » |
| Unassigned badge | `level = null` on roster | « niveau requis » badge + four dots | N/A |
| Tab badge | 3 unassigned, 2 assigned | Élèves tab shows count `3` | Badge hidden at 0 |
| Leveled query | Mixed roster | `listLeveledActiveStudents` returns only leveled actives | N/A |
| Unauthenticated | No session | Redirect `/login` | N/A |
| No class | Session without class | Redirect `/onboarding/class` | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **MODIFY** add `levelHistoryEntries` table (`student_id`, `level`, `action`, `occurred_at`). [`schema.ts:24`](../../champions-app/lib/db/schema.ts#L24)
- `champions-app/lib/domain/champions-level.ts` -- **CREATE** level enum validation + French labels for dots (`jaune`, `vert`, `violet`, `or`).
- `champions-app/lib/domain/champions-level.test.ts` -- **CREATE** valid/invalid level tests.
- `champions-app/lib/services/assign-student-level.ts` -- **CREATE** auth-scoped assign: verify unassigned active student → transaction update + history insert.
- `champions-app/lib/services/assign-student-level.test.ts` -- **CREATE** success, already-assigned reject, not-found, invalid level.
- `champions-app/lib/services/count-unassigned-active-students.ts` -- **CREATE** count active where `level IS NULL` (nav badge).
- `champions-app/lib/services/count-unassigned-active-students.test.ts` -- **CREATE** mocked DB tests.
- `champions-app/lib/services/list-leveled-active-students.ts` -- **CREATE** active + `level IS NOT NULL` query for Epic 3 grid gate (FR9).
- `champions-app/lib/services/list-leveled-active-students.test.ts` -- **CREATE** filters unassigned/archived.
- `champions-app/app/(dashboard)/students/actions.ts` -- **MODIFY** add `assignStudentLevelAction`; revalidate `/students` (+ layout path if needed).
- `champions-app/app/(dashboard)/students/level-dot-picker.tsx` -- **CREATE** client: four labeled dots, form/button per student row.
- `champions-app/components/ui/required-level-badge.tsx` -- **CREATE** « niveau requis » warning-style badge.
- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **MODIFY** unassigned → badge + picker; assigned → `LevelBadge`. [`roster-list.tsx:37`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L37)
- `champions-app/components/dashboard/nav-tabs.tsx` -- **MODIFY** accept `unassignedStudentCount` prop; render warning badge on Élèves. [`nav-tabs.tsx:8`](../../champions-app/components/dashboard/nav-tabs.tsx#L8)
- `champions-app/components/dashboard/dashboard-shell.tsx` -- **MODIFY** pass count into `NavTabs`. [`dashboard-shell.tsx:10`](../../champions-app/components/dashboard/dashboard-shell.tsx#L10)
- `champions-app/app/(dashboard)/layout.tsx` -- **MODIFY** fetch `countUnassignedActiveStudents` alongside existing class guard. [`layout.tsx:19`](../../champions-app/app/(dashboard)/layout.tsx#L19)
- `champions-app/components/ui/level-badge.tsx` -- **READ** reuse for assigned rows. [`level-badge.tsx:29`](../../champions-app/components/ui/level-badge.tsx#L29)
- `champions-app/lib/services/list-active-students.ts` -- **READ** roster query pattern. [`list-active-students.ts:12`](../../champions-app/lib/services/list-active-students.ts#L12)
- `champions-app/lib/design/tokens.ts` -- **READ** `ChampionsLevel` type. [`tokens.ts:64`](../../champions-app/lib/design/tokens.ts#L64)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` -- Add `level_history_entries` table -- FR33 history foundation.
- [x] `champions-app/lib/domain/champions-level.ts` -- Level validation + French labels -- shared domain guard.
- [x] `champions-app/lib/domain/champions-level.test.ts` -- Unit tests -- regression guard.
- [x] `champions-app/lib/services/assign-student-level.ts` -- Assign transaction service -- AD-3 core mutation.
- [x] `champions-app/lib/services/assign-student-level.test.ts` -- Service tests -- I/O matrix coverage.
- [x] `champions-app/lib/services/count-unassigned-active-students.ts` -- Unassigned count query -- nav badge data.
- [x] `champions-app/lib/services/count-unassigned-active-students.test.ts` -- Mocked DB tests -- badge accuracy.
- [x] `champions-app/lib/services/list-leveled-active-students.ts` -- Leveled roster query -- FR9 grid gate for Epic 3.
- [x] `champions-app/lib/services/list-leveled-active-students.test.ts` -- Filter tests -- unassigned excluded.
- [x] `champions-app/components/ui/required-level-badge.tsx` -- « niveau requis » badge component -- UX-DR22 roster indicator.
- [x] `champions-app/app/(dashboard)/students/level-dot-picker.tsx` -- E1 dot picker UI -- FR8 assignment UX.
- [x] `champions-app/app/(dashboard)/students/actions.ts` -- `assignStudentLevelAction` -- presentation entry point.
- [x] `champions-app/app/(dashboard)/students/roster-list.tsx` -- Wire badge + picker vs badge -- replace story 2.2 unassigned label.
- [x] `champions-app/components/dashboard/nav-tabs.tsx` -- Warning count on Élèves tab -- UX-DR22.
- [x] `champions-app/components/dashboard/dashboard-shell.tsx` -- Plumb count to nav -- shell wiring.
- [x] `champions-app/app/(dashboard)/layout.tsx` -- Load unassigned count server-side -- single fetch per dashboard request.
- [x] `champions-app/app/(dashboard)/students/actions.test.ts` -- Action tests -- auth/error/revalidate paths.
- [x] `champions-app/app/(dashboard)/students/roster-list.test.tsx` -- Update UI tests -- badge, picker, assigned badge.
- [x] `champions-app/app/(dashboard)/layout.test.tsx` -- Layout passes count to shell -- nav badge integration.

**Acceptance Criteria:**
- Given a student on my roster without an assigned level, when I tap a color dot on their Élèves row, then their level is set and a LevelHistoryEntry with action `assigned` is recorded (FR7, FR8).
- Given a student now has an assigned level, when future dictation grids query leveled students, then that student is included (FR9 data path via `listLeveledActiveStudents`).
- Given a student has no assigned level, when I view their Élèves row, then I see a « niveau requis » badge and four color dots (FR9, UX-DR18).
- Given my class has one or more unassigned active students, when I view the dashboard tabs, then the Élèves tab shows a warning count equal to that number (UX-DR22).
- Given all active students have assigned levels, when I view the dashboard tabs, then no warning count appears on Élèves.

## Verification

**Commands:**
- `cd champions-app && npm run db:push` -- expected: `level_history_entries` table created in Neon (run locally before manual UI test).
- `cd champions-app && npm test` -- expected: all tests pass including new domain, service, action, and UI tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Import or add students → Élèves shows « niveau requis » + dots → assign one level → badge appears, dot picker gone, tab count updates.
- Attempt assign on already-leveled student via crafted request → error, no duplicate history row.

## Suggested Review Order

**Level assignment core**

- Transactional assign: validate level, guard unassigned student, update + history
  [`assign-student-level.ts:37`](../../champions-app/lib/services/assign-student-level.ts#L37)

- Shared CHAMPIONS level enum and French dot labels
  [`champions-level.ts:1`](../../champions-app/lib/domain/champions-level.ts#L1)

- Server action entry with layout revalidation for nav badge refresh
  [`actions.ts:69`](../../champions-app/app/(dashboard)/students/actions.ts#L69)

**Schema**

- New `level_history_entries` audit table
  [`schema.ts:37`](../../champions-app/lib/db/schema.ts#L37)

**Élèves UI (E1)**

- Roster row: « niveau requis » badge + dot picker vs assigned badge
  [`roster-list.tsx:20`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L20)

- Four labeled color-dot buttons per unassigned student
  [`level-dot-picker.tsx:31`](../../champions-app/app/(dashboard)/students/level-dot-picker.tsx#L31)

- Warning-style required-level badge component
  [`required-level-badge.tsx:7`](../../champions-app/components/ui/required-level-badge.tsx#L7)

**Nav warning count (UX-DR22)**

- Dashboard layout loads unassigned count for shell
  [`layout.tsx:25`](../../champions-app/app/(dashboard)/layout.tsx#L25)

- Élèves tab badge with singular/plural aria-label
  [`nav-tabs.tsx:33`](../../champions-app/components/dashboard/nav-tabs.tsx#L33)

**Epic 3 grid gate (FR9)**

- Query active students with valid assigned level only
  [`list-leveled-active-students.ts:13`](../../champions-app/lib/services/list-leveled-active-students.ts#L13)

- Unassigned count service for nav badge
  [`count-unassigned-active-students.ts:6`](../../champions-app/lib/services/count-unassigned-active-students.ts#L6)

**Tests**

- Assign service: success, concurrency, not-found, already-assigned
  [`assign-student-level.test.ts:32`](../../champions-app/lib/services/assign-student-level.test.ts#L32)

- Action + layout + nav badge integration coverage
  [`actions.test.ts:244`](../../champions-app/app/(dashboard)/students/actions.test.ts#L244)

### Review Findings

- [x] [Review][Patch] Niveau invalide en base — autoriser réassignation serveur si hors enum CHAMPIONS [`assign-student-level.ts:68`](../../champions-app/lib/services/assign-student-level.ts#L68) + [`roster-list.tsx:29`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L29)

- [x] [Review][Patch] Transaction DB manquante pour assign + historique [`assign-student-level.ts:72`](../../champions-app/lib/services/assign-student-level.ts#L72)
- [x] [Review][Patch] UPDATE sans garde `archived = false` [`assign-student-level.ts:75`](../../champions-app/lib/services/assign-student-level.ts#L75)
- [x] [Review][Patch] Erreur trompeuse si l'UPDATE ne retourne aucune ligne [`assign-student-level.ts:84`](../../champions-app/lib/services/assign-student-level.ts#L84)
- [x] [Review][Patch] Test élève archivé manquant (matrice I/O) [`assign-student-level.test.ts`](../../champions-app/lib/services/assign-student-level.test.ts)
- [x] [Review][Patch] Tests prédicats SQL du comptage non assignés [`count-unassigned-active-students.test.ts`](../../champions-app/lib/services/count-unassigned-active-students.test.ts)
- [x] [Review][Patch] Test action avec niveau invalide manquant [`actions.test.ts`](../../champions-app/app/(dashboard)/students/actions.test.ts)
- [x] [Review][Patch] Incohérence statut spec `done` vs sprint `review` [`spec-2-3-level-assignment-color-dot-picker-e1.md:5`](./spec-2-3-level-assignment-color-dot-picker-e1.md#L5)

- [x] [Review][Defer] Index `student_id` sur `level_history_entries` [`schema.ts:37`](../../champions-app/lib/db/schema.ts#L37) — deferred, pre-existing
- [x] [Review][Defer] Pas de `teacher_id` dans l'historique (FR33 partiel) [`schema.ts:37`](../../champions-app/lib/db/schema.ts#L37) — deferred, pre-existing
- [x] [Review][Defer] Type `LeveledActiveStudent.level` reste `string` [`list-leveled-active-students.ts:10`](../../champions-app/lib/services/list-leveled-active-students.ts#L10) — deferred, pre-existing
- [x] [Review][Defer] `aria-describedby` pour erreurs multi-lignes du picker [`level-dot-picker.tsx:63`](../../champions-app/app/(dashboard)/students/level-dot-picker.tsx#L63) — deferred, pre-existing
- [x] [Review][Defer] Test dédié `RequiredLevelBadge` — deferred, pre-existing
