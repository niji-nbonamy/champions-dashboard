"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  importRosterCsvAction,
  type ImportRosterCsvActionState,
} from "./actions";

const initialState: ImportRosterCsvActionState = {
  error: null,
  success: null,
};

export function CsvImportForm() {
  const [state, formAction, pending] = useActionState(
    importRosterCsvAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="csv_file" className="text-sm font-medium">
          Fichier CSV
        </label>
        <p
          id="csv_file_help"
          className="text-sm text-muted-foreground"
        >
          Une colonne avec l&apos;en-tête « NOM + prénom », encodage UTF-8.
        </p>
        <input
          id="csv_file"
          name="csv_file"
          type="file"
          accept=".csv,text/csv"
          required
          aria-describedby="csv_file_help"
          className="text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Import…" : "Importer CSV"}
      </Button>
    </form>
  );
}
