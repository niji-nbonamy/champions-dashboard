export function DossierSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-4xl"
      data-testid="dossier-skeleton"
      aria-busy="true"
      aria-label="Chargement du dossier"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
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
