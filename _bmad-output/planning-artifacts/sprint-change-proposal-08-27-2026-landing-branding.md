---
project: testBMAD
date: 08-27-2026
change_scope: moderate
status: approved
trigger: manual-testing-ux-feedback
approved_by: Nicolas.bonamy
approved_date: 08-27-2026
---

# Sprint Change Proposal — Public Landing Page & CHAMPIONS Branding

## 1. Issue Summary

### Problem statement

During manual testing (08-27-2026), three UX gaps were identified on the public entry path and dashboard chrome:

1. **Landing page (`/`) is a dev scaffold** — shows « CHAMPIONS » + « Development environment ready » with no navigation to auth flows.
2. **Authenticated users visiting `/` are not redirected** — middleware does not cover `/`; logged-in teachers see the useless scaffold instead of the Dictées tab.
3. **App bar branding is outdated** — displays École Saint Hermeland wordmark + muted « champions » subtitle; stakeholder wants the CHAMPIONS method logo instead.

### Context

- **Discovered:** 08-27-2026 during manual testing by Nicolas.bonamy
- **Triggering stories:** 1.1 (scaffold landing, `done`), 1.6 (app bar with Hermeland logo, `done`)
- **Evidence:** `app/page.tsx` still contains scaffold copy; `middleware.ts` matcher excludes `/`; `app-bar.tsx` references `/logo-ecole-saint-hermeland.png`
- **Assets supplied:** Full landing graphic (JPG) + CHAMPIONS wordmark with icons (PNG)

### Stakeholder decisions (08-27-2026)

| Decision | Choice |
|----------|--------|
| Landing hero | Full « La méthode CHAMPIONS » graphic centered |
| Landing CTAs | « Se connecter » → `/login`, « Créer un compte » → `/register` |
| Logged-in visit to `/` | Redirect to `/dictations` (onboarding guard unchanged) |
| App bar logo | Replace Hermeland + subtitle with CHAMPIONS wordmark JPEG |
| Presentation mode (C3) | CHAMPIONS wordmark bottom-right — `PresentationBrandLogo` component ready for story 4.7 |

---

## 2. Impact Analysis

### Epic impact

| Epic | Impact |
|------|--------|
| **Epic 1** | New story **1.8**; epic remains `in-progress` until 1.8 done |
| **Epic 2–5** | No functional impact |
| **Epic 4 (C3 presentation)** | Story 4.7 AC updated — CHAMPIONS wordmark bottom-right (via `PresentationBrandLogo`) |

### Story impact

| Story | Change |
|-------|--------|
| 1.1 | Superseded landing AC — scaffold copy replaced by production landing (via 1.8, no reopen) |
| 1.6 | App bar AC amended — CHAMPIONS wordmark replaces Hermeland + subtitle |
| **1.8** (NEW) | `backlog` — Public Landing Page & CHAMPIONS App Bar Branding |

### Artifact conflicts resolved

| Artifact | Update needed |
|----------|---------------|
| `epics.md` | Insert Story 1.8 after 1.7 |
| `SPEC.md` | Optional: add NFR/UX note for public landing entry (French CTAs) |
| `DESIGN.md` | Replace `{school-logo-app-bar}` with `{champions-logo-app-bar}`; add `{champions-landing-hero}` |
| `EXPERIENCE.md` | Update App bar row; add Landing surface for unauthenticated entry |
| `sprint-status.yaml` | Add `1-8-public-landing-champions-branding: backlog` |
| `spec-1-1`, `spec-1-6` | Reference superseded sections in Change Log only |

### Technical impact

- **Pages:** `app/page.tsx` — branded landing with hero image + CTA links
- **Middleware:** Add `/` to matcher; extend `getAuthRedirectPath` — logged-in → `/dictations`
- **Components:** `components/dashboard/app-bar.tsx` — new logo asset, remove subtitle span
- **Assets:** Copy user-supplied JPG/PNG to `champions-app/public/`
- **Tests:** `shell.test.tsx`, `app-bar.test.tsx`, `middleware-policy.test.ts`, `scaffold.test.ts`
- **No DB schema change**

---

## 3. Recommended Approach

**Selected path: Option 1 — Direct Adjustment**

Add Story 1.8 within Epic 1 and update UX artifacts. No rollback, no MVP scope reduction.

| Criterion | Assessment |
|-----------|------------|
| Effort | **Low–Medium** (~0.5 day) |
| Risk | **Low** — isolated to public route + app bar chrome |
| Timeline | No Epic 3 blocker; can ship in parallel with 3-1 |
| MVP | Unchanged — improves first-run UX |

**Rollback option:** Not viable — reverting would restore broken landing UX.

---

## 4. Detailed Change Proposals

### Story 1.8: Public Landing Page & CHAMPIONS App Bar Branding

**As a** primary teacher (or prospective user),  
**I want** a branded landing page with clear auth entry points and consistent CHAMPIONS branding in the app bar,  
**So that** I can discover the method and reach login/registration quickly, and authenticated sessions skip the public page.

#### Acceptance Criteria

**Given** I am not authenticated  
**When** I visit `/`  
**Then** I see the full « La méthode CHAMPIONS » hero image centered on the page  
**And** I see two primary CTAs: « Se connecter » (links to `/login`) and « Créer un compte » (links to `/register`)  
**And** all microcopy is in French (NFR14)  
**And** the dev scaffold copy (« Development environment ready ») is removed  

**Given** I am authenticated  
**When** I visit `/`  
**Then** I am redirected to `/dictations` (existing onboarding/class guards still apply)  

**Given** I am authenticated on any dashboard page  
**When** I view the app bar  
**Then** the CHAMPIONS wordmark logo is displayed (replacing Hermeland logo and « champions » subtitle)  
**And** logo height follows existing tokens (40px mobile / 52px laptop)  
**And** the logo is not clickable in MVP (unchanged from 1.6)  

---

### Edit: Story 1.6 — App Shell (epics.md)

**Section:** Acceptance Criteria — app bar line

**OLD:**
> the app bar displays the Saint Hermeland wordmark at 52px height … with muted « champions » subtitle (UX-DR5)

**NEW:**
> the app bar displays the CHAMPIONS method wordmark at 52px height (width auto, `object-fit: contain`) — no separate subtitle (UX-DR5)

**Rationale:** Stakeholder branding decision from manual testing; CHAMPIONS method identity replaces school wordmark in dashboard chrome.

---

### Edit: DESIGN.md — Logo tokens

**OLD:** `{school-logo-app-bar}` → `imports/logo-ecole-saint-hermeland.png`

**NEW:**
- `{champions-logo-app-bar}` → `public/logo-champions-wordmark.jpg` (app bar)
- `{champions-landing-hero}` → `public/logo-champions-method-full.jpg` (public landing only)
- `{school-logo-presentation}` → **unchanged** (C3 overlay only)

---

### Edit: EXPERIENCE.md — Surfaces table

**OLD App bar row:** Saint Hermeland wordmark left … muted subtitle « champions »

**NEW App bar row:** CHAMPIONS method wordmark left (52px / 40px). No subtitle.

**ADD Landing row:**

| Surface | When | Behavior |
|---------|------|----------|
| **Landing** | Unauthenticated `/` | Hero image centered; CTAs to login and register |

---

## 5. Implementation Handoff

### Scope classification: **Moderate**

Backlog update (story 1.8 + artifact edits) then direct implementation.

### Handoff

| Role | Responsibility |
|------|----------------|
| **PO / Correct Course** | Approve this proposal; merge artifact edits |
| **Developer (`bmad-build`)** | Implement story 1.8: assets, landing page, middleware redirect, app bar, tests |
| **PM / Architect** | Not required |

### Implementation sequence

1. Copy assets to `champions-app/public/`
2. Rewrite `app/page.tsx` (hero + CTAs, French)
3. Extend middleware + `middleware-policy.ts` for `/` redirect when logged in
4. Update `app-bar.tsx` + tests
5. Update `shell.test.tsx`, remove scaffold assertions
6. Sync `epics.md`, `sprint-status.yaml`, UX docs

### Success criteria

- [ ] Unauthenticated `/` shows hero + both CTAs; no dev scaffold text
- [ ] Authenticated `/` → `/dictations` (or onboarding if no class)
- [ ] App bar shows CHAMPIONS logo; Hermeland + subtitle gone
- [ ] Presentation mode still uses Hermeland logo (regression check deferred to Epic 4)
- [ ] `npm test` passes in `champions-app/`

---

## 6. Open Questions (for approval)

1. **App bar asset:** The supplied « CHAMPIONS simple » PNG includes the icon row under the letters. Confirm this is intended (vs. letters-only crop).
2. **Landing responsive:** Hero image scales to `max-w-*` with `object-contain` on mobile — OK?
