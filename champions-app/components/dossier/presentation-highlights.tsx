import { LevelBadge } from "@/components/ui/level-badge";
import {
  getLastDictationPercent,
  getPresentationTrendDelta,
} from "@/lib/domain/dossier-presentation";
import type { ChampionsLevel } from "@/lib/design/tokens";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";
import { cn } from "@/lib/utils";

type PresentationHighlightsProps = {
  history: StudentDictationHistoryEntry[];
  level: ChampionsLevel | null;
};

export function PresentationHighlights({
  history,
  level,
}: PresentationHighlightsProps) {
  const lastPercent = getLastDictationPercent(history);
  const delta = getPresentationTrendDelta(history);
  const lastPercentLabel = lastPercent === null ? "—" : `${lastPercent} %`;
  const trendLabel =
    delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta} %`;
  const trendClass =
    delta === null
      ? ""
      : delta > 0
        ? "text-trend-up"
        : delta < 0
          ? "text-trend-down"
          : "text-trend-flat";

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      data-testid="presentation-highlights"
    >
      <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
        <span className="text-sm text-muted-foreground">Dernière dictée</span>
        <p className="text-data-lg tabular-nums">{lastPercentLabel}</p>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
        <span className="text-sm text-muted-foreground">Tendance</span>
        <p className={cn("text-data-lg tabular-nums", trendClass)}>{trendLabel}</p>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
        <span className="text-sm text-muted-foreground">Niveau actuel</span>
        {level ? (
          <div className="pt-1">
            <LevelBadge
              level={level}
              showDot
              className="h-auto rounded-md px-3 py-1.5 font-mono text-data-lg font-semibold"
            />
          </div>
        ) : (
          <p className="text-data-lg">—</p>
        )}
      </div>
    </div>
  );
}
