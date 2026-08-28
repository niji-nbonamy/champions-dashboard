"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  refusePromotionAction,
  saveDictationAction,
  validatePromotionAction,
} from "@/app/(dashboard)/dictations/actions";
import {
  DICTATION_SAVE_GENERIC_ERROR,
  DICTATION_SAVE_SUCCESS_MESSAGE,
} from "@/lib/domain/dictation-save-messages";
import {
  PROMOTION_REFUSE_GENERIC_ERROR,
} from "@/lib/services/refuse-student-promotion";
import {
  PROMOTION_VALIDATE_GENERIC_ERROR,
} from "@/lib/services/validate-student-promotion";

import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { PromotionDialog } from "@/components/promotion/promotion-dialog";
import { parseChampionsLevel } from "@/lib/domain/champions-level";
import {
  CHAMPIONS_ERROR_CATEGORIES,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";
import {
  formatGridRowValidationMessage,
  validateGridRow,
} from "@/lib/domain/grid-validation";
import { getStudentFirstName } from "@/lib/domain/student-display-name";
import type { LeveledActiveStudent } from "@/lib/services/list-leveled-active-students";
import type { PendingPromotionByStudent } from "@/lib/services/list-pending-promotions";

import { CategoryHeader } from "./category-header";
import { GridCell } from "./grid-cell";

type GridCounts = Record<string, Record<ChampionsErrorCategoryLetter, number>>;

function createEmptyCounts(): Record<ChampionsErrorCategoryLetter, number> {
  return CHAMPIONS_ERROR_CATEGORIES.reduce(
    (counts, category) => {
      counts[category.letter] = 0;
      return counts;
    },
    {} as Record<ChampionsErrorCategoryLetter, number>
  );
}

function createInitialGridCounts(
  students: LeveledActiveStudent[],
  initialCounts?: GridCounts
): GridCounts {
  return students.reduce<GridCounts>((counts, student) => {
    counts[student.id] = {
      ...createEmptyCounts(),
      ...(initialCounts?.[student.id] ?? {}),
    };
    return counts;
  }, {});
}

type ClassGridProps = {
  dictationId: string;
  students: LeveledActiveStudent[];
  wordTotalsByStudentId: Record<string, number>;
  initialCounts?: GridCounts;
  readOnlyStudentIds?: string[];
  pendingPromotionsByStudentId?: Record<string, PendingPromotionByStudent>;
};

export function ClassGrid({
  dictationId,
  students,
  wordTotalsByStudentId,
  initialCounts,
  readOnlyStudentIds = [],
  pendingPromotionsByStudentId: pendingPromotionsProp,
}: ClassGridProps) {
  const router = useRouter();
  const pendingPromotionsByStudentId = pendingPromotionsProp ?? {};
  const readOnlyIds = useMemo(
    () => new Set(readOnlyStudentIds),
    [readOnlyStudentIds]
  );

  const [counts, setCounts] = useState<GridCounts>(() =>
    createInitialGridCounts(students, initialCounts)
  );
  const [isPending, startTransition] = useTransition();
  const [isPromotionPending, startPromotionTransition] = useTransition();
  const [promotionDialogStudentId, setPromotionDialogStudentId] = useState<
    string | null
  >(null);
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const studentMeta = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        firstName: getStudentFirstName(student.displayName),
        level: parseChampionsLevel(student.level),
      })),
    [students]
  );

  const rowValidation = useMemo(() => {
    const byStudentId: Record<
      string,
      ReturnType<typeof validateGridRow> & { message?: string }
    > = {};

    for (const student of studentMeta) {
      const studentCounts = {
        ...createEmptyCounts(),
        ...(counts[student.id] ?? {}),
      };
      const wordTotal = wordTotalsByStudentId[student.id] ?? 0;
      const result = validateGridRow(studentCounts, wordTotal);

      byStudentId[student.id] = {
        ...result,
        message: result.valid
          ? undefined
          : formatGridRowValidationMessage(
              student.firstName,
              result.sumErrors,
              result.wordTotal
            ),
      };
    }

    return byStudentId;
  }, [counts, studentMeta, wordTotalsByStudentId]);

  const allRowsValid = useMemo(() => {
    const editableStudents = studentMeta.filter(
      (student) => !readOnlyIds.has(student.id)
    );

    return (
      editableStudents.length > 0 &&
      editableStudents.every((student) => rowValidation[student.id]?.valid)
    );
  }, [readOnlyIds, rowValidation, studentMeta]);

  const lastStudentIndex = students.length - 1;
  const lastCategoryIndex = CHAMPIONS_ERROR_CATEGORIES.length - 1;

  const isStudentEditable = useCallback(
    (studentIndex: number) => {
      const student = students[studentIndex];
      return student !== undefined && !readOnlyIds.has(student.id);
    },
    [readOnlyIds, students]
  );

  const findEditableStudentIndex = useCallback(
    (startIndex: number, direction: 1 | -1): number | null => {
      let index = startIndex;
      while (index >= 0 && index <= lastStudentIndex) {
        if (isStudentEditable(index)) {
          return index;
        }
        index += direction;
      }
      return null;
    },
    [isStudentEditable, lastStudentIndex]
  );

  const focusCell = useCallback(
    (studentIndex: number, categoryIndex: number) => {
      const input = inputRefs.current[studentIndex]?.[categoryIndex];
      input?.focus();
      input?.select();
    },
    []
  );

  const handleArrowKey = useCallback(
    (
      studentIndex: number,
      categoryIndex: number,
      direction: "left" | "right" | "up" | "down"
    ) => {
      let nextStudentIndex = studentIndex;
      let nextCategoryIndex = categoryIndex;

      if (direction === "left") {
        nextCategoryIndex = Math.max(0, categoryIndex - 1);
      } else if (direction === "right") {
        nextCategoryIndex = Math.min(lastCategoryIndex, categoryIndex + 1);
      } else if (direction === "up") {
        const candidate = findEditableStudentIndex(studentIndex - 1, -1);
        if (candidate === null) {
          return;
        }
        nextStudentIndex = candidate;
      } else if (direction === "down") {
        const candidate = findEditableStudentIndex(studentIndex + 1, 1);
        if (candidate === null) {
          return;
        }
        nextStudentIndex = candidate;
      }

      if (!isStudentEditable(nextStudentIndex)) {
        return;
      }

      focusCell(nextStudentIndex, nextCategoryIndex);
    },
    [
      findEditableStudentIndex,
      focusCell,
      isStudentEditable,
      lastCategoryIndex,
      lastStudentIndex,
    ]
  );

  const handleTabWrap = useCallback(
    (direction: "forward" | "backward") => {
      if (direction === "forward") {
        const firstEditable = findEditableStudentIndex(0, 1);
        if (firstEditable === null) {
          return;
        }
        focusCell(firstEditable, 0);
        return;
      }

      const lastEditable = findEditableStudentIndex(lastStudentIndex, -1);
      if (lastEditable === null) {
        return;
      }

      focusCell(lastEditable, lastCategoryIndex);
    },
    [findEditableStudentIndex, focusCell, lastCategoryIndex, lastStudentIndex]
  );

  const handleValueChange = useCallback(
    (
      studentId: string,
      letter: ChampionsErrorCategoryLetter,
      value: number
    ) => {
      if (readOnlyIds.has(studentId)) {
        return;
      }

      if (!Number.isFinite(value) || value < 0) {
        return;
      }

      setCounts((current) => ({
        ...current,
        [studentId]: {
          ...current[studentId],
          [letter]: value,
        },
      }));
    },
    [readOnlyIds]
  );

  const handleSave = useCallback(() => {
    if (!allRowsValid || isPending || isPromotionPending) {
      return;
    }

    const editableCounts = Object.fromEntries(
      Object.entries(counts).filter(([studentId]) => !readOnlyIds.has(studentId))
    );

    startTransition(async () => {
      try {
        const result = await saveDictationAction(dictationId, editableCounts);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success(DICTATION_SAVE_SUCCESS_MESSAGE);
        router.refresh();
      } catch {
        toast.error(DICTATION_SAVE_GENERIC_ERROR);
      }
    });
  }, [allRowsValid, counts, dictationId, isPending, isPromotionPending, readOnlyIds, router]);

  const promotionDialogStudent = useMemo(() => {
    if (!promotionDialogStudentId) {
      return null;
    }

    const student = studentMeta.find(
      (entry) => entry.id === promotionDialogStudentId
    );
    const pending = pendingPromotionsByStudentId[promotionDialogStudentId];

    if (!student || !pending) {
      return null;
    }

    return {
      id: student.id,
      firstName: student.firstName,
      targetLevel: pending.targetLevel,
    };
  }, [pendingPromotionsByStudentId, promotionDialogStudentId, studentMeta]);

  useEffect(() => {
    if (promotionDialogStudentId && !promotionDialogStudent) {
      setPromotionDialogStudentId(null);
    }
  }, [promotionDialogStudent, promotionDialogStudentId]);

  const closePromotionDialog = useCallback(() => {
    if (isPromotionPending) {
      return;
    }

    setPromotionDialogStudentId(null);
  }, [isPromotionPending]);

  const handlePromotionValidate = useCallback(() => {
    if (!promotionDialogStudentId || isPromotionPending) {
      return;
    }

    startPromotionTransition(async () => {
      try {
        const result = await validatePromotionAction(
          promotionDialogStudentId,
          dictationId
        );

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Niveau mis à jour.");
        setPromotionDialogStudentId(null);
        router.refresh();
      } catch {
        toast.error(PROMOTION_VALIDATE_GENERIC_ERROR);
        setPromotionDialogStudentId(null);
        router.refresh();
      }
    });
  }, [dictationId, isPromotionPending, promotionDialogStudentId, router]);

  const handlePromotionRefuse = useCallback(() => {
    if (!promotionDialogStudentId || isPromotionPending) {
      return;
    }

    startPromotionTransition(async () => {
      try {
        const result = await refusePromotionAction(
          promotionDialogStudentId,
          dictationId
        );

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Promotion refusée.");
        setPromotionDialogStudentId(null);
        router.refresh();
      } catch {
        toast.error(PROMOTION_REFUSE_GENERIC_ERROR);
        setPromotionDialogStudentId(null);
        router.refresh();
      }
    });
  }, [dictationId, isPromotionPending, promotionDialogStudentId, router]);

  const handleContainerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" || !allRowsValid || isPending) {
        return;
      }

      const target = event.target;
      if (target instanceof HTMLInputElement) {
        return;
      }

      event.preventDefault();
      handleSave();
    },
    [allRowsValid, handleSave, isPending]
  );

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun élève nivelé.{" "}
        <Link
          href="/students"
          className="underline underline-offset-4"
        >
          Élèves
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={gridContainerRef}
        tabIndex={-1}
        onKeyDown={handleContainerKeyDown}
        className="overflow-x-auto rounded-lg border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <table className="min-w-full border-collapse text-sm">
          <caption className="sr-only">
            Grille de saisie des erreurs CHAMPIONS par élève
          </caption>
          <thead className="bg-muted/40">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-[10rem] bg-muted/40 px-3 py-2 text-left font-medium"
              >
                Élève
              </th>
              {CHAMPIONS_ERROR_CATEGORIES.map((category) => (
                <CategoryHeader key={category.letter} category={category} />
              ))}
              <th scope="col" className="w-12 px-2 py-2">
                <span className="sr-only">Promotion</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {studentMeta.map((student, studentIndex) => {
              const validation = rowValidation[student.id];
              const rowInvalid =
                !readOnlyIds.has(student.id) && validation?.valid === false;
              const pendingPromotion =
                pendingPromotionsByStudentId[student.id] ?? null;
              const isReadOnlyRow = readOnlyIds.has(student.id);

              return (
                <tr key={student.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-normal"
                  >
                    <span className="flex w-full items-center gap-2">
                      {pendingPromotion ? (
                        <>
                          <span
                            className="shrink-0 text-promotion-ready"
                            aria-hidden="true"
                          >
                            ⬆️
                          </span>
                          <span className="sr-only">
                            Promotion en attente pour {student.firstName}
                          </span>
                        </>
                      ) : null}
                      <span className="min-w-0 flex-1 break-words">
                        {student.displayName}
                      </span>
                      <span className="flex w-[4.5rem] shrink-0 justify-end">
                        {student.level ? (
                          <LevelBadge
                            level={student.level}
                            className="px-1.5 py-0"
                          />
                        ) : null}
                      </span>
                    </span>
                    {validation?.message && !readOnlyIds.has(student.id) ? (
                      <p
                        className="mt-1 text-xs text-destructive"
                        role="alert"
                      >
                        {validation.message}
                      </p>
                    ) : null}
                  </th>
                  {CHAMPIONS_ERROR_CATEGORIES.map((category, categoryIndex) => (
                    <GridCell
                      key={`${student.id}-${category.letter}`}
                      studentId={student.id}
                      categoryLetter={category.letter}
                      categoryName={category.name}
                      firstName={student.firstName}
                      value={counts[student.id]?.[category.letter] ?? 0}
                      studentIndex={studentIndex}
                      categoryIndex={categoryIndex}
                      isFirstCell={studentIndex === 0 && categoryIndex === 0}
                      isLastCell={
                        studentIndex === lastStudentIndex &&
                        categoryIndex === lastCategoryIndex
                      }
                      hasValidationError={rowInvalid}
                      disabled={isPending || readOnlyIds.has(student.id)}
                      inputRef={(element) => {
                        if (!inputRefs.current[studentIndex]) {
                          inputRefs.current[studentIndex] = [];
                        }
                        inputRefs.current[studentIndex][categoryIndex] =
                          element;
                      }}
                      onValueChange={handleValueChange}
                      onArrowKey={handleArrowKey}
                      onTabWrap={handleTabWrap}
                    />
                  ))}
                  <td className="px-2 py-2 text-center">
                    {pendingPromotion && !isReadOnlyRow ? (
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-full bg-promotion-ready text-sm font-semibold text-promotion-ready-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        aria-label={`Ouvrir la promotion pour ${student.firstName}`}
                        disabled={isPending || isPromotionPending}
                        onClick={() => setPromotionDialogStudentId(student.id)}
                      >
                        +
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button
        type="button"
        disabled={!allRowsValid || isPending || isPromotionPending}
        onClick={handleSave}
      >
        {isPending ? (
          <>
            <Loader2
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
            Enregistrement…
          </>
        ) : (
          "Enregistrer"
        )}
      </Button>
      {promotionDialogStudent ? (
        <PromotionDialog
          open={promotionDialogStudentId !== null}
          studentFirstName={promotionDialogStudent.firstName}
          targetLevel={promotionDialogStudent.targetLevel}
          pending={isPromotionPending}
          onClose={closePromotionDialog}
          onValidate={handlePromotionValidate}
          onRefuse={handlePromotionRefuse}
        />
      ) : null}
    </div>
  );
}
