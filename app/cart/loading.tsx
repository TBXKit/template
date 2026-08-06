export default function CartLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
            key={i}
            className="h-20 animate-pulse rounded-lg border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
