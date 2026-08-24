const PLACEHOLDER_COUNT = 6;

export function TeamGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card"
          aria-hidden
        >
          <div className="flex items-start gap-3 bg-input px-4 py-4">
            <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-40 animate-pulse rounded bg-muted/70" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 px-4 py-4">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted/70" />
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted/70" />
            <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="border-t border-border/50 px-4 py-3">
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando equipe…</span>
    </div>
  );
}
