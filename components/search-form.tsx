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
          // Investigated a hydration-mismatch warning on this input
          // (reported as `style={{caret-color:"transparent"}}` appearing
          // only on the client). Confirmed this isn't caused by this
          // component or by Next/React: no "caret-color" reference exists
          // anywhere in this codebase, a bare <input type="search"> in a
          // clean headless Chromium never gets this style, and 5 repeated
          // clean navigations to this app never reproduced it either — it
          // only ever appeared once, outside a clean test session. React's
          // own hydration-warning text names the actual cause: a browser
          // extension (password manager/autofill tooling commonly target
          // name="q" search fields) injecting an inline style before React
          // hydrates. That's outside this app's control, so the warning is
          // suppressed here rather than "fixed" — there's nothing in our
          // rendering to change.
          suppressHydrationWarning
        />
      </form>
    </search>
  );
}
