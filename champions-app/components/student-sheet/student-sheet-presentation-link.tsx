"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const STUDENT_SHEET_PRESENTATION_RETURN_FOCUS_KEY =
  "student-sheet-presentation-return-focus-id";

export const STUDENT_SHEET_PRESENTATION_TRIGGER_ID = "rdv-parents-trigger";

type StudentSheetPresentationLinkProps = {
  studentId: string;
  className?: string;
};

export function StudentSheetPresentationLink({
  studentId,
  className,
}: StudentSheetPresentationLinkProps) {
  return (
    <Link
      id={STUDENT_SHEET_PRESENTATION_TRIGGER_ID}
      href={`/students/${studentId}/present`}
      className={cn(buttonVariants({ variant: "accent" }), className)}
      onClick={() => {
        sessionStorage.setItem(
          STUDENT_SHEET_PRESENTATION_RETURN_FOCUS_KEY,
          STUDENT_SHEET_PRESENTATION_TRIGGER_ID
        );
      }}
    >
      RDV parents
    </Link>
  );
}
