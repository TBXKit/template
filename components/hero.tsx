export function Hero({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="border-b border-black/10 bg-zinc-50 px-6 py-24 text-center dark:border-white/10 dark:bg-zinc-950">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
        {title}
      </h1>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          {subtitle}
        </p>
      ) : null}
    </section>
  );
}
