import type { SegmentPass } from "../types";
import { defaultSelectedPassIds } from "./defaultSelectedPasses";

/** Matched count at or below this uses the simple checkable list (no modes/popover). */
export const PASS_SIMPLE_PATH_MAX = 5;

/** Soft cap for Fastest / Latest select modes. */
export const PASS_SELECT_RANK_MAX = 5;

/** Soft cap for time-spaced select modes. */
export const PASS_SELECT_SPACED_MAX = 8;

const DAY_MS = 24 * 60 * 60 * 1000;

export const PASS_SPACED_2W_MS = 14 * DAY_MS;
export const PASS_SPACED_1MO_MS = 30 * DAY_MS;

export type PassSelectMode =
  | "default"
  | "fastest"
  | "latest"
  | "spaced2w"
  | "spaced1mo"
  | "all";

export type PassListSort = "latest" | "fastest" | "name";

export type PassSelectModeOptions = {
  maxCount?: number;
};

export const isSimplePassSelectionPath = (matchedCount: number): boolean =>
  matchedCount <= PASS_SIMPLE_PATH_MAX;

const parseTimestampMs = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
};

const passTimestampMs = (pass: SegmentPass): number | null =>
  parseTimestampMs(pass.started_at) ?? parseTimestampMs(pass.created_at);

const matchedOnly = (passes: ReadonlyArray<SegmentPass>): SegmentPass[] =>
  passes.filter((pass) => pass.matched);

export const filterPassesByQuery = (
  passes: ReadonlyArray<SegmentPass>,
  query: string,
): SegmentPass[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...passes];
  return passes.filter((pass) => {
    const name = pass.activity_name.toLowerCase();
    const filename = (pass.source_filename ?? "").toLowerCase();
    return name.includes(normalized) || filename.includes(normalized);
  });
};

const compareByRecencyDesc = (a: SegmentPass, b: SegmentPass): number => {
  const aMs = passTimestampMs(a);
  const bMs = passTimestampMs(b);
  if (aMs == null && bMs == null) return 0;
  if (aMs == null) return 1;
  if (bMs == null) return -1;
  return bMs - aMs;
};

const compareByDurationAsc = (a: SegmentPass, b: SegmentPass): number => {
  const aDur = a.duration_sec;
  const bDur = b.duration_sec;
  const aOk = aDur != null && Number.isFinite(aDur);
  const bOk = bDur != null && Number.isFinite(bDur);
  if (!aOk && !bOk) return 0;
  if (!aOk) return 1;
  if (!bOk) return -1;
  return (aDur as number) - (bDur as number);
};

const compareByNameAsc = (a: SegmentPass, b: SegmentPass): number =>
  a.activity_name.localeCompare(b.activity_name, undefined, { sensitivity: "base" });

export const sortPasses = (
  passes: ReadonlyArray<SegmentPass>,
  sort: PassListSort,
): SegmentPass[] => {
  const copy = [...passes];
  if (sort === "latest") return copy.sort(compareByRecencyDesc);
  if (sort === "fastest") return copy.sort(compareByDurationAsc);
  return copy.sort(compareByNameAsc);
};

export const selectTimeSpacedPassIds = (
  passes: ReadonlyArray<SegmentPass>,
  intervalMs: number,
  options: PassSelectModeOptions = {},
): ReadonlyArray<number> => {
  const maxCount = options.maxCount ?? PASS_SELECT_SPACED_MAX;
  if (maxCount <= 0) return [];

  const dated = matchedOnly(passes)
    .map((pass) => {
      const ms = passTimestampMs(pass);
      return ms == null ? null : { pass, ms };
    })
    .filter((entry): entry is { pass: SegmentPass; ms: number } => entry != null)
    .sort((a, b) => b.ms - a.ms);

  if (!dated.length) return [];

  const selected: number[] = [];
  let lastMs: number | null = null;

  for (const entry of dated) {
    if (selected.length >= maxCount) break;
    if (lastMs == null || lastMs - entry.ms >= intervalMs) {
      selected.push(entry.pass.id);
      lastMs = entry.ms;
    }
  }

  return selected;
};

const takeFastestIds = (
  matched: ReadonlyArray<SegmentPass>,
  maxCount: number,
): ReadonlyArray<number> => {
  if (maxCount <= 0) return [];
  return sortPasses(matched, "fastest")
    .filter((pass) => pass.duration_sec != null && Number.isFinite(pass.duration_sec))
    .slice(0, maxCount)
    .map((pass) => pass.id);
};

const takeLatestIds = (
  matched: ReadonlyArray<SegmentPass>,
  maxCount: number,
): ReadonlyArray<number> => {
  if (maxCount <= 0) return [];
  return sortPasses(matched, "latest").slice(0, maxCount).map((pass) => pass.id);
};

export const applyPassSelectMode = (
  passes: ReadonlyArray<SegmentPass>,
  mode: PassSelectMode,
  options: PassSelectModeOptions = {},
): ReadonlyArray<number> => {
  const matched = matchedOnly(passes);
  if (!matched.length) return [];

  if (mode === "all") {
    return matched.map((pass) => pass.id);
  }

  if (mode === "default") {
    return defaultSelectedPassIds(matched);
  }

  if (mode === "fastest") {
    const maxCount = options.maxCount ?? PASS_SELECT_RANK_MAX;
    return takeFastestIds(matched, maxCount);
  }

  if (mode === "latest") {
    const maxCount = options.maxCount ?? PASS_SELECT_RANK_MAX;
    return takeLatestIds(matched, maxCount);
  }

  if (mode === "spaced2w") {
    return selectTimeSpacedPassIds(matched, PASS_SPACED_2W_MS, {
      maxCount: options.maxCount ?? PASS_SELECT_SPACED_MAX,
    });
  }

  return selectTimeSpacedPassIds(matched, PASS_SPACED_1MO_MS, {
    maxCount: options.maxCount ?? PASS_SELECT_SPACED_MAX,
  });
};
