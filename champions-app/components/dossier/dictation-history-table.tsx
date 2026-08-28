"use client";

import { CategoryErrorCounts } from "@/components/dossier/category-error-counts";
import { LevelBadge } from "@/components/ui/level-badge";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import { formatDictationDateForDisplay } from "@/lib/domain/dictation";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

type DictationHistoryTableProps = {
  entries: StudentDictationHistoryEntry[];
};

export function DictationHistoryTable({ entries }: DictationHistoryTableProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      className="divide-y divide-border rounded-lg border border-border"
      data-testid="dictation-history-table"
    >
      {entries.map((entry) => (
        <details
          key={entry.entryId}
          className="group px-4 py-3 [&_summary]:focus-visible:outline-none [&_summary]:focus-visible:ring-2 [&_summary]:focus-visible:ring-ring [&_summary]:focus-visible:ring-offset-2"
        >
          <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{entry.label}</span>
              <span className="text-sm text-muted-foreground">
                {formatDictationDateForDisplay(entry.dictationDate)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isChampionsLevel(entry.levelAtSave) ? (
                <LevelBadge level={entry.levelAtSave} />
              ) : null}
              <span className="text-sm font-medium tabular-nums">
                {entry.globalPercent} %
              </span>
            </div>
          </summary>
          <div className="mt-3 border-t border-border pt-3">
            <CategoryErrorCounts counts={entry.categoryErrors} />
          </div>
        </details>
      ))}
    </div>
  );
}
