import { haversineM } from "./lib/geo/haversine";

export { haversineM };

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDistance(meters?: number | null): string {
  if (meters == null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function formatSpeed(kmh?: number | null): string {
  if (kmh == null) return "—";
  return `${kmh.toFixed(2)} km/h`;
}

export function formatHr(hr?: number | null): string {
  if (hr == null) return "—";
  return `${Math.round(hr)} bpm`;
}

export function formatPaceFromSpeed(kmh?: number | null): string {
  if (kmh == null || kmh <= 0) return "—";
  const minPerKm = 60 / kmh;
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
}

const distSq = (point: { lat: number; lon: number }, lat: number, lon: number): number =>
  (point.lat - lat) ** 2 + (point.lon - lon) ** 2;

export function nearestTrackPointIndex<T extends { lat: number; lon: number }>(
  points: T[],
  lat: number,
  lon: number,
): number {
  if (!points.length) return -1;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = distSq(points[i], lat, lon);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function nearestTrackPointIndexAfter<T extends { lat: number; lon: number }>(
  points: T[],
  afterIndex: number,
  lat: number,
  lon: number,
): number {
  if (afterIndex >= points.length - 1) return -1;
  let bestIdx = -1;
  let bestDist = Infinity;
  for (let i = afterIndex + 1; i < points.length; i++) {
    const dist = distSq(points[i], lat, lon);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** ~20 m of slack in deg² so out-and-back may use a slightly farther visit. */
const ENDPOINT_SNAP_SLACK = 0.0002 ** 2;

type LatLon = { lat: number; lon: number };

const nearestDistSq = <T extends LatLon>(points: T[], target: LatLon): number => {
  let best = Infinity;
  for (const point of points) {
    const dist = distSq(point, target.lat, target.lon);
    if (dist < best) best = dist;
  }
  return best;
};

const earliestNearIndex = <T extends LatLon>(
  points: T[],
  target: LatLon,
  maxDistSq: number,
  fromIndex = 0,
): number => {
  for (let i = fromIndex; i < points.length; i++) {
    if (distSq(points[i], target.lat, target.lon) <= maxDistSq) return i;
  }
  return -1;
};

/**
 * Path-distance leave gate / minimum segment path length (m).
 * Segments and loops shorter than this path distance are not matched.
 */
export const MIN_LOOP_PATH_DISTANCE_M = 40;

/** Cumulative path length along the track: cum[i] = path meters from index 0 to i. */
const cumulativePathM = <T extends LatLon>(points: T[]): number[] => {
  const cum = new Array<number>(points.length);
  cum[0] = 0;
  for (let i = 1; i < points.length; i++) {
    cum[i] =
      cum[i - 1] +
      haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
  }
  return cum;
};

/**
 * Resolve two map clicks to track indices with activity order: start < end.
 * Minimizes distance-to-start + distance-to-end over ordered pairs whose path
 * length is at least MIN_LOOP_PATH_DISTANCE_M so two nearby clicks cannot
 * collapse to a ~10 m slice on the same visit.
 */
export function resolveOrderedTrackIndices<T extends LatLon>(
  points: T[],
  endpoints: {
    start: LatLon;
    end: LatLon;
  },
): { start_index: number; end_index: number } | null {
  if (points.length < 2) return null;

  const { start, end } = endpoints;
  const cum = cumulativePathM(points);
  const minPathM = MIN_LOOP_PATH_DISTANCE_M;

  let nearestStartDist = Infinity;
  let nearestEndDist = Infinity;
  for (const p of points) {
    const ds = distSq(p, start.lat, start.lon);
    const de = distSq(p, end.lat, end.lon);
    if (ds < nearestStartDist) nearestStartDist = ds;
    if (de < nearestEndDist) nearestEndDist = de;
  }

  // Sliding window: for each end j, best start among i with path(i→j) ≥ minPathM.
  let maxValidStart = -1;
  let bestStartIdx = -1;
  let bestStartDist = Infinity;
  let bestScore = Infinity;
  let start_index = -1;
  let end_index = -1;

  for (let j = 1; j < points.length; j++) {
    const pathLimit = cum[j] - minPathM;
    while (maxValidStart + 1 < j && cum[maxValidStart + 1] <= pathLimit) {
      maxValidStart += 1;
      const d = distSq(points[maxValidStart], start.lat, start.lon);
      if (d < bestStartDist) {
        bestStartDist = d;
        bestStartIdx = maxValidStart;
      }
    }

    if (bestStartIdx < 0) continue;

    const endDist = distSq(points[j], end.lat, end.lon);
    const score = bestStartDist + endDist;
    if (score < bestScore) {
      bestScore = score;
      start_index = bestStartIdx;
      end_index = j;
    }
  }

  if (start_index < 0 || end_index <= start_index) return null;
  if (cum[end_index] - cum[start_index] < minPathM) return null;

  // Start must still snap to the start click. End is best under min-path, so do
  // not compare it to the global nearest end (often a too-early visit).
  const startSnap = distSq(points[start_index], start.lat, start.lon);
  if (startSnap > nearestStartDist + ENDPOINT_SNAP_SLACK) return null;

  let nearestValidEndDist = Infinity;
  for (let j = 0; j < points.length; j++) {
    if (cum[j] - cum[start_index] < minPathM) continue;
    const de = distSq(points[j], end.lat, end.lon);
    if (de < nearestValidEndDist) nearestValidEndDist = de;
  }
  const endSnap = distSq(points[end_index], end.lat, end.lon);
  if (endSnap > nearestValidEndDist + ENDPOINT_SNAP_SLACK) return null;

  return { start_index, end_index };
}
/** Confirm a straight-line local minimum when this many following steps all rise. */
const MIN_RISE_STEPS = 3;
/** Default match radius when the caller does not pass one (segment default). */
const DEFAULT_MATCH_RADIUS_M = 30;

const distTo = (point: LatLon, target: LatLon): number =>
  haversineM(point.lat, point.lon, target.lat, target.lon);

/**
 * Advance from startIndex along the path until cumulative path length >= leaveM.
 * Returns the first index that is outside the path gate, or -1 if the track is too short.
 */
const indexAfterPathLeave = <T extends LatLon>(
  points: T[],
  startIndex: number,
  leavePathM: number,
): number => {
  let pathM = 0;
  for (let i = startIndex; i < points.length - 1; i++) {
    pathM += distTo(points[i], points[i + 1]);
    if (pathM >= leavePathM) return i + 1;
  }
  return -1;
};

/** True when the next `steps` points each increase straight-line distance to target. */
const nextStepsIncreaseDist = <T extends LatLon>(
  points: T[],
  index: number,
  target: LatLon,
  steps: number,
): boolean => {
  if (index + steps >= points.length) return false;
  for (let k = 1; k <= steps; k++) {
    const prev = distTo(points[index + k - 1], target);
    const next = distTo(points[index + k], target);
    if (next <= prev) return false;
  }
  return true;
};

/**
 * Walk left to the valley floor, then split the difference between closest and next:
 * project the finish onto the edge (closest → next) and pick the nearer vertex.
 */
const refineValleyEndIndex = <T extends LatLon>(
  points: T[],
  candidate: number,
  end: LatLon,
  minIndex: number,
): number => {
  let i = candidate;
  while (i > minIndex && distTo(points[i - 1], end) < distTo(points[i], end)) {
    i -= 1;
  }
  while (i + 1 < points.length && distTo(points[i + 1], end) < distTo(points[i], end)) {
    i += 1;
  }

  if (i + 1 >= points.length) return i;

  const a = points[i];
  const b = points[i + 1];
  const dx = b.lon - a.lon;
  const dy = b.lat - a.lat;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0) return i;

  // t in [0, 1]: closest point on edge a→b to the finish.
  let t = ((end.lon - a.lon) * dx + (end.lat - a.lat) * dy) / len2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  // Split the difference: nearer side of the midpoint on the edge.
  return t < 0.5 ? i : i + 1;
};

/**
 * Same-as-start loop end:
 * 1. Earliest visit near the start click.
 * 2. Path-leave until path-distance ≥ leave gate (~40 m) — skip the start band.
 * 3. Keep going until straight-line distance peaks (must get farther out than the leave band).
 * 4. On the way back, first local min (next 3 steps rise) within match radius, refined
 *    by walking to the valley floor and splitting closest vs next on the edge.
 */
const tryLoopFromStart = <T extends LatLon>(
  points: T[],
  startIndex: number,
  end: LatLon,
  matchRadiusM: number,
): { start_index: number; end_index: number } | null => {
  if (startIndex < 0 || startIndex >= points.length - 1) return null;

  const afterLeave = indexAfterPathLeave(points, startIndex, MIN_LOOP_PATH_DISTANCE_M);
  if (afterLeave < 0 || afterLeave <= startIndex) return null;

  // Away phase: find the first peak of straight-line distance after leave
  // (must exceed the leave band so we do not treat the leave stub as a loop).
  let peakIdx = afterLeave;
  let peakDist = distTo(points[afterLeave], end);
  let returnFrom = -1;

  for (let j = afterLeave + 1; j < points.length; j++) {
    const d = distTo(points[j], end);
    const dPrev = distTo(points[j - 1], end);
    if (d >= peakDist) {
      peakDist = d;
      peakIdx = j;
      continue;
    }
    // Started descending after a real excursion (not just the leave stub).
    // Peak must exceed 2× leave gate so a ~40 m wiggle is not treated as a lap.
    if (peakDist > MIN_LOOP_PATH_DISTANCE_M * 2 && d < dPrev) {
      returnFrom = peakIdx;
      break;
    }
  }

  if (returnFrom < 0) {
    // Never turned back after a real peak — activity may end far from start.
    return null;
  }

  // Return phase: first local min (next 3 steps rise), then refine valley floor.
  for (let j = returnFrom; j < points.length; j++) {
    if (!nextStepsIncreaseDist(points, j, end, MIN_RISE_STEPS)) continue;
    const refined = refineValleyEndIndex(points, j, end, returnFrom);
    if (distTo(points[refined], end) > matchRadiusM) continue;
    if (refined <= startIndex) continue;
    return { start_index: startIndex, end_index: refined };
  }

  // Finish is at the end of the track: closest point after the peak, refined.
  let bestIdx = returnFrom;
  let bestDist = distTo(points[returnFrom], end);
  for (let j = returnFrom + 1; j < points.length; j++) {
    const d = distTo(points[j], end);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = j;
    }
  }
  const refined = refineValleyEndIndex(points, bestIdx, end, returnFrom);
  if (refined > startIndex && distTo(points[refined], end) <= matchRadiusM) {
    return { start_index: startIndex, end_index: refined };
  }

  return null;
};

/**
 * Resolve a closed loop (track lap): path-leave, away peak, then local-min return
 * within match radius.
 */
export function resolveLoopTrackIndices<T extends LatLon>(
  points: T[],
  endpoints: {
    start: LatLon;
    end: LatLon;
    /** Segment match radius (m). Return must land within this of the finish. */
    match_radius_m?: number;
  },
): { start_index: number; end_index: number } | null {
  if (points.length < 3) return null;

  const { start, end } = endpoints;
  const matchRadiusM = endpoints.match_radius_m ?? DEFAULT_MATCH_RADIUS_M;
  const startGateSq = nearestDistSq(points, start) + ENDPOINT_SNAP_SLACK;
  const startIndex = earliestNearIndex(points, start, startGateSq);
  if (startIndex < 0) return null;
  return tryLoopFromStart(points, startIndex, end, matchRadiusM);
}

export function nearestTrackPoint<T extends { lat: number; lon: number }>(
  points: T[],
  lat: number,
  lon: number,
): T | null {
  const idx = nearestTrackPointIndex(points, lat, lon);
  return idx >= 0 ? points[idx] : null;
}

export function sliceDraftOnTrack<T extends { lat: number; lon: number }>(
  points: T[],
  draft: {
    start_lat: number;
    start_lon: number;
    end_lat: number;
    end_lon: number;
    start_index?: number;
    end_index?: number;
  },
): T[] | null {
  if (points.length < 2) return null;

  if (
    draft.start_index != null &&
    draft.end_index != null &&
    draft.end_index > draft.start_index
  ) {
    return points.slice(draft.start_index, draft.end_index + 1);
  }

  // No locked indices yet — do not invent a path from independent nearest snaps.
  return null;
}