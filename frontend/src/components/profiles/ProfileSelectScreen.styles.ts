import { cn } from "../../lib/cn";

export const profileSelectStyles = {
  root: "flex h-full min-h-0 items-center justify-center bg-surface p-6",
  card: (embedded = false) =>
    cn(
      "w-full",
      !embedded && "max-w-md p-6",
    ),
  brand: "mb-6",
  title: "text-lg font-semibold text-foreground",
  subtitle: "mt-2 text-sm text-muted",
  scopeCheck: "mt-3",
  body: "mt-3",
  list: "flex flex-col gap-2",
  profileButton:
    "w-full rounded-md border border-border bg-surface px-4 py-3 text-left text-sm font-medium transition hover:border-accent hover:bg-accent/5",
  createRow: "flex items-center gap-2",
} as const;
