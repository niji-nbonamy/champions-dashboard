---
project: testBMAD
date: 08-27-2026
change_scope: moderate
status: approved
trigger: new-stakeholder-requirement
approved_by: Nicolas.bonamy
approved_date: 08-27-2026
---

# Sprint Change Proposal — Auth Form UX & Registration Security

## 1. Issue Summary

### Problem statement

Post-delivery of Epic 1 (stories 1.2 and 1.3), stakeholder identified that registration and login forms are too minimal for production use:

- No password visibility toggle
- No password confirmation field
- No real-time password requirement feedback
- No bot protection (captcha) on registration
- Password policy server-side only enforces minimum 8 characters (no complexity rules)
- Auth form labels currently in English (inconsistent with NFR14 French microcopy elsewhere)

### Context

- **Discovered:** 08-26-2026 during product review (stakeholder mockup provided)
- **Triggering stories:** 1.2 (Teacher Registration), 1.3 (Teacher Login) — both `done`
- **Evidence:** Current `register-form.tsx` and `login-form-fields.tsx` implement email + password only; `lib/domain/registration.ts` validates length only

### Stakeholder decisions (08-26 / 08-27-2026)

| Decision | Choice |
|----------|--------|
| UI language | French |
| reCAPTCHA | v2 checkbox, register only |
| Login captcha | No |
| Dev without keys | Bypass allowed in non-production when `RECAPTCHA_SECRET_KEY` absent |

---

## 2. Impact Analysis

### Epic impact

| Epic | Impact |
|------|--------|
| **Epic 1** | New story **1.7** added; epic remains `in-progress` |
| **Epic 2–5** | No impact |

### Story impact

| Story | Change |
|-------|--------|
| 1.2, 1.3 | Unchanged (remain `done`); 1.7 extends without reopening |
| **1.7** (NEW) | `backlog` — Auth Form UX & Registration Security |

### Artifact conflicts resolved

| Artifact | Update applied |
|----------|----------------|
| `epics.md` | Story 1.7 inserted after 1.6 |
| `SPEC.md` | New § Auth & Registration (FR-AUTH-1..6, NFR-AUTH-1..3) |
| `ARCHITECTURE-SPINE.md` | AD-12 added; Config row updated; Capability map updated; Deferred table updated |
| `DESIGN.md` | New § Auth Forms + brand-layer components |
| `sprint-status.yaml` | `1-7-auth-form-ux-registration-security: backlog` |

### Technical impact

- **Domain:** `lib/domain/registration.ts` — strengthen `isValidPassword()` with complexity regex
- **Service:** `lib/services/recaptcha-verify.ts` — new; calls Google `siteverify` API
- **Components:** `components/auth/password-field.tsx`, `password-requirements.tsx`, `recaptcha-field.tsx`
- **Forms:** `register-form.tsx`, `login-form-fields.tsx` — refactor to French + new UX
- **Env vars:** `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` (already in `.env.example`)
- **Tests:** Update register/login action and form tests; mock reCAPTCHA in CI
- **No DB schema change**

---

## 3. Recommended Approach

**Selected: Option 1 — Direct Adjustment**

| Criterion | Assessment |
|-----------|------------|
| Effort | **Medium** (~1 story) |
| Risk | **Low–Medium** (external reCAPTCHA dependency; mitigated by dev bypass) |
| Timeline | Can run in parallel with Epic 2 backlog stories |
| MVP | Not affected — security/UX hardening within existing auth scope |

**Not chosen:**
- Rollback of 1.2/1.3 — unnecessary; base implementation remains valid
- MVP scope reduction — not applicable

---

## 4. Detailed Change Proposals

All four incremental proposals approved by stakeholder on 08-26 and 08-27-2026. Changes applied to artifacts listed in §2.

### Story 1.7 summary

**Registration (French):** password toggle, confirmation field, live requirements inset, reCAPTCHA v2, server-side policy enforcement, NFR9 preserved.

**Login (French):** password toggle only, no captcha.

---

## 5. Implementation Handoff

### Scope classification: **Moderate**

Backlog updated; new story added to completed epic; no fundamental replan required.

### Handoff

| Role | Responsibility |
|------|----------------|
| **Developer (`bmad-build`)** | Implement story 1.7 per updated epics, spec, architecture, UX |
| **Stakeholder** | Create Google reCAPTCHA v2 project; add keys to `.env.local` and Vercel before prod deploy |

### Implementation sequence

1. Run `bmad-build` on story `1-7-auth-form-ux-registration-security`
2. Implement shared `components/auth/*` and domain password policy
3. Wire reCAPTCHA server verification in `registerAction`
4. Translate auth form copy to French
5. Update tests (unit + form); mock reCAPTCHA in CI
6. Before prod: configure `RECAPTCHA_*` in Vercel environment variables

### Success criteria

- [ ] Registration shows all UX elements per DESIGN.md § Auth Forms
- [ ] Password policy enforced client-side (feedback) and server-side (validation)
- [ ] reCAPTCHA required in production; bypass only in non-prod without keys
- [ ] Login has password toggle, no captcha
- [ ] All auth copy in French
- [ ] NFR9 preserved (generic errors)
- [ ] Tests pass in CI without real reCAPTCHA keys

### reCAPTCHA setup guide (stakeholder)

1. Create project at https://www.google.com/recaptcha/admin/create
2. Type: reCAPTCHA v2 → « Je ne suis pas un robot »
3. Domains: `localhost` + Vercel prod domain
4. Copy keys to `champions-app/.env.local` and Vercel env vars

---

## Approval

- [x] Stakeholder approves this Sprint Change Proposal for implementation

**Approved by:** Nicolas.bonamy **Date:** 08-27-2026
