"use client";

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
        <h1 className="text-xl font-semibold tracking-tight">{firstName}</h1>
        <div className="flex items-center gap-2">
          {previousStudentId ? (
            <Link
              href={`/dictations/${dictationId}/mobile/${previousStudentId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Précédent
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Précédent
            </Button>
          )}
          {nextStudentId ? (
            <Link
              href={`/dictations/${dictationId}/mobile/${nextStudentId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Suivant
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Suivant
            </Button>
          )}
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
        Enregistrer
      </Button>
    </div>
  );
}
