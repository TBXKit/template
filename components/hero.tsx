import { TebexHtml } from "@/components/tebex-html";

export function Hero({
  title,
  description,
}: {
  title: string;
  /** `Webstore.description` — HTML from the Tebex dashboard, see `TebexHtml`. */
  description?: string;
}) {
  return (
    <section className="border-b border-border bg-muted px-6 py-section text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <TebexHtml
          html={description}
          size="lg"
          // [--tw-prose-body:...] overrides just this instance's paragraph
          // color to the muted token (matching the old plain-text
          // <p className="text-muted-foreground">) — a plain
          // `text-muted-foreground` class here wouldn't reach it, since
          // prose's own CSS sets paragraph color from --tw-prose-body
          // (globals.css points it at --foreground app-wide) rather than
          // inheriting the parent element's text color.
          className="mx-auto mt-4 max-w-xl [--tw-prose-body:var(--muted-foreground)]"
        />
      ) : null}
    </section>
  );
}
