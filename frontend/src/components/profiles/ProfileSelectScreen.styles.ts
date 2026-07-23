export const profileSelectStyles = {
  root: "flex h-full min-h-0 items-center justify-center bg-surface p-6",
  card: "w-full max-w-md rounded-lg border border-border bg-drop-surface p-6 shadow-sm",
  title: "text-xl font-semibold text-foreground",
  subtitle: "mt-2 text-sm text-muted",
  list: "flex flex-col gap-2",
  profileButton:
    "w-full rounded-md border border-border bg-surface px-4 py-3 text-left text-sm font-medium transition hover:border-accent hover:bg-accent/5",
  createRow: "flex items-center gap-2",
} as const;