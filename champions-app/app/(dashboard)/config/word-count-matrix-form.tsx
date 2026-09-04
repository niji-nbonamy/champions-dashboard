"use client";

import { useActionState, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { CHAMPIONS_LEVELS, getChampionsLevelFrenchLabel } from "@/lib/domain/champions-level";
import {
  DICTATION_LABEL_MAX_LENGTH,
  type WordCountMatrixRowInput,
} from "@/lib/domain/word-count-matrix";
import type { ChampionsLevel } from "@/lib/design/tokens";

import {
  saveWordCountMatrixAction,
  type SaveWordCountMatrixActionState,
} from "./actions";

type MatrixRowState = {
  clientId: string;
  label: string;
  wordsYellow: string;
  wordsGreen: string;
  wordsViolet: string;
  wordsGold: string;
};

type WordCountMatrixFormProps = {
  initialRows: WordCountMatrixRowInput[];
  showDefaultSaveButton?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
};

const LEVEL_COLUMNS: Array<{
  level: ChampionsLevel;
  field: keyof Pick<
    MatrixRowState,
    "wordsYellow" | "wordsGreen" | "wordsViolet" | "wordsGold"
  >;
  formName: string;
}> = [
  { level: "yellow", field: "wordsYellow", formName: "words_yellow" },
  { level: "green", field: "wordsGreen", formName: "words_green" },
  { level: "violet", field: "wordsViolet", formName: "words_violet" },
  { level: "gold", field: "wordsGold", formName: "words_gold" },
];

const initialActionState: SaveWordCountMatrixActionState = {
  error: null,
  success: null,
  errorRowIndex: null,
  errorField: null,
};

function createStableClientId(existingRows: MatrixRowState[]): string {
  let maxIndex = -1;

  for (const row of existingRows) {
    const match = /^row-(\d+)$/.exec(row.clientId);

    if (match) {
      maxIndex = Math.max(maxIndex, Number.parseInt(match[1], 10));
    }
  }

  return `row-${maxIndex + 1}`;
}

function toMatrixRowState(
  row: WordCountMatrixRowInput,
  index: number
): MatrixRowState {
  return {
    clientId: `row-${index}`,
    label: row.label,
    wordsYellow: row.wordsYellow,
    wordsGreen: row.wordsGreen,
    wordsViolet: row.wordsViolet,
    wordsGold: row.wordsGold,
  };
}

function createEmptyRow(existingRows: MatrixRowState[]): MatrixRowState {
  return {
    clientId: createStableClientId(existingRows),
    label: "",
    wordsYellow: "",
    wordsGreen: "",
    wordsViolet: "",
    wordsGold: "",
  };
}

function mapInitialRows(initialRows: WordCountMatrixRowInput[]): MatrixRowState[] {
  if (initialRows.length === 0) {
    return [];
  }

  return initialRows.map((row, index) => toMatrixRowState(row, index));
}

function isFieldInvalid(
  state: SaveWordCountMatrixActionState,
  rowIndex: number,
  field: string
): boolean {
  if (!state.error || state.errorField === "duplicate") {
    return false;
  }

  if (state.errorRowIndex == null) {
    return false;
  }

  if (state.errorRowIndex !== rowIndex) {
    return false;
  }

  if (!state.errorField) {
    return true;
  }

  return state.errorField === field;
}

export function WordCountMatrixForm({
  initialRows,
  showDefaultSaveButton = true,
  onDirtyChange,
}: WordCountMatrixFormProps) {
  const [editedRows, setEditedRows] = useState<MatrixRowState[] | null>(null);
  const [state, formAction, pending] = useActionState(
    saveWordCountMatrixAction,
    initialActionState
  );
  const errorId = useId();
  const successId = useId();
  const isDirty = editedRows !== null;
  const rows = editedRows ?? mapInitialRows(initialRows);

  if (state.success && editedRows !== null) {
    setEditedRows(null);
  }

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function updateRow(
    clientId: string,
    field: keyof MatrixRowState,
    value: string
  ) {
    setEditedRows((currentRows) => {
      const baseRows = currentRows ?? mapInitialRows(initialRows);

      return baseRows.map((row) =>
        row.clientId === clientId ? { ...row, [field]: value } : row
      );
    });
  }

  function removeRow(clientId: string) {
    setEditedRows((currentRows) => {
      const baseRows = currentRows ?? mapInitialRows(initialRows);

      return baseRows.filter((row) => row.clientId !== clientId);
    });
  }

  function addRow() {
    setEditedRows((currentRows) => {
      const baseRows = currentRows ?? mapInitialRows(initialRows);

      return [...baseRows, createEmptyRow(baseRows)];
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset disabled={pending} className="flex flex-col gap-4 border-0 p-0 m-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune dictée configurée. Ajoutez une ligne pour définir les totaux de
            mots par niveau.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Dictée</th>
                  {CHAMPIONS_LEVELS.map((level) => (
                    <th key={level} className="px-3 py-2 text-left font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <LevelBadge level={level} className="px-1.5 py-0" />
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, index) => (
                  <tr key={row.clientId}>
                    <td className="px-3 py-2 align-top">
                      <label className="sr-only" htmlFor={`label-${row.clientId}`}>
                        Label dictée {index + 1}
                      </label>
                      <input
                        id={`label-${row.clientId}`}
                        name={`rows[${index}].label`}
                        type="text"
                        value={row.label}
                        maxLength={DICTATION_LABEL_MAX_LENGTH}
                        onChange={(event) =>
                          updateRow(row.clientId, "label", event.target.value)
                        }
                        aria-describedby={state.error ? errorId : undefined}
                        aria-invalid={
                          isFieldInvalid(state, index, "label") ? true : undefined
                        }
                        className="w-full min-w-[10rem] rounded-md border border-border bg-background px-2 py-1.5"
                      />
                    </td>
                    {LEVEL_COLUMNS.map(({ level, field, formName }) => (
                      <td key={level} className="px-3 py-2 align-top">
                        <label
                          className="sr-only"
                          htmlFor={`${field}-${row.clientId}`}
                        >
                          {getChampionsLevelFrenchLabel(level)} dictée {index + 1}
                        </label>
                        <input
                          id={`${field}-${row.clientId}`}
                          name={`rows[${index}].${formName}`}
                          type="number"
                          min={1}
                          step={1}
                          value={row[field]}
                          onChange={(event) =>
                            updateRow(row.clientId, field, event.target.value)
                          }
                          aria-describedby={state.error ? errorId : undefined}
                          aria-invalid={
                            isFieldInvalid(state, index, field) ? true : undefined
                          }
                          className="w-full min-w-[4.5rem] rounded-md border border-border bg-background px-2 py-1.5"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => removeRow(row.clientId)}
                        aria-label={`Supprimer la dictée ${index + 1}`}
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {state.error ? (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p id={successId} className="text-sm text-primary" role="status">
            {state.success}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
          >
            Ajouter une dictée
          </Button>
          {showDefaultSaveButton ? (
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer la matrice"}
            </Button>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}
