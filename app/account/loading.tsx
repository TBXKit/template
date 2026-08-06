export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 space-y-px overflow-hidden rounded-lg border border-border">
        <div className="h-12 animate-pulse bg-card" />
        <div className="h-12 animate-pulse bg-card" />
      </div>
      <div className="mt-6 h-10 w-24 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
