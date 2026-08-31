"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { saveDictationStudentEntryAction } from "@/app/(dashboard)/dictations/actions";
import { MobileErrorField } from "@/components/dictations/mobile-error-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  CHAMPIONS_ERROR_CATEGORIES,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";
import { DICTATION_SAVE_GENERIC_ERROR } from "@/lib/domain/dictation-save-messages";
import {
  formatGridRowValidationMessage,
  validateGridRow,
  type CategoryErrorCounts,
} from "@/lib/domain/grid-validation";
import { getStudentFirstName } from "@/lib/domain/student-display-name";
import { cn } from "@/lib/utils";

type MobilePerStudentFormProps = {
  dictationId: string;
  studentId: string;
  displayName: string;
  wordDenominator: number;
  initialCounts: CategoryErrorCounts;
  orderedStudentIds: string[];
};

function getAdjacentStudentId(
  orderedStudentIds: string[],
  currentStudentId: string,
  direction: "previous" | "next"
): string | null {
  const currentIndex = orderedStudentIds.indexOf(currentStudentId);

  if (currentIndex === -1) {
    return null;
  }

  const nextIndex =
    direction === "previous" ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= orderedStudentIds.length) {
    return null;
  }

  return orderedStudentIds[nextIndex] ?? null;
}

type StudentNavigationControlProps = {
  dictationId: string;
  targetStudentId: string | null;
  direction: "previous" | "next";
  disabled: boolean;
};

function StudentNavigationControl({
  dictationId,
  targetStudentId,
  direction,
  disabled,
}: StudentNavigationControlProps) {
  const label =
    direction === "previous" ? "Élève précédent" : "Élève suivant";
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  if (disabled || !targetStudentId) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="min-h-11 min-w-11"
        disabled
        aria-label={label}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Link
      href={`/dictations/${dictationId}/mobile/${targetStudentId}`}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "min-h-11 min-w-11"
      )}
      aria-label={label}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}

export function MobilePerStudentForm({
  dictationId,
  studentId,
  displayName,
  wordDenominator,
  initialCounts,
  orderedStudentIds,
}: MobilePerStudentFormProps) {
  const router = useRouter();
  const [counts, setCounts] = useState<CategoryErrorCounts>(initialCounts);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const firstName = getStudentFirstName(displayName);
  const validation = useMemo(
    () => validateGridRow(counts, wordDenominator),
    [counts, wordDenominator]
  );

  const previousStudentId = getAdjacentStudentId(
    orderedStudentIds,
    studentId,
    "previous"
  );
  const nextStudentId = getAdjacentStudentId(
    orderedStudentIds,
    studentId,
    "next"
  );

  function handleValueChange(
    letter: ChampionsErrorCategoryLetter,
    value: number
  ) {
    setSaveError(null);
    setCounts((current) => ({
      ...current,
      [letter]: value,
    }));
  }

  function handleSave() {
    if (!validation.valid || isPending) {
      return;
    }

    setSaveError(null);

    startTransition(async () => {
      try {
        const result = await saveDictationStudentEntryAction(
          dictationId,
          studentId,
          counts
        );

        if (result.error) {
          setSaveError(result.error);
          return;
        }

        router.push(`/dictations/${dictationId}/mobile`);
        router.refresh();
      } catch {
        setSaveError(DICTATION_SAVE_GENERIC_ERROR);
      }
    });
  }

  const validationMessage = validation.valid
    ? null
    : formatGridRowValidationMessage(
        firstName,
        validation.sumErrors,
        validation.wordTotal
      );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
        <div className="flex items-center gap-2">
          <StudentNavigationControl
            dictationId={dictationId}
            targetStudentId={previousStudentId}
            direction="previous"
            disabled={isPending || !previousStudentId}
          />
          <StudentNavigationControl
            dictationId={dictationId}
            targetStudentId={nextStudentId}
            direction="next"
            disabled={isPending || !nextStudentId}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {CHAMPIONS_ERROR_CATEGORIES.map((category) => (
          <MobileErrorField
            key={category.letter}
            categoryLetter={category.letter}
            categoryName={category.name}
            firstName={firstName}
            value={counts[category.letter]}
            onChange={handleValueChange}
            hasValidationError={!validation.valid}
          />
        ))}
      </div>

      {validationMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {validationMessage}
        </p>
      ) : null}

      {saveError ? (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="min-h-12 w-full"
        disabled={!validation.valid || isPending}
        onClick={handleSave}
      >
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
