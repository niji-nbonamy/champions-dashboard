# Epic 7 Context: Post-MVP — Auth Recovery & Dossier Analytics

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic delivers two post-MVP capabilities on top of the shipped MVP (Epics 1–6):

1. **Self-service password recovery** — teachers locked out of their account can reset their password via email without creating a new account or contacting support.
2. **Dossier analytics in presentation mode** — the RDV parents view (C3) gains readable chart axes on the global % curve and a new per-category error-count panel so teachers can show parents where difficulties concentrate.

No student data transits through the email provider. Category error curves are **presentation mode only** — the regular student dossier (C1) and class grid remain unchanged.

## Stories

- Story 7.1: Forgotten Password Reset Flow
- Story 7.2: Global Curve Axis Labels and Y-Axis Scale
- Story 7.3: Category Error Curves in Presentation Mode (RDV parents)

**Recommended build order:** 7.1 → 7.2 → 7.3 (auth is P1 for production; curve polish is P2 UX; 7.3 depends on 7.2 X-axis labels).

## Requirements & Constraints

### Story 7.1 — Password reset

- Teachers request a reset from `/forgot-password` (linked from login page « Mot de passe oublié ? »).
- Generic success message always shown — no account enumeration (NFR9).
- Reset link valid 60 minutes, single-use; token stored as SHA-256 hash only (never raw token in DB).
- New password must meet FR-AUTH-3 policy (reuse `validatePasswordPolicy` + `hashPassword` from registration).
- Rate limiting: extend `auth-rate-limit.ts` with kind `password-reset` — 3 requests / 15 min / IP (stricter than login).
- Authenticated users visiting `/forgot-password` or `/reset-password` are redirected to `/dictations` (same policy as `/register`).
- French microcopy throughout. WCAG 2.2 AA target applies.
- **RGPD scope:** only teacher email, sender, subject, and reset link body leave the application — no student data, no passwords in transit to Resend. Open/link tracking **disabled** on all reset emails.

### Story 7.2 — Global curve axis labels

- X-axis shows dictation labels (truncated with tooltip on hover if needed) on the hero global curve (C1 dossier) and presentation mode (C3).
- Y-axis shows ticks at 0, 20, 40, 60, 80, 100 % with optional horizontal guide lines.
- Global % curve behavior unchanged — axis presentation only.
- Single-dictation case: one point with appropriate labels, no layout break.
- Accessible aria-label describing curve and dictation count (NFR13).

### Story 7.3 — Category error curves (C3 only)

- **Scope:** presentation mode (`presentation-mode.tsx`) only — dossier C1 (`students/[id]/page.tsx`) unchanged.
- Dual-panel layout on laptop (≥ 1024px): global % curve (left) + category error curves (right).
- Tablet (< 1024px): stacked — global % above, « Erreurs par catégorie » below; toggles under both charts.
- Right panel Y-axis: **integer error counts** (not percentages) from snapshotted `dictation_entries` columns `errors_c` through `errors_s`.
- Default: only **C (Conjugaison)** curve active on open; state resets each presentation session (no localStorage).
- Nine category toggles (C–S) below both charts; no maximum limit on simultaneous curves.
- Toggle colors from `CHAMPIONS_ERROR_CATEGORIES[].headerBackground`.
- X-axis dictation positions align between left and right panels (chronological by `dictationDate`).
- `PresentationHighlights` (last %, trend, level) unchanged below charts.

## Technical Decisions

### Story 7.1

| Decision | Choice |
|----------|--------|
| Email provider | **Resend** (`resend` npm package) |
| Env vars | `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `CHAMPIONS <noreply@votredomaine.fr>`) |
| Sending region | `eu-west-1` (Ireland) — storage remains US per Resend docs |
| SDK / service | `lib/services/send-transactional-email.ts` wrapping `resend.emails.send()` |
| Token storage | New `password_reset_tokens` table: `id`, `teacher_id`, `token_hash`, `expires_at`, `used_at`, `created_at` |
| Token lifetime | 60 minutes |
| Token delivery | `{AUTH_URL}/reset-password?token={rawToken}` |
| Password update | Reuse `hashPassword` + `validatePasswordPolicy` from registration |
| Dev fallback | When `RESEND_API_KEY` absent: token created + reset URL logged to server console |

**Routes:**

| Path | Purpose |
|------|---------|
| `/forgot-password` | Request form (email field + submit) |
| `/reset-password?token=…` | New password + confirmation (reuse `PasswordField`, `PasswordRequirements`) |
| Login page | Add link « Mot de passe oublié ? » below submit |

**Out of scope for 7.1:** email verification on registration, change-password while logged in, SMS recovery.

### Story 7.2

- Extend existing `GlobalSuccessCurve` (`components/dossier/global-success-curve.tsx`) — currently renders polyline without axis labels or Y-axis ticks.
- `CurvePoint` from `lib/domain/dossier-curve.ts` already carries `label` and `percent`; use `label` for X-axis.
- Apply same axis treatment in both C1 dossier hero and C3 presentation mode.

### Story 7.3

**New components:**

| Component | Role |
|-----------|------|
| `category-error-curves.tsx` | Integer Y-axis chart, multi-series from snapshot error counts |
| `category-curve-toggles.tsx` | 9 letter buttons, no max limit |
| `presentation-charts-row.tsx` | Two-column wrapper: global + category charts + toggles below |

**Data source:** `StudentDictationHistoryEntry` from `get-student-dictation-history` — error counts per category already in snapshot. Metric defined in `scoring-model.md`:

```
categoryErrorCount = snapshot error count for that CHAMPIONS letter (C–S)
```

No denominator, no percentage formula — direct read from `dictation_entries`.

**Y-axis auto-scale:** `max(active category errors across dictations) + 1` with integer ticks only.

## UX & Interaction Patterns

### Password reset flow

- Auth layout styling consistent with login/register (UX-DR29/DR30 family).
- Generic success: « Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé. »
- Email subject: « Réinitialisation de votre mot de passe CHAMPIONS » — plain French HTML + text fallback, no marketing.
- Invalid/expired/used token: « Ce lien n'est plus valide. » with link to `/forgot-password`; no password form shown.
- Success redirect to `/login` with flash: « Mot de passe mis à jour. Connectez-vous. »

### Presentation charts (7.2 + 7.3)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Mode RDV parents — {student name}                          [Fermer]    │
├──────────────────────────────┬───────────────────────────────────────────┤
│  Réussite globale (%)        │  Erreurs par catégorie                      │
│  GlobalSuccessCurve          │  CategoryErrorCurves                        │
│  Y: 0–100 % (7.2 axes)       │  Y: 0 … max(errors) integers               │
│                              │  Default: C (Conjugaison) only              │
├──────────────────────────────┴───────────────────────────────────────────┤
│  [C][H][A][M][P][I][O][N][S]  ← toggles (right panel only)                │
│  ● active = filled, category color; ○ inactive = outline, muted          │
└──────────────────────────────────────────────────────────────────────────┘
        PresentationHighlights — unchanged, below
```

- Tooltip format: `{label} — {categoryName}: {count} erreur(s)`
- Keyboard: Tab through toggles, Space/Enter to toggle; `aria-pressed` on each toggle.
- Right panel `aria-label="Erreurs par catégorie"`.

## Pre-Build Gates

| Story | Gate | Status |
|-------|------|--------|
| 7.1 | Configure Resend domain + DNS (SPF/DKIM/DMARC); set `RESEND_API_KEY` + `EMAIL_FROM` in env | **Pending** — not yet in `.env.example` or codebase |
| 7.1 | Accept Resend DPA; document sub-processor in privacy policy | Ops (parallel) |
| 7.2 | None | Ready |
| 7.3 | Story 7.2 `done`; `categoryErrorCount` metric in `scoring-model.md` | Metric **documented**; sequencing enforced |

## Cross-Story Dependencies

- **Epic 1 (prerequisite):** Auth stack (`teachers` table, `hashPassword`, `validatePasswordPolicy`, `auth-rate-limit.ts`, `PasswordField`, `PasswordRequirements`, middleware auth redirects). Extend — do not fork.
- **Epic 4 (prerequisite):** `GlobalSuccessCurve`, `presentation-mode.tsx`, `toCurvePoints` from `lib/domain/dossier-curve.ts`, presentation route `students/[id]/present/page.tsx`.
- **Within epic:** 7.1 is independent. 7.2 extends `GlobalSuccessCurve` axes. 7.3 depends on 7.2 X-axis alignment and composes into `presentation-mode.tsx`.
- **Inherited debt (non-blocking):** Epic 6 retro open items (ux-decisions reconciliation, integration test for metadata reorder, iOS safe-area, E2E metadata smoke) — not gates for Epic 7 delivery.

## Key Code Paths (existing)

| Area | Path |
|------|------|
| Global curve | `champions-app/components/dossier/global-success-curve.tsx` |
| Presentation mode | `champions-app/components/dossier/presentation-mode.tsx` |
| Curve domain | `champions-app/lib/domain/dossier-curve.ts` |
| Auth rate limit | `champions-app/lib/services/auth-rate-limit.ts` (extend with `password-reset` kind) |
| Password policy | `champions-app/lib/domain/password-policy.ts` (registration) |
| Scoring model | `_bmad-output/specs/spec-dashboards-dictees-champions-ce2/scoring-model.md` |
| Teachers schema | `champions-app/lib/db/schema.ts` (`teachers.passwordHash`) |

## Source Ideas

| Idea | Story | Triage |
|------|-------|--------|
| IDEA-001 — Forgotten password reset | 7.1 | scheduled 2026-09-02 |
| IDEA-004 — Interactive dossier curves | 7.2 + 7.3 | scheduled 2026-09-02 |
