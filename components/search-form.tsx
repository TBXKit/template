/**
 * Submits a GET request to /search — plain HTML form navigation, no
 * client-side JavaScript required. Used by both the header (site-wide entry
 * point) and the search results page itself (to refine a query), which is
 * why it's a shared component rather than inlined in either.
 */
export function SearchForm({
  defaultValue = "",
  className = "",
}: {
  defaultValue?: string;
  className?: string;
}) {
  return (
    <search className={className}>
      <form action="/search">
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search packages…"
          aria-label="Search packages"
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        />
      </form>
    </search>
  );
}
