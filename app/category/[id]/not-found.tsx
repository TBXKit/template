import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold text-foreground">
        Category not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This category does not exist.
      </p>
      <Link
        href="/"
        className="focus-ring mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
      >
        Back to store
      </Link>
    </div>
  );
}
