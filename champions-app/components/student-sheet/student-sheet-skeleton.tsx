import {
  STUDENT_SHEET_CONTENT_CONTAINER_CLASS,
  STUDENT_SHEET_CURVE_TABLE_LAYOUT_CLASS,
} from "@/components/student-sheet/student-sheet-layout";

export function StudentSheetSkeleton() {
  return (
    <div
      className={STUDENT_SHEET_CONTENT_CONTAINER_CLASS}
      data-testid="student-sheet-skeleton"
      aria-busy="true"
      aria-label="Chargement de la fiche"
    >
      <div className={STUDENT_SHEET_CURVE_TABLE_LAYOUT_CLASS}>
        <div className="flex flex-col gap-3">
          <div className="h-6 w-56 animate-pulse rounded bg-muted" />
          <div className="h-56 animate-pulse rounded-lg bg-muted lg:h-64" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
