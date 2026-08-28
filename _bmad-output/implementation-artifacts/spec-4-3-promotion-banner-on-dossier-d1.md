---
title: '4-3 Promotion Banner on Dossier (D1)'
type: 'feature'
created: '2026-08-28'
status: 'done'
baseline_commit: 'ecb9aefe944b1f8eb6ded939c94f4ea9e3bb6b92'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/level-system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 3 and story 3.6 deliver validate/refuse on the class grid via D3+ dialog, but the student dossier (4.1–4.2) shows no promotion affordance. Teachers reviewing a student must return to a dictation grid to act on pending readiness (FR26, UX-DR8).

**Approach:** Load the student's pending promotion server-side on the dossier page, render a flat D1 inline banner with Valider/Refuser when pending exists, and wire dossier Server Actions to the existing validate/refuse services so outcomes match grid D3+ semantics.

## Boundaries & Constraints

**Always:**
- Reuse `validateStudentPromotion` and `refuseStudentPromotion` — no duplicate mutation logic (FR29, FR31, FR33).
- Banner visible only when `pending_promotions` row exists for the student **and** student is not archived (services reject archived rows).
- Copy: « Prêt à monter → {niveau} » via `getChampionsLevelFrenchLabel(targetLevel)` — same headline as `PromotionDialog` (UX-DR8).
- Styling: flat `bg-promotion-ready text-promotion-ready-foreground rounded-md`, `role="alert"` (UX-DR8, UX-DR25). Valider = mint primary `Button`; Refuser = outline `Button`.
- **Validate:** updates `students.level`, inserts `level_history_entries` (`action: "promoted"`), deletes pending — idempotent if pending already cleared.
- **Refuse:** level unchanged, inserts `level_history_entries` (`action: "refused"`), deletes pending; streak resets implicitly on next save re-detection (FR31).
- After success: toast + `router.refresh()` so banner, `LevelBadge`, and grid indicators sync (FR30).
- Revalidate `/students/[id]`, `/students`, `/dictations` after mutation so cross-surface pending state stays consistent.
- French microcopy. No student names in server logs (NFR10). No schema changes.

**Ask First:**
- Opening `PromotionDialog` from dossier instead of inline banner — default **exclude** (D1 is inline per UX-DR8/DESIGN.md).

**Never:**
- Manual level override, Alertes D2, presentation mode, detection-rule changes (stories 4.4–4.7).
- Client-side promotion eligibility preview or authoritative outcomes.
- Automatic level change without explicit Valider.
- Duplicating validate/refuse tx logic in UI or new services.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Pending promotion | Active student with `pending_promotions` row | D1 banner with target level + Valider/Refuser | N/A |
| No pending | No row for student | No banner; dossier unchanged | N/A |
| Valider tap | Pending exists | Level updates, history `promoted`, banner disappears | Generic toast on failure |
| Refuser tap | Pending exists | Level unchanged, history `refused`, banner disappears | Generic toast on failure |
| Archived student | `archived: true` + pending row | No banner (read-only dossier) | N/A |
| Race: pending cleared elsewhere | Action after grid validate/refuse | Idempotent success, refresh, no error toast | Same as grid actions |
| Empty dossier + pending | Zero dictations but pending row | Banner still shown above empty state | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/students/[id]/page.tsx` -- **MODIFY** fetch pending via `listPendingPromotionsForStudents`; render banner between header and content when pending + not archived. [`page.tsx:53`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L53)
- `champions-app/app/(dashboard)/students/[id]/page.test.tsx` -- **MODIFY** assert banner presence/absence, `role="alert"`, promotion-ready classes, no banner when archived.
- `champions-app/app/(dashboard)/students/actions.ts` -- **MODIFY** add `validateDossierPromotionAction` / `refuseDossierPromotionAction` calling existing services; revalidate dossier + roster + dictations paths.
- `champions-app/app/(dashboard)/students/actions.test.ts` -- **MODIFY** auth scope, revalidate paths, idempotent pending-not-found handling.
- `champions-app/components/promotion/promotion-banner.tsx` -- **CREATE** `"use client"` inline D1 bar; pending state + toast + `router.refresh()`.
- `champions-app/components/promotion/promotion-banner.test.tsx` -- **CREATE** render copy, `role="alert"`, button disabled while pending, action wiring.
- `champions-app/lib/services/list-pending-promotions.ts` -- **REUSE** `listPendingPromotionsForStudents(classId, [studentId])`. [`list-pending-promotions.ts:12`](../../champions-app/lib/services/list-pending-promotions.ts#L12)
- `champions-app/lib/services/validate-student-promotion.ts` -- **REUSE** validate tx (level update + history + delete pending). [`validate-student-promotion.ts:42`](../../champions-app/lib/services/validate-student-promotion.ts#L42)
- `champions-app/lib/services/refuse-student-promotion.ts` -- **REUSE** refuse tx (history + delete pending). [`refuse-student-promotion.ts:23`](../../champions-app/lib/services/refuse-student-promotion.ts#L23)
- `champions-app/components/promotion/promotion-dialog.tsx` -- **READ** headline copy + button variants for parity with D3+ dialog. [`promotion-dialog.tsx:75`](../../champions-app/components/promotion/promotion-dialog.tsx#L75)
- `champions-app/app/(dashboard)/dictations/actions.ts` -- **READ** `validatePromotionAction` / `refusePromotionAction` error handling + revalidate pattern. [`actions.ts:130`](../../champions-app/app/(dashboard)/dictations/actions.ts#L130)
- `champions-app/app/globals.css` -- **REUSE** `--promotion-ready` / `--promotion-ready-foreground` tokens. [`globals.css:113`](../../champions-app/app/globals.css#L113)
- `champions-app/lib/domain/champions-level.ts` -- **REUSE** `getChampionsLevelFrenchLabel`.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/app/(dashboard)/students/actions.ts` + test -- dossier validate/refuse Server Actions with cross-path revalidation -- shared mutation entry point for D1.
- [x] `champions-app/components/promotion/promotion-banner.tsx` + test -- inline D1 banner UI + client mutation flow -- UX-DR8.
- [x] `champions-app/app/(dashboard)/students/[id]/page.tsx` + test -- load pending + conditional banner placement -- FR26 dossier surface.

**Acceptance Criteria:**
- Given an active student with a pending promotion, when I open their dossier, then a banner displays « Prêt à monter → [niveau] » with Valider and Refuser and uses promotion-ready blue styling with `role="alert"` (FR26, UX-DR8, UX-DR25).
- Given I tap Valider on the dossier banner, when the action completes, then the student's level updates, history records action `promoted`, and the pending state clears (FR29, FR33).
- Given I tap Refuser on the dossier banner, when the action completes, then the level stays unchanged, history records action `refused`, pending clears, and future detection requires a new qualifying streak (FR31, FR33).
- Given no pending promotion or an archived student, when I view the dossier, then no promotion banner is shown.

## Design Notes

D1 is an **inline banner**, not a modal — do not reuse `PromotionDialog` on the dossier page. Match dialog headline copy and button variants only.

Banner placement: full width inside the dossier flow, directly below the student header block and above curve/table (or empty state).

Layout sketch:

```tsx
<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-promotion-ready px-4 py-3 text-promotion-ready-foreground">
  <p className="font-medium">Prêt à monter → {label}</p>
  <div className="flex gap-2">{/* Valider primary, Refuser outline */}</div>
</div>
```

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: promotion-banner, updated students actions, and dossier page tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Student with pending promotion: banner visible on `/students/[id]`; Valider updates badge and removes banner; grid D3/D3+ indicators sync after refresh.
- Refuser removes banner; level badge unchanged.
- Archived student with pending row: no banner, dossier still read-only.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] Normaliser `studentId.trim()` avant appels service dossier [`students/actions.ts:227`]
- [x] [Review][Patch] Propager `isRedirectError` dans les catch du banner [`promotion-banner.tsx:49`]
- [x] [Review][Patch] Tests toast erreur Refuser + boutons disabled pending [`promotion-banner.test.tsx:147`]
- [x] [Review][Patch] Assertions revalidate complètes sur chemins idempotents [`actions.test.ts:643`]
- [x] [Review][Patch] Séparer l'état pending par action (Valider/Refuser) pour éviter le mauvais libellé de chargement sur le bouton frère [`promotion-banner.tsx:30`]
- [x] [Review][Patch] Appeler `router.refresh()` sur le chemin `result.error` pour aligner avec `class-grid.tsx` [`promotion-banner.tsx:42`]
- [x] [Review][Patch] Compléter les tests `refuseDossierPromotionAction` (redirect login, ID blank) [`actions.test.ts:677`]
- [x] [Review][Patch] Tester `studentId.trim()` avec UUID paddé sur validate et refuse [`actions.test.ts:649`]
- [x] [Review][Patch] Tester la propagation `isRedirectError` dans `PromotionBanner` [`promotion-banner.test.tsx`]
- [x] [Review][Patch] Vérifier le câblage `studentId` page → bannière dans `page.test.tsx` [`page.test.tsx:51`]
- [x] [Review][Patch] Tester le placement bannière au-dessus de la courbe quand l'historique est non vide [`page.test.tsx:340`]
- [x] [Review][Patch] Tester le chemin catch (exception inattendue) dans `PromotionBanner` [`promotion-banner.test.tsx:121`]
- [x] [Review][Defer] Actions grille ne revalident pas `/students/[id]` — pré-existant, hors scope 4-3 [`dictations/actions.ts:152`]
- [x] [Review][Defer] `targetLevel` invalide en base masque silencieusement la bannière — comportement service existant [`list-pending-promotions.ts:38`]
- [x] [Review][Defer] Fetches séquentiels sur la page dossier — optimisation hors scope [`page.tsx:55`]

## Suggested Review Order

**Dossier orchestration**

- Charge le pending server-side et affiche la bannière sous l'en-tête élève.
  [`page.tsx:58`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L58)

**Promotion mutations**

- Server Actions dossier réutilisant validate/refuse existants + revalidation croisée.
  [`actions.ts:227`](../../champions-app/app/(dashboard)/students/actions.ts#L227)

**D1 inline banner**

- Bannière bleue `role="alert"` avec Valider/Refuser inline (pas de dialog).
  [`promotion-banner.tsx:84`](../../champions-app/components/promotion/promotion-banner.tsx#L84)

**Tests**

- Couverture banner, actions dossier, et placement page.
  [`promotion-banner.test.tsx:64`](../../champions-app/components/promotion/promotion-banner.test.tsx#L64)
  [`page.test.tsx:340`](../../champions-app/app/(dashboard)/students/[id]/page.test.tsx#L340)
