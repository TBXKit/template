export default function HomeLoading() {
  return (
    <>
      <section className="border-b border-border bg-muted px-6 py-section text-center">
        <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-card sm:h-12" />
      </section>
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Mirrors app/page.tsx's own HOMEPAGE_MODE check, so the skeleton
            shape matches whichever branch the page itself is about to take. */}
        {process.env.HOMEPAGE_MODE !== "storefront" ? (
          <div className="flex flex-col gap-12">
            <div className="h-40 w-full animate-pulse rounded-lg border border-dashed border-border bg-card" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
                key={i}
                className="flex flex-col gap-4"
              >
                <div className="h-5 w-40 animate-pulse rounded-lg bg-muted" />
                <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
                key={i}
                className="flex flex-col gap-6"
              >
                <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
                      key={j}
                      className="aspect-square animate-pulse rounded-lg border border-border bg-card"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
