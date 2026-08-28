---
title: '4-4 Manual Level Override & Level History'
type: 'feature'
created: '2026-08-28'
status: 'done'
baseline_commit: '867ee1f0751b47634e225358cdd942d0bd704024'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/level-system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 2-3 (E1) only supports initial level assignment (`assigned`) for unassigned roster rows. Teachers cannot change an already-assigned color level from the dossier or Élèves roster, and the dossier shows no level-change audit trail despite `level_history_entries` being populated by assign/promote/refuse flows (FR27, FR33, level-system.md).

**Approach:** Add an `overrideStudentLevel` service (transaction: update level, delete pending promotion, insert `manual` history), expose it via a new Server Action on both surfaces, extend the E1 dot-picker pattern for override mode, enhance the dossier level badge per UX-DR25, and render a chronological level-history section on the dossier.

## Boundaries & Constraints

**Always:**
- New `overrideStudentLevel` service — do **not** widen `assignStudentLevel` (E1 stays `assigned` + unassigned-only).
- Transaction: verify active non-archived student in class scope → `UPDATE students.level` → `DELETE pending_promotions` for student (idempotent) → `INSERT level_history_entries` with `action: "manual"`.
- Reject override when target level equals current level (no history row, no error toast).
- Override clears any pending promotion (FR30); future detection recalculates on next dictation save via existing `cascadePromotionReevaluation` — no immediate re-detection call.
- Surfaces: dossier header (`/students/[id]`) and Élèves roster for active, leveled, non-archived students. Archived dossiers: history read-only, no picker.
- Dot picker reuse: same four-color E1 pattern; aria-label « Changer le niveau {label} » (not « Assigner »). Current level dot disabled/highlighted.
- Dossier badge: text label + color dot per UX-DR25 (extend `LevelBadge` or equivalent).
- Level history on dossier: date, color badge, French action label (`Assigné`, `Promu`, `Refusé`, `Modification manuelle`); newest first.
- After success: toast + `router.refresh()`; revalidate `/students/[id]`, `/students`, `/dictations` (same paths as D1 promotion actions).
- French microcopy. No student names in server logs (NFR10). No schema changes.

**Ask First:**
- Collapsible vs always-visible level history section — default **always visible** below dictation history (level-system.md: "full level-change history").

**Never:**
- Promotion detection rule changes, Alertes D2, presentation mode (stories 4.5–4.7).
- Client-side authoritative level mutation.
- Automatic level change without explicit teacher tap.
- Duplicating assign or validate/refuse transaction logic in UI.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Override from dossier | Active leveled student, tap different dot | Level updates, history `manual`, pending cleared, badge + history refresh | Generic toast on failure |
| Override from roster | Active leveled row, tap different dot | Same as dossier; roster badge updates | Generic toast on failure |
| Same level tap | Current = target | No DB write, no toast | N/A |
| With pending promotion | Pending row exists | Override succeeds; banner/D3 indicators clear after refresh | N/A |
| Archived student | `archived: true` | No picker; history visible if entries exist | N/A |
| Unassigned student | `level` null on roster | Existing E1 `LevelDotPicker` + `assignStudentLevel` unchanged | N/A |
| Empty history | New student, no entries yet | Section hidden or empty state « Aucun changement de niveau. » | N/A |
| Cross-surface race | Pending cleared elsewhere | Override still succeeds or same-level no-op | Idempotent pending delete |

</frozen-after-approval>

## Code Map

- `champions-app/lib/services/override-student-level.ts` -- **CREATE** tx: scope check, reject same level, update level, delete pending, insert `manual`. Pattern: [`validate-student-promotion.ts:49`](../../champions-app/lib/services/validate-student-promotion.ts#L49).
- `champions-app/lib/services/override-student-level.test.ts` -- **CREATE** happy path, same-level no-op, pending clear, archived/not-found errors.
- `champions-app/lib/services/get-student-level-history.ts` -- **CREATE** class-scoped read; return `{ id, level, action, occurredAt }[]` ordered desc.
- `champions-app/lib/services/get-student-level-history.test.ts` -- **CREATE** ordering, class isolation, empty array.
- `champions-app/app/(dashboard)/students/actions.ts` -- **MODIFY** add `overrideStudentLevelAction`; reuse `revalidateDossierPromotionPaths`. [`actions.ts:59`](../../champions-app/app/(dashboard)/students/actions.ts#L59)
- `champions-app/app/(dashboard)/students/actions.test.ts` -- **MODIFY** auth, revalidate paths, same-level handling.
- `champions-app/app/(dashboard)/students/level-dot-picker.tsx` -- **MODIFY** add `mode: 'assign' | 'override'` + optional `currentLevel`; wire override action; disable current dot in override mode. [`level-dot-picker.tsx:63`](../../champions-app/app/(dashboard)/students/level-dot-picker.tsx#L63)
- `champions-app/app/(dashboard)/students/level-dot-picker.test.tsx` -- **MODIFY** override aria-labels, disabled current level, action wiring.
- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **MODIFY** leveled active rows: `LevelDotPicker mode="override"` instead of static `LevelBadge`. [`roster-list.tsx:83`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L83)
- `champions-app/app/(dashboard)/students/roster-list.test.tsx` -- **MODIFY** override picker on leveled rows; archived still read-only badge.
- `champions-app/app/(dashboard)/students/[id]/page.tsx` -- **MODIFY** fetch level history; badge + override picker in header; history section. [`page.tsx:72`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L72)
- `champions-app/app/(dashboard)/students/[id]/page.test.tsx` -- **MODIFY** picker presence, history render, archived read-only.
- `champions-app/components/ui/level-badge.tsx` -- **MODIFY** optional color dot before label (UX-DR25). [`level-badge.tsx:30`](../../champions-app/components/ui/level-badge.tsx#L30)
- `champions-app/components/ui/level-badge.test.tsx` -- **MODIFY** dot + label rendering.
- `champions-app/components/dossier/level-history-list.tsx` -- **CREATE** display entries with date, `LevelBadge`, French action label.
- `champions-app/components/dossier/level-history-list.test.tsx` -- **CREATE** action labels, empty state.
- `champions-app/lib/db/schema.ts` -- **READ** `levelHistoryEntries` — no migration. [`schema.ts:52`](../../champions-app/lib/db/schema.ts#L52)
- `champions-app/lib/services/assign-student-level.ts` -- **READ ONLY** — keep E1 semantics. [`assign-student-level.ts:50`](../../champions-app/lib/services/assign-student-level.ts#L50)
- `champions-app/lib/services/dictation-save.ts` -- **READ** `cascadePromotionReevaluation` — post-override detection on next save. [`dictation-save.ts:210`](../../champions-app/lib/services/dictation-save.ts#L210)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/override-student-level.ts` + test -- manual override tx with pending clear -- FR27 core mutation.
- [x] `champions-app/lib/services/get-student-level-history.ts` + test -- dossier history read -- FR33 display foundation.
- [x] `champions-app/app/(dashboard)/students/actions.ts` + test -- `overrideStudentLevelAction` + revalidation -- shared entry point.
- [x] `champions-app/app/(dashboard)/students/level-dot-picker.tsx` + test -- override mode for dossier + roster -- E1 pattern reuse.
- [x] `champions-app/components/ui/level-badge.tsx` + test -- dot + label -- UX-DR25.
- [x] `champions-app/components/dossier/level-history-list.tsx` + test -- chronological audit UI -- level-system.md.
- [x] `champions-app/app/(dashboard)/students/roster-list.tsx` + test -- override on leveled rows -- FR27 roster surface.
- [x] `champions-app/app/(dashboard)/students/[id]/page.tsx` + test -- header picker + history section -- FR27 dossier surface.

**Acceptance Criteria:**
- Given an active student with an assigned level on the Élèves roster, when I tap a different color dot, then the level updates immediately and a `LevelHistoryEntry` with action `manual` is recorded (FR27, FR33).
- Given I am on a student's dossier with an assigned level, when I manually change the color level, then the badge updates, history records action `manual`, and any pending promotion alert is cleared (FR27, FR30, FR33).
- Given I view a student's dossier, when level history entries exist, then I see a chronological list with date, color, and action label; the current level badge shows text label alongside a color dot (UX-DR25).
- Given an archived student, when I view their dossier or roster row, then level override controls are not shown and history remains viewable.

## Design Notes

Override picker mirrors E1 dots but calls `overrideStudentLevelAction`. Highlight/disable the current level dot to avoid accidental same-level submits.

Level history section placement: below dictation history (or empty-state block), heading « Historique des niveaux ». Reuse `formatDictationDateForDisplay` or equivalent date formatting for consistency with dictation table.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: new override/history tests and updated roster/dossier tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Leveled roster row: tap new dot → badge updates, dossier history shows `Modification manuelle`.
- Dossier with pending promotion: override → banner disappears, history entry added.
- Archived student: no picker on dossier or roster; history still listed.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] Toast erreur sur échec override dans `LevelDotPicker` [`level-dot-picker.tsx:118`]
- [x] [Review][Patch] Tests action override : redirect onboarding, niveau invalide, not-leveled, erreur générique [`actions.test.ts:590`]
- [x] [Review][Patch] Assertions `mode`/`currentLevel` roster et dossier [`roster-list.test.tsx:143`, `page.test.tsx:508`]
- [x] [Review][Patch] Libellés Promu/Refusé dans test historique [`level-history-list.test.tsx:30`]

## Suggested Review Order

**Override mutation pipeline**

- Transactional override: update level, clear pending, record `manual` history
  [`override-student-level.ts:50`](../../champions-app/lib/services/override-student-level.ts#L50)

- Server Action entry point with dossier revalidation paths
  [`actions.ts:188`](../../champions-app/app/(dashboard)/students/actions.ts#L188)

**Override UI surfaces**

- Dot picker extended for assign vs override modes with toast feedback
  [`level-dot-picker.tsx:93`](../../champions-app/app/(dashboard)/students/level-dot-picker.tsx#L93)

- Roster rows use override picker for leveled active students
  [`roster-list.tsx:83`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L83)

- Dossier header: badge with dot + override picker + history section
  [`page.tsx:77`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L77)

**Level history display**

- Class-scoped read service ordered newest-first
  [`get-student-level-history.ts:14`](../../champions-app/lib/services/get-student-level-history.ts#L14)

- Chronological audit list with French action labels
  [`level-history-list.tsx:29`](../../champions-app/components/dossier/level-history-list.tsx#L29)

- UX-DR25 badge dot variant for dossier current level
  [`level-badge.tsx:36`](../../champions-app/components/ui/level-badge.tsx#L36)

**Tests**

- Override service and action error/success paths
  [`override-student-level.test.ts:52`](../../champions-app/lib/services/override-student-level.test.ts#L52)

- Dossier and roster integration assertions
  [`page.test.tsx:495`](../../champions-app/app/(dashboard)/students/[id]/page.test.tsx#L495)

