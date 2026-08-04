export function Footer({ siteName }: { siteName: string }) {
  return (
    <footer className="border-t border-black/10 px-6 py-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-500">
      <div className="mx-auto max-w-6xl">
        © {new Date().getFullYear()} {siteName}
      </div>
    </footer>
  );
}
