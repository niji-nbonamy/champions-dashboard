"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
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

function createInitialGridCounts(students: LeveledActiveStudent[]): GridCounts {
  return students.reduce<GridCounts>((counts, student) => {
    counts[student.id] = createEmptyCounts();
    return counts;
  }, {});
}

type ClassGridProps = {
  students: LeveledActiveStudent[];
  wordTotalsByStudentId: Record<string, number>;
};

export function ClassGrid({
  students,
  wordTotalsByStudentId,
}: ClassGridProps) {
  const [counts, setCounts] = useState<GridCounts>(() =>
    createInitialGridCounts(students)
  );
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

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

  const allRowsValid = useMemo(
    () =>
      studentMeta.length > 0 &&
      studentMeta.every((student) => rowValidation[student.id]?.valid),
    [rowValidation, studentMeta]
  );

  const lastStudentIndex = students.length - 1;
  const lastCategoryIndex = CHAMPIONS_ERROR_CATEGORIES.length - 1;

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
        nextStudentIndex = Math.max(0, studentIndex - 1);
      } else if (direction === "down") {
        nextStudentIndex = Math.min(lastStudentIndex, studentIndex + 1);
      }

      focusCell(nextStudentIndex, nextCategoryIndex);
    },
    [focusCell, lastCategoryIndex, lastStudentIndex]
  );

  const handleTabWrap = useCallback(
    (direction: "forward" | "backward") => {
      if (direction === "forward") {
        focusCell(0, 0);
        return;
      }

      focusCell(lastStudentIndex, lastCategoryIndex);
    },
    [focusCell, lastCategoryIndex, lastStudentIndex]
  );

  const handleValueChange = useCallback(
    (
      studentId: string,
      letter: ChampionsErrorCategoryLetter,
      value: number
    ) => {
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
    []
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
      <div className="overflow-x-auto rounded-lg border border-border">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {studentMeta.map((student, studentIndex) => {
              const validation = rowValidation[student.id];
              const rowInvalid = validation?.valid === false;

              return (
                <tr key={student.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-normal"
                  >
                    <span className="flex w-full items-center gap-2">
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
                    {validation?.message ? (
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button type="button" disabled={!allRowsValid}>
        Enregistrer
      </Button>
    </div>
  );
}
