import { LevelBadge } from "@/components/ui/level-badge";
import {
  CLASS_CALENDAR_TIMEZONE,
  formatDictationDateForDisplay,
} from "@/lib/domain/dictation";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import type { StudentLevelHistoryEntry } from "@/lib/services/get-student-level-history";

type LevelHistoryListProps = {
  entries: StudentLevelHistoryEntry[];
};

const ACTION_LABELS: Record<string, string> = {
  assigned: "Assigné",
  promoted: "Promu",
  refused: "Refusé",
  manual: "Modification manuelle",
};

function formatLevelHistoryDate(occurredAt: Date): string {
  const calendarDate = occurredAt.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: CLASS_CALENDAR_TIMEZONE,
  });

  return formatDictationDateForDisplay(calendarDate);
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function LevelHistoryList({ entries }: LevelHistoryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Aucun changement de niveau.
      </p>
    );
  }

  return (
    <div
      className="divide-y divide-border rounded-lg border border-border"
      data-testid="level-history-list"
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-sm text-muted-foreground">
            {formatLevelHistoryDate(entry.occurredAt)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {isChampionsLevel(entry.level) ? (
              <LevelBadge level={entry.level} showDot />
            ) : null}
            <span className="text-sm font-medium">
              {getActionLabel(entry.action)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
