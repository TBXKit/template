export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
            key={i}
            className="aspect-square animate-pulse rounded-lg border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
