"use client";

import { useEffect, useRef, useState } from "react";

import {
  formatGridCellAriaLabel,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";
import { cn } from "@/lib/utils";

type MobileErrorFieldProps = {
  categoryLetter: ChampionsErrorCategoryLetter;
  categoryName: string;
  firstName: string;
  value: number;
  onChange: (letter: ChampionsErrorCategoryLetter, value: number) => void;
  hasValidationError?: boolean;
};

const LONG_PRESS_MS = 500;

function parseNonNegativeInteger(rawValue: string): number | null {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return 0;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  return Number.parseInt(trimmed, 10);
}

export function MobileErrorField({
  categoryLetter,
  categoryName,
  firstName,
  value,
  onChange,
  hasValidationError = false,
}: MobileErrorFieldProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const longPressTriggeredRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, []);

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleTap() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    if (showManualInput) {
      return;
    }

    const nextValue = value > 3 ? 1 : value >= 3 ? 0 : value + 1;
    onChange(categoryLetter, nextValue);
  }

  function handlePointerDown() {
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowManualInput(true);
    }, LONG_PRESS_MS);
  }

  function handlePointerUp() {
    clearLongPressTimer();
  }

  function handleManualChange(event: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseNonNegativeInteger(event.target.value);

    if (parsed === null) {
      return;
    }

    onChange(categoryLetter, parsed);
  }

  function handleManualBlur() {
    setShowManualInput(false);
  }

  const ariaLabel = formatGridCellAriaLabel(firstName, categoryName, value);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {categoryLetter} — {categoryName}
        </span>
        {!showManualInput ? (
          <button
            type="button"
            className={cn(
              "flex min-h-12 min-w-16 items-center justify-center rounded-lg border border-border bg-background text-2xl font-semibold tabular-nums",
              hasValidationError && "border-destructive"
            )}
            aria-label={ariaLabel}
            onClick={handleTap}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {value}
          </button>
        ) : (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            className={cn(
              "min-h-12 w-1/2 shrink-0 rounded-lg border border-border bg-background px-3 text-center text-2xl font-semibold tabular-nums",
              hasValidationError && "border-destructive"
            )}
            aria-label={`${ariaLabel}, saisie manuelle`}
            value={String(value)}
            onChange={handleManualChange}
            onBlur={handleManualBlur}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {!showManualInput ? (
          <p className="text-xs text-muted-foreground">
            Appuyer pour 0–3 · maintenir pour saisir un nombre
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Saisir un nombre</p>
        )}
        {!showManualInput ? (
          <button
            type="button"
            className="min-h-11 min-w-11 text-xs font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => setShowManualInput(true)}
          >
            Saisir un nombre
          </button>
        ) : null}
      </div>
    </div>
  );
}
