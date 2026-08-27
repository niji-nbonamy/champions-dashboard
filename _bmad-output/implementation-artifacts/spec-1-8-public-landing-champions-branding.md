# Story 1.8 — Public Landing Page & CHAMPIONS App Bar Branding

**Status:** done  
**Approved via:** sprint-change-proposal-08-27-2026-landing-branding.md (08-27-2026)

## Summary

Replaced the dev scaffold landing page with a branded public entry surface and updated dashboard app bar branding per manual testing feedback.

## Changes

- `app/page.tsx` — hero image + CTAs; redirect authenticated users to `/dictations`
- `middleware.ts` + `lib/auth/middleware-policy.ts` — `/` in matcher; logged-in redirect
- `components/brand/champions-wordmark.tsx` — shared wordmark (app bar + presentation variants)
- `components/dashboard/presentation-brand-logo.tsx` — fixed bottom-right logo for C3 (story 4.7)
- `components/dashboard/app-bar.tsx` — uses shared `ChampionsWordmark`
- `public/logo-champions-method-full.jpg`, `public/logo-champions-wordmark.jpg` — new assets (JPEG; `.jpg` extension matches file format)
- Tests updated: `shell.test.tsx`, `app-bar.test.tsx`, `dashboard-shell.test.tsx`, `middleware-policy.test.ts`, `champions-wordmark.test.tsx`, `presentation-brand-logo.test.tsx`

## Presentation mode (C3)

- `PresentationBrandLogo` renders the CHAMPIONS simple wordmark bottom-right (44px, opacity 0.85, 24px margin).
- Story 4.7 should import this component when building full-screen « RDV parents » mode.

## Manual verification

- [ ] Visit `/` logged out → hero + CTAs visible
- [ ] Visit `/` logged in → lands on Dictées tab
- [ ] Dashboard app bar shows CHAMPIONS logo (no Hermeland)
