export type ActivityDateTimeInput = {
  started_at?: string | null;
  created_at?: string | null;
  name?: string | null;
  source_filename?: string | null;
};

export type ResolvedActivityDateTime = {
  at: Date;
  hasTime: boolean;
};

function parseIsoDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const parseDateFromText = (text: string): ResolvedActivityDateTime | null => {
  const candidates = [text, text.replace(/\.[^.]+$/, "")];

  for (const candidate of candidates) {
    let match = candidate.match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s*(?:—|-)?/,
    );
    if (match) {
      return {
        at: new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +(match[6] || 0)),
        hasTime: true,
      };
    }

    match = candidate.match(/(\d{4})-(\d{2})-(\d{2})[T_\s](\d{2})[:-]?(\d{2})(?:[:-]?(\d{2}))?/);
    if (match) {
      return {
        at: new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +(match[6] || 0)),
        hasTime: true,
      };
    }

    match = candidate.match(/(\d{4})(\d{2})(\d{2})[_\-\s]?(\d{2})(\d{2})(\d{2})?/);
    if (match) {
      return {
        at: new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +(match[6] || 0)),
        hasTime: true,
      };
    }

    match = candidate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        at: new Date(+match[1], +match[2] - 1, +match[3]),
        hasTime: false,
      };
    }
  }

  return null;
};

export const resolveActivityDateTime = (
  input: ActivityDateTimeInput,
): ResolvedActivityDateTime | null => {
  if (input.started_at) {
    const at = parseIsoDate(input.started_at);
    if (at) return { at, hasTime: true };
  }

  if (input.name) {
    const parsed = parseDateFromText(input.name);
    if (parsed) return parsed;
  }

  if (input.source_filename) {
    const parsed = parseDateFromText(input.source_filename);
    if (parsed) return parsed;
  }

  if (input.created_at) {
    const at = parseIsoDate(input.created_at);
    if (at) return { at, hasTime: true };
  }

  return null;
};

export const formatActivityDate = (at: Date): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (at.getFullYear() !== now.getFullYear()) options.year = "numeric";
  return at.toLocaleDateString(undefined, options);
};

export const formatActivityTime = (at: Date, hasTime: boolean): string => {
  if (!hasTime) return "—";
  return at.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const activitySortTime = (input: ActivityDateTimeInput): number =>
  resolveActivityDateTime(input)?.at.getTime() ?? 0;