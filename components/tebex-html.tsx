import DOMPurify from "isomorphic-dompurify";

/**
 * Renders a Tebex-authored rich-text field (`Webstore.description`,
 * `Package.description`, `Category.description`) as HTML rather than
 * escaped text — confirmed against a live store that these fields are HTML
 * from the dashboard's rich text editor (e.g. `"<p>...</p>"`), not plain
 * strings, despite the generated schema typing them as plain `string`.
 * Sanitized with DOMPurify rather than trusted outright: this content comes
 * from the store owner's own Tebex account, not a visitor, but an account
 * compromise or an unexpected change on Tebex's side is still a real enough
 * risk that unsafe HTML shouldn't be injected on their behalf without a
 * check.
 *
 * No `max-w-*` in the base classes, unlike every other spacing/sizing
 * concern this component doesn't own — `@tailwindcss/typography`'s own
 * `.prose` sets a ~65ch reading-width max-width, and a caller-supplied
 * `max-w-*` utility in `className` needs to be the only one present to
 * reliably override it (two same-layer utility classes targeting the same
 * property have no reliable winner). Callers that want the full available
 * width (`PackageDetail`, `CategoryDetail`) pass `max-w-none` themselves;
 * `Hero` deliberately doesn't, keeping prose's own narrower default.
 */
export function TebexHtml({
  html,
  size = "sm",
  className,
}: {
  html: string;
  /**
   * Which `@tailwindcss/typography` size variant to use — kept as a prop
   * rather than left to the caller's `className` for the same reason
   * `max-w-*` is excluded from the base classes: stacking two prose size
   * modifiers (e.g. a caller adding `prose-lg` alongside this component's
   * own `prose-sm`) is explicitly unsupported by the plugin. "sm" matches
   * this app's default body text size (`PackageDetail`/`CategoryDetail`);
   * "lg" is for more prominent copy (`Hero`'s tagline).
   */
  size?: "sm" | "lg";
  className?: string;
}) {
  const sizeClass = size === "lg" ? "prose-lg" : "prose-sm";

  return (
    <article
      className={`prose ${sizeClass} ${className ?? ""}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify immediately above, not raw input
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
