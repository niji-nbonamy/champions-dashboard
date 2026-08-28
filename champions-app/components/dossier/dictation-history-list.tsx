import { LevelBadge } from "@/components/ui/level-badge";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import { formatDictationDateForDisplay } from "@/lib/domain/dictation";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

type DictationHistoryListProps = {
  entries: StudentDictationHistoryEntry[];
};

export function DictationHistoryList({ entries }: DictationHistoryListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {entries.map((entry) => (
        <li
          key={entry.entryId}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
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
        </li>
      ))}
    </ul>
  );
}
