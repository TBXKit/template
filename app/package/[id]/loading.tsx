export default function PackageLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
        <div>
          <div className="h-9 w-3/4 animate-pulse rounded-lg bg-muted" />
          <div className="mt-4 h-6 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="mt-6 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
