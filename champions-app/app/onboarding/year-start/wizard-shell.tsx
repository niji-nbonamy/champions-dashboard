"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { YearStartWizardStep } from "@/lib/services/get-year-start-wizard-status";

const STEP_LABELS: Record<YearStartWizardStep, string> = {
  1: "Liste d'élèves",
  2: "Niveaux",
  3: "Matrice mots",
};

type WizardShellProps = {
  currentStep: YearStartWizardStep;
  children: React.ReactNode;
  backHref?: string;
  footer?: React.ReactNode;
};

export function WizardShell({
  currentStep,
  children,
  backHref,
  footer,
}: WizardShellProps) {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            Étape {currentStep} sur 3 — {STEP_LABELS[currentStep]}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Configuration de l&apos;année
          </h1>
        </div>

        <div className="flex flex-col gap-6">{children}</div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {backHref ? (
            <Link
              href={backHref}
              className={buttonVariants({ variant: "outline" })}
            >
              Retour
            </Link>
          ) : (
            <span />
          )}
          {footer}
        </div>
      </div>
    </main>
  );
}
