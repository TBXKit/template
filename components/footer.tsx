export function Footer({
  siteName,
  platformType,
}: {
  siteName: string;
  platformType?: string;
}) {
  return (
    <footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} {siteName}
        </span>
        {platformType ? <span>{platformType}</span> : null}
      </div>
    </footer>
  );
}
