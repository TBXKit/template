export function Footer({ siteName }: { siteName: string }) {
  return (
    <footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl">
        © {new Date().getFullYear()} {siteName}
      </div>
    </footer>
  );
}
