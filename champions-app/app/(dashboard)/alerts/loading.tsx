export default function AlertsLoading() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </div>
    </main>
  );
}
