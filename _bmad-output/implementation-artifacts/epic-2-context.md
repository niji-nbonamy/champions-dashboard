# Epic 2 Context: Year Setup & Roster Management

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable teachers to configure a full school year before the first scored dictation: import and maintain the class roster, assign CHAMPIONS color levels, configure the dictation × level word-count matrix, handle mid-year roster changes, and reset for a new year. Epic 1 delivered auth and navigation; this epic makes the classroom data model operational.

## Stories

- Story 2.1: CSV Roster Import
- Story 2.2: Manual Student Add & Roster List
- Story 2.3: Level Assignment & Color-Dot Picker (E1)
- Story 2.4: Word-Count Matrix Configuration (F1)
- Story 2.5: Year-Start Wizard (E3)
- Story 2.6: Mid-Year Roster Changes & Student Archiving
- Story 2.7: Empty Roster & Pre-Setup States
- Story 2.8: Annual Year Reset

## Requirements & Constraints

- Roster import via single-column UTF-8 CSV with header `NOM + prénom`; validation rejects bad encoding, wrong format, duplicates, and empty rosters with specific French messages.
- Manual student add remains available as CSV fallback; archiving preserves dossiers read-only without deletion.
- Initial color levels are teacher-assigned after year-start evaluation — never from CSV.
- Students without a level are hidden from dictation grids and blocked from scored dictations.
- Word-count matrix (dictation label × four color levels) must be configured before dictation save.
- Year-start wizard guides roster confirm → level assignment → matrix; level assignment cannot be skipped.
- Annual year reset atomically deletes all class-scoped data and redirects to year-start setup.
- Class-scoped tenancy: every entity belongs to one `Class`; authorization in application services.
- Server-authoritative mutations via Server Actions → services → domain → DB transaction.
- French UI microcopy; no school grade (CE2, etc.) in schema or copy.
- Never log student names in production info logs.

## Technical Decisions

- **Student entity:** `id`, `class_id`, `display_name`, nullable `level` enum (`yellow` | `green` | `violet` | `gold`), `archived` boolean default false — per architecture ER diagram.
- **Roster import logic:** Pure module `lib/domain/roster-import.ts` (parse, validate); orchestration in `lib/services/`; UI on Config tab.
- **IDs:** UUID v4; DB tables `snake_case` plural; FK `*_id`.
- **Migrations:** Drizzle schema + `npm run db:push` (no migration history folder yet).
- **Data residency:** Neon Frankfurt; existing `getTeacherClass(teacherId)` resolves `classId` for all queries.

## UX & Interaction Patterns

- Config tab hosts CSV import, word matrix (F1), and year reset.
- CSV import: single column, UTF-8; reject with specific errors; no partial import on failure.
- Empty roster states on Dictées/Config with CTA to import (story 2.7).
- Level dot picker (E1) on Élèves for unassigned students; year-start wizard (E3) post-import (story 2.5).
- Primary mint buttons for confirm/import actions; French factual microcopy.

## Cross-Story Dependencies

- Epic 1 (auth, class creation, dashboard shell) is prerequisite.
- Story 2.1 establishes `students` table and import path; 2.2–2.6 extend roster management.
- Story 2.3 (levels) and 2.4 (matrix) gate Epic 3 dictation creation.
- Story 2.5 wizard depends on 2.1 import success path.
- Story 2.8 reset depends on full class data model from 2.1–2.6.
