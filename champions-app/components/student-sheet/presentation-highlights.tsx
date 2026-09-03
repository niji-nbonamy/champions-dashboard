import { LevelBadge } from "@/components/ui/level-badge";
import {
  formatPresentationTrendLabel,
  getLastDictationPercent,
  getPresentationTrendClassName,
  getPresentationTrendDelta,
} from "@/lib/domain/student-sheet-presentation";
import type { ChampionsLevel } from "@/lib/design/tokens";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";
import { cn } from "@/lib/utils";

type PresentationHighlightsProps = {
  history: StudentDictationHistoryEntry[];
  level: ChampionsLevel | null;
};

const highlightValueClassName = "text-data-lg";

export function PresentationHighlights({
  history,
  level,
}: PresentationHighlightsProps) {
  const lastPercent = getLastDictationPercent(history);
  const delta = getPresentationTrendDelta(history);
  const lastPercentLabel = lastPercent === null ? "—" : `${lastPercent} %`;
  const trendLabel = formatPresentationTrendLabel(delta);
  const trendClass = getPresentationTrendClassName(delta);
  const trendIsNumeric = delta !== null && delta !== 0;

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      data-testid="presentation-highlights"
    >
      <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
        <span className="text-sm text-muted-foreground">Dernière dictée</span>
        <p className={cn(highlightValueClassName, "tabular-nums")}>
          {lastPercentLabel}
        </p>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
        <span className="text-sm text-muted-foreground">Tendance</span>
        <p className={cn(highlightValueClassName, trendIsNumeric && "tabular-nums")}>
          <span className={trendClass}>{trendLabel}</span>
        </p>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
        <span className="text-sm text-muted-foreground">Niveau actuel</span>
        {level ? (
          <div className="pt-1">
            <LevelBadge
              level={level}
              showDot
              className={cn(
                highlightValueClassName,
                "h-auto rounded-md px-3 py-1.5"
              )}
            />
          </div>
        ) : (
          <p className={highlightValueClassName}>—</p>
        )}
      </div>
    </div>
  );
}
