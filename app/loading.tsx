export default function HomeLoading() {
  return (
    <>
      <section className="border-b border-border bg-muted px-6 py-section text-center">
        <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-card sm:h-12" />
      </section>
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        {/* Value proposition */}
        <div className="flex flex-col gap-4">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 w-full max-w-xl animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Category showcase */}
        <div className="flex flex-col gap-6">
          <div className="h-8 w-52 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
                key={i}
                className="aspect-square animate-pulse rounded-lg border border-border bg-card"
              />
            ))}
          </div>
        </div>

        {/* Closing CTA */}
        <div className="h-40 w-full animate-pulse rounded-lg border border-dashed border-border bg-card" />
      </div>
    </>
  );
}
