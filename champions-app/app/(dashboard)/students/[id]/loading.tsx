import { StudentSheetSkeleton } from "@/components/student-sheet/student-sheet-skeleton";

export default function StudentSheetLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
      <StudentSheetSkeleton />
    </main>
  );
}
