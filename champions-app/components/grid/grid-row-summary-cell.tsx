"use client";

import { useEffect, useId, useState } from "react";

import { calculateGlobalPercent } from "@/lib/domain/scoring";
import { cn } from "@/lib/utils";

type GridRowSummaryCellProps = {
  sumErrors: number;
  wordTotal: number;
  isReadOnlyRow: boolean;
};

type SummaryMetricTooltipProps = {
  value: number;
  tooltipText: string;
  tooltipAlign?: "center" | "end";
};

export function formatGridRowSummaryAriaLabel(
  globalPercent: number,
  sumErrors: number,
  wordTotal: number
): string {
  return `Bilan : ${globalPercent} % de réussite, ${sumErrors} fautes sur ${wordTotal} mots`;
}

export function formatGridRowSummaryErrorsTooltip(): string {
  return "Nombre total de fautes";
}

export function formatGridRowSummaryWordsTooltip(): string {
  return "Mots de la dictée (niveau élève)";
}

function SummaryMetricTooltip({
  value,
  tooltipText,
  tooltipAlign = "center",
}: SummaryMetricTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <span
      className="group relative inline-flex cursor-pointer"
      aria-label={tooltipText}
      aria-expanded={open}
      aria-controls={tooltipId}
      onClick={() => setOpen((current) => !current)}
    >
      <span className="tabular-nums">{value}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "absolute bottom-full z-20 mb-1 max-w-[9.5rem] rounded-md border border-border bg-popover px-2 py-1 text-center text-xs font-normal text-popover-foreground shadow-md transition-opacity whitespace-normal",
          tooltipAlign === "end" ? "right-0" : "left-1/2 -translate-x-1/2",
          open
            ? "opacity-100"
            : "pointer-events-none opacity-0 group-hover:opacity-100"
        )}
      >
        <span className="font-medium">{tooltipText}</span>
      </span>
    </span>
  );
}

export function GridRowSummaryCell({
  sumErrors,
  wordTotal,
  isReadOnlyRow,
}: GridRowSummaryCellProps) {
  if (isReadOnlyRow) {
    return (
      <td
        className="border-l border-border px-3 py-2"
        data-testid="grid-row-summary-empty"
      />
    );
  }

  const globalPercent = calculateGlobalPercent(wordTotal, sumErrors);
  const errorsTooltip = formatGridRowSummaryErrorsTooltip();
  const wordsTooltip = formatGridRowSummaryWordsTooltip();

  return (
    <td
      className="border-l border-border bg-muted/30 px-3 py-2 text-center align-middle"
      data-testid="grid-row-summary"
      aria-live="polite"
      aria-label={formatGridRowSummaryAriaLabel(
        globalPercent,
        sumErrors,
        wordTotal
      )}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-lg font-semibold tabular-nums">
          {globalPercent} %
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <SummaryMetricTooltip value={sumErrors} tooltipText={errorsTooltip} />
          <span aria-hidden="true">/</span>
          <SummaryMetricTooltip
            value={wordTotal}
            tooltipText={wordsTooltip}
            tooltipAlign="end"
          />
        </span>
      </div>
    </td>
  );
}
