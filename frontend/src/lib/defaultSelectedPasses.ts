import type { SegmentPass } from "../types";

/**
 * Filtering policy for default matched-pass include set when the URL has no
 * explicit `passes` list. Extend with favorites / time-spaced later.
 */
export type PassSelectionPolicy =
  | { id: "all" }
  | {
      id: "recentAndFastest";
      /** How many fastest (by duration_sec) to include. */
      fastestCount: number;
      /** How many most recent to include. */
      latestCount: number;
    };

export const DEFAULT_PASS_SELECTION_POLICY: PassSelectionPolicy = {
  id: "recentAndFastest",
  fastestCount: 3,
  latestCount: 2,
};

const parseTimestampMs = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
};

const passTimestampMs = (pass: SegmentPass): number | null =>
  parseTimestampMs(pass.started_at) ?? parseTimestampMs(pass.created_at);

const takeFastestIds = (
  matched: ReadonlyArray<SegmentPass>,
  count: number,
): ReadonlyArray<number> => {
  if (count <= 0) return [];
  return [...matched]
    .filter((pass) => pass.duration_sec != null && Number.isFinite(pass.duration_sec))
    .sort((a, b) => (a.duration_sec as number) - (b.duration_sec as number))
    .slice(0, count)
    .map((pass) => pass.id);
};

const compareByRecencyDesc = (a: SegmentPass, b: SegmentPass): number => {
  const aMs = passTimestampMs(a);
  const bMs = passTimestampMs(b);
  if (aMs == null && bMs == null) return 0;
  if (aMs == null) return 1;
  if (bMs == null) return -1;
  return bMs - aMs;
};

/** Most recent pass ids, skipping any already chosen (so slots do not collapse on overlap). */
const takeLatestIds = (
  matched: ReadonlyArray<SegmentPass>,
  count: number,
  excludeIds: ReadonlySet<number> = new Set(),
): ReadonlyArray<number> => {
  if (count <= 0) return [];
  return [...matched]
    .filter((pass) => !excludeIds.has(pass.id))
    .sort(compareByRecencyDesc)
    .slice(0, count)
    .map((pass) => pass.id);
};

/** Default included pass ids for a matched-pass list under a selection policy. */
export const defaultSelectedPassIds = (
  passes: ReadonlyArray<SegmentPass>,
  policy: PassSelectionPolicy = DEFAULT_PASS_SELECTION_POLICY,
): ReadonlyArray<number> => {
  const matched = passes.filter((pass) => pass.matched);
  if (!matched.length) return [];

  if (policy.id === "all") {
    return matched.map((pass) => pass.id);
  }

  // At or below the policy budget there is nothing useful to filter.
  const maxSelected = policy.fastestCount + policy.latestCount;
  if (matched.length <= maxSelected) {
    return matched.map((pass) => pass.id);
  }

  const fastestIds = takeFastestIds(matched, policy.fastestCount);
  const latestIds = takeLatestIds(matched, policy.latestCount, new Set(fastestIds));
  const selected = new Set([...fastestIds, ...latestIds]);

  if (!selected.size) {
    const fallbackCount = Math.min(matched.length, Math.max(1, policy.latestCount));
    return matched.slice(0, fallbackCount).map((pass) => pass.id);
  }

  return matched.filter((pass) => selected.has(pass.id)).map((pass) => pass.id);
};
