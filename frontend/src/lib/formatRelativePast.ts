const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const formatRelativePast = (iso: string, now: Date = new Date()): string | null => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;

  const diffMs = Math.max(0, now.getTime() - then);
  if (diffMs < MINUTE_MS) return "just now";

  const minutes = Math.floor(diffMs / MINUTE_MS);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(diffMs / HOUR_MS);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diffMs / DAY_MS);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
};
