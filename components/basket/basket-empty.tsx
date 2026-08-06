import Link from "next/link";

export function BasketEmpty() {
  return (
    <div className="flex flex-col items-center px-6 py-24 text-center">
      <h2 className="text-xl font-semibold text-foreground">
        Your basket is empty
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Browse the store to find something to add.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
      >
        Back to store
      </Link>
    </div>
  );
}
