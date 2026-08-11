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
      {/*
        hud-frame is applied to this inner wrapper, not the full-bleed
        <section> — framing the section itself would put the corner
        brackets at the viewport edges on wide screens, which reads as
        stray marks rather than a deliberate frame around the pitch.
      */}
      <div className="hud-frame mx-auto max-w-2xl px-8 py-10">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
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
      </div>
    </section>
  );
}
