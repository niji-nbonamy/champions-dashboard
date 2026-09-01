"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DOSSIER_PRESENTATION_RETURN_FOCUS_KEY =
  "dossier-presentation-return-focus-id";

export const DOSSIER_PRESENTATION_TRIGGER_ID = "rdv-parents-trigger";

type DossierPresentationLinkProps = {
  studentId: string;
  className?: string;
};

export function DossierPresentationLink({
  studentId,
  className,
}: DossierPresentationLinkProps) {
  return (
    <Link
      id={DOSSIER_PRESENTATION_TRIGGER_ID}
      href={`/students/${studentId}/present`}
      className={cn(buttonVariants({ variant: "accent" }), className)}
      onClick={() => {
        sessionStorage.setItem(
          DOSSIER_PRESENTATION_RETURN_FOCUS_KEY,
          DOSSIER_PRESENTATION_TRIGGER_ID
        );
      }}
    >
      RDV parents
    </Link>
  );
}
