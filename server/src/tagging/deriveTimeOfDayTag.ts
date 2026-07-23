import { TIME_OF_DAY_TAGS } from "./tagConstants.js";

const estimateTimezoneOffsetHours = (lon: number): number =>
  Math.max(-12, Math.min(14, Math.round(lon / 15)));

export const deriveTimeOfDayTag = (startedAt: Date | null, startLon: number | null): string | null => {
  if (!startedAt) return null;

  const offsetHours = startLon == null ? 0 : estimateTimezoneOffsetHours(startLon);
  const localHour = (startedAt.getUTCHours() + offsetHours + 24) % 24;

  if (localHour >= 5 && localHour < 12) return "morning";
  if (localHour >= 12 && localHour < 17) return "afternoon";
  if (localHour >= 17 && localHour < 21) return "evening";
  return "night";
};

export const isTimeOfDayTag = (tag: string): boolean =>
  (TIME_OF_DAY_TAGS as readonly string[]).includes(tag);