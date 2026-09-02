---
id: SPEC-dashboards-dictees-champions-ce2
companions:
  - error-categories.md
  - roster-import.md
  - scoring-model.md
  - level-system.md
  - dictation-lifecycle.md
  - mvp-scope.md
  - ux-decisions.md
  - ../../planning-artifacts/architecture/architecture-testBMAD-2026-08-24/ARCHITECTURE-SPINE.md
sources:
  - ../../brainstorming/brainstorm-dashboards-dictees-champions-ce2-2026-08-21/brainstorm-intent.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# CHAMPIONS Dictation Dashboards

## Why

**Problem:** Primary teachers using the CHAMPIONS dictation method record errors on handwritten class sheets (one row per student, columns per error category, one sheet per dictation). Before parent meetings, reconstructing a single student's progression across all sheets is the bottleneck. The app must deliver per-student progression curves and factual summaries at meeting time without sacrificing the speed and flexible use anywhere of today's workflow.

## Capabilities

- **CAP-1**
  - **intent:** Teacher can record dictation errors on a condensed class grid (student row × nine CHAMPIONS letter columns C–S) using the same fill logic as the paper sheet.
  - **success:** After a dictation session, every leveled student's error counts are captured in one grid view with keyboard-friendly entry; rows show promotion indicators and a **+** control when level-up criteria are met (see `ux-decisions.md`, `dictation-lifecycle.md`).

- **CAP-2**
  - **intent:** System auto-generates a per-student dossier aggregating all dictations — the teacher never manually assembles student views.
  - **success:** Opening any student's dossier shows their complete dictation history and global curve without cross-referencing multiple class sheets.

- **CAP-3**
  - **intent:** Teacher can configure and maintain the school-year student roster — CSV import (single `NOM + prénom` column), manual add, mid-year arrivals, and mid-year departures (archived) — plus a dictation × color-level word-count matrix.
  - **success:** Teacher uploads a one-column CSV and the class roster is ready; active leveled students appear on new dictation grids; departed students are archived (read-only dossier, hidden from grids, not deleted). Import errors are surfaced per `roster-import.md`.

- **CAP-4**
  - **intent:** System auto-calculates global success percentage from error counts entered on the class grid.
  - **success:** Global % appears on the student dossier immediately after class-grid save, with denominator snapshotted per `scoring-model.md`.

- **CAP-5**
  - **intent:** System tracks each student's color level, supports year-start assignment, detects promotion readiness, and exposes validation through student-sheet banner, alerts queue, grid-row indicator, and inline **+** during dictation entry — plus manual override at any time.
  - **success:** Teacher can validate or refuse a promotion from the dossier, the alerts queue, or the class grid **+** button; every level change and refusal is recorded in level history (see `level-system.md`).

- **CAP-6**
  - **intent:** Teacher can present a factual parent-meeting snapshot via a hero curve on the student sheet and a dedicated full-screen presentation mode — presentable in about 30 seconds.
  - **success:** « RDV parents » mode shows global curve, last %, trend (delta vs previous dictation per `scoring-model.md`), and level badge; per-category error counts available on demand from the collapsed table.

- **CAP-7**
  - **intent:** Teacher can enter dictation errors on mobile via a hybrid per-student flow — numeric fields plus optional quick-tap mode — with large targets and minimal taps.
  - **success:** On a phone-sized screen, teacher completes one leveled student's nine category counts using tap-to-increment (+1 per tap, no cap) or manual numeric entry via long-press or dedicated field (see `ux-decisions.md`).

## Constraints

- No auto-generated pedagogical narrative for parents — present facts and curves only; teacher owns the narrative.
- UX interaction patterns are defined in `ux-decisions.md` — laptop tab nav, mobile dictation hub, condensed CHAMPIONS grid, and multi-surface level promotion.
- Teacher validates every auto-detected level promotion; manual override always available (see `level-system.md`).
- Class grid columns are fixed to the nine CHAMPIONS error categories (see `error-categories.md`) — not teacher-configurable.
- Digital entry mirrors paper fill logic (non-negative integer error counts per cell), not pixel-perfect visual layout.
- Laptop-first for year config and parent-meeting views; mobile is a secondary capture path, not feature parity.
- Departed students are **archived** — dossier preserved read-only, hidden from active grids, never deleted (see `roster-import.md`).
- Per-student word denominator is snapshotted at dictation save; dictation total word count is pre-filled from year config (see `scoring-model.md`, `dictation-lifecycle.md`).
- **Grade-level agnostic** — the app never references or stores a school grade (CE2, CM1, etc.); teachers at different grade levels use the same feature set. CHAMPIONS **color levels** (yellow → gold) are student proficiency bands, not curriculum cycles (see `ARCHITECTURE-SPINE.md` AD-11).

## Auth & Registration

- **FR-AUTH-1:** Registration form displays password visibility toggle on password and confirmation fields.
- **FR-AUTH-2:** Registration requires password confirmation; mismatch blocks submit with inline feedback.
- **FR-AUTH-3:** Registration displays real-time password requirement checklist in French: « Saisissez un mot de passe comportant au moins : » + 8 caractères, 1 chiffre, 1 minuscule, 1 majuscule, 1 caractère spécial, correspondance des deux mots de passe.
- **FR-AUTH-4:** Registration requires Google reCAPTCHA v2 (« Je ne suis pas un robot »); server verifies token before account creation.
- **FR-AUTH-5:** Login form displays password visibility toggle.
- **FR-AUTH-6:** All auth form labels, requirement text, and error messages in French.
- **NFR-AUTH-1:** Password policy enforced server-side: min 8 chars, ≥1 digit, ≥1 lowercase, ≥1 uppercase, ≥1 special character.
- **NFR-AUTH-2:** reCAPTCHA bypass allowed only in non-production when `RECAPTCHA_SECRET_KEY` is absent (dev/CI convenience).
- **NFR-AUTH-3:** Existing NFR9 preserved — generic errors, no email-exists leak on registration.

## Non-goals

- Per-category percentages and per-category progression curves (error counts per category remain visible in the dictation table).
- Full mobile class-grid view (deferred — see `mvp-scope.md`).
- Pixel-perfect replica of the paper sheet layout.
- Dictation delete or history purge (deferred — see `mvp-scope.md`).
- School-grade selection, labeling, or grade-specific behavior — the tool is not tied to any curriculum cycle.

## Success signal

1. **Parent meeting:** Teacher opens a student's dossier or presentation mode and sees the global progression curve plus factual highlights — without manually reconstructing data from paper class sheets.
2. **Dictation capture:** Teacher completes a class-grid session in one view with keyboard or mobile entry; percentages and promotion indicators update on save.
3. **Year setup:** Teacher imports a one-column CSV, assigns levels, and configures the word-count matrix before the first scored dictation.
