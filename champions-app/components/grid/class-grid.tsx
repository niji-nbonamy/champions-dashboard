"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import { LevelBadge } from "@/components/ui/level-badge";
import { parseChampionsLevel } from "@/lib/domain/champions-level";
import {
  CHAMPIONS_ERROR_CATEGORIES,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";
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
};

export function ClassGrid({ students }: ClassGridProps) {
  const [counts, setCounts] = useState<GridCounts>(() =>
    createInitialGridCounts(students)
  );
  const [openCategory, setOpenCategory] =
    useState<ChampionsErrorCategoryLetter | null>(null);
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
        Aucun élève actif nivelé (non archivé) pour cette dictée.{" "}
        <Link
          href="/students"
          className="underline underline-offset-4"
        >
          Assigner des niveaux sur Élèves
        </Link>
        .
      </p>
    );
  }

  return (
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
              <CategoryHeader
                key={category.letter}
                category={category}
                open={openCategory === category.letter}
                onToggle={() =>
                  setOpenCategory((current) =>
                    current === category.letter ? null : category.letter
                  )
                }
                onClose={() => setOpenCategory(null)}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {studentMeta.map((student, studentIndex) => (
            <tr key={student.id}>
              <th
                scope="row"
                className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-normal"
              >
                <span className="flex items-center gap-2">
                  <span>{student.displayName}</span>
                  {student.level ? (
                    <LevelBadge level={student.level} className="px-1.5 py-0" />
                  ) : null}
                </span>
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
                  inputRef={(element) => {
                    if (!inputRefs.current[studentIndex]) {
                      inputRefs.current[studentIndex] = [];
                    }
                    inputRefs.current[studentIndex][categoryIndex] = element;
                  }}
                  onValueChange={handleValueChange}
                  onArrowKey={handleArrowKey}
                  onTabWrap={handleTabWrap}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
