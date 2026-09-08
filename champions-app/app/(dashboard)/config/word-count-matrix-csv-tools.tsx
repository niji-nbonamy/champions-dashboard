"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { WordCountMatrixRowInput } from "@/lib/domain/word-count-matrix";
import {
  formatWordCountMatrixCsvOverwriteMessage,
  serializeWordCountMatrixCsv,
  WORD_COUNT_MATRIX_CSV_EXPORT_EMPTY_MESSAGE,
  WORD_COUNT_MATRIX_CSV_EXPORT_FILENAME,
  WORD_COUNT_MATRIX_CSV_OVERWRITE_TITLE,
} from "@/lib/domain/word-count-matrix-csv";

import {
  importWordCountMatrixCsvAction,
  type ImportWordCountMatrixCsvActionState,
} from "./actions";

type WordCountMatrixCsvToolsProps = {
  savedRows: WordCountMatrixRowInput[];
};

const initialImportState: ImportWordCountMatrixCsvActionState = {
  error: null,
  success: null,
};

export function WordCountMatrixCsvTools({
  savedRows,
}: WordCountMatrixCsvToolsProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const overwriteConfirmedRef = useRef(false);
  const fileInputId = useId();
  const importErrorId = useId();
  const [state, formAction, pending] = useActionState(
    importWordCountMatrixCsvAction,
    initialImportState
  );
  const canExport = savedRows.length > 0;

  useEffect(() => {
    if (!pending) {
      overwriteConfirmedRef.current = false;
    }
  }, [pending]);

  function handleExportClick() {
    if (!canExport) {
      return;
    }

    const content = serializeWordCountMatrixCsv(savedRows);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = WORD_COUNT_MATRIX_CSV_EXPORT_FILENAME;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImportSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (savedRows.length > 0 && !overwriteConfirmedRef.current) {
      event.preventDefault();
      dialogRef.current?.showModal();
    }
  }

  function handleConfirmOverwrite() {
    overwriteConfirmedRef.current = true;
    dialogRef.current?.close();
    formRef.current?.requestSubmit();
  }

  function closeDialog() {
    if (pending) {
      return;
    }
    dialogRef.current?.close();
  }

  function handleDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (pending) {
      return;
    }

    if (event.target === dialogRef.current) {
      closeDialog();
    }
  }

  function handleDialogCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    if (pending) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleExportClick}
          disabled={!canExport}
        >
          Exporter CSV
        </Button>
        {!canExport ? (
          <p className="text-sm text-muted-foreground">
            {WORD_COUNT_MATRIX_CSV_EXPORT_EMPTY_MESSAGE}
          </p>
        ) : null}
      </div>

      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleImportSubmit}
        className="flex w-full flex-col gap-4"
      >
        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor={fileInputId} className="text-sm font-medium">
            Importer une matrice CSV
          </label>
          <p
            id={`${fileInputId}-help`}
            className="w-full text-sm text-muted-foreground"
          >
            Cinq colonnes par ligne, séparées par des point-virgules, sans en-tête : dictée, jaune, vert, violet, or. Encodage UTF-8.
          </p>
          <input
            id={fileInputId}
            name="csv_file"
            type="file"
            accept=".csv,text/csv"
            required
            aria-describedby={`${fileInputId}-help`}
            className="text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm"
          />
        </div>

        {state.error ? (
          <p
            id={importErrorId}
            className="text-sm text-destructive"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="text-sm text-primary" role="status">
            {state.success}
          </p>
        ) : null}

        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? "Import…" : "Importer CSV"}
        </Button>
      </form>

      <dialog
        ref={dialogRef}
        onClick={handleDialogClick}
        onCancel={handleDialogCancel}
        className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-0 shadow-lg backdrop:bg-black/50 open:flex"
      >
        <div className="flex w-full flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">
              {WORD_COUNT_MATRIX_CSV_OVERWRITE_TITLE}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatWordCountMatrixCsvOverwriteMessage(savedRows.length)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleConfirmOverwrite}
              disabled={pending}
            >
              {pending ? "Import…" : "Remplacer la matrice"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={pending}
            >
              Annuler
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
