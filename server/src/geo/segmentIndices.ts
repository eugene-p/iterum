import { BadRequestError } from "../middleware/errors.js";
import { haversineM } from "./haversine.js";

export type GeoPoint = { lat: number; lon: number };

type IndexedPoint = GeoPoint;

export type SegmentEndpoints = {
  start: GeoPoint;
  end: GeoPoint;
  /** Segment match radius (m) for same-point loop return acceptance. */
  match_radius_m?: number;
};

const distSq = (point: IndexedPoint, lat: number, lon: number): number =>
  (point.lat - lat) ** 2 + (point.lon - lon) ** 2;

/** ~20 m of slack in deg² so out-and-back may use a slightly farther visit. */
const ENDPOINT_SNAP_SLACK = 0.0002 ** 2;

/** Endpoints closer than this are treated as a closed loop (same finish line). */
const SAME_POINT_DIST_SQ = 0.00015 ** 2;

/**
 * Path-distance leave gate (m).
 * Loops shorter than this path length are not matched.
 */
export const MIN_LOOP_PATH_DISTANCE_M = 40;
/** Confirm a straight-line local min when this many following steps all rise. */
const MIN_RISE_STEPS = 3;
const DEFAULT_MATCH_RADIUS_M = 30;

export const nearestPointIndex = (points: IndexedPoint[], lat: number, lon: number): number => {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = distSq(points[i], lat, lon);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
};

export const nearestPointIndexAfter = (
  points: IndexedPoint[],
  afterIndex: number,
  lat: number,
  lon: number,
): number | null => {
  if (afterIndex >= points.length - 1) return null;
  let best = -1;
  let bestDist = Infinity;
  for (let i = afterIndex + 1; i < points.length; i++) {
    const dist = distSq(points[i], lat, lon);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best >= 0 ? best : null;
};

const nearestDistSq = (points: IndexedPoint[], target: GeoPoint): number => {
  let best = Infinity;
  for (const point of points) {
    const dist = distSq(point, target.lat, target.lon);
    if (dist < best) best = dist;
  }
  return best;
};

const earliestNearIndex = (
  points: IndexedPoint[],
  target: GeoPoint,
  maxDistSq: number,
): number => {
  for (let i = 0; i < points.length; i++) {
    if (distSq(points[i], target.lat, target.lon) <= maxDistSq) return i;
  }
  return -1;
};

const distTo = (point: GeoPoint, target: GeoPoint): number =>
  haversineM(point.lat, point.lon, target.lat, target.lon);

const indexAfterPathLeave = (
  points: IndexedPoint[],
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

const nextStepsIncreaseDist = (
  points: IndexedPoint[],
  index: number,
  target: GeoPoint,
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
 * project the finish onto the edge and pick the nearer vertex.
 */
const refineValleyEndIndex = (
  points: IndexedPoint[],
  candidate: number,
  end: GeoPoint,
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

  let t = ((end.lon - a.lon) * dx + (end.lat - a.lat) * dy) / len2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  return t < 0.5 ? i : i + 1;
};

const tryLoopFromStart = (
  points: IndexedPoint[],
  startIndex: number,
  end: GeoPoint,
  matchRadiusM: number,
): { start_index: number; end_index: number } | null => {
  if (startIndex < 0 || startIndex >= points.length - 1) return null;

  const afterLeave = indexAfterPathLeave(points, startIndex, MIN_LOOP_PATH_DISTANCE_M);
  if (afterLeave < 0 || afterLeave <= startIndex) return null;

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
    if (peakDist > MIN_LOOP_PATH_DISTANCE_M * 2 && d < dPrev) {
      returnFrom = peakIdx;
      break;
    }
  }

  if (returnFrom < 0) return null;

  for (let j = returnFrom; j < points.length; j++) {
    if (!nextStepsIncreaseDist(points, j, end, MIN_RISE_STEPS)) continue;
    const refined = refineValleyEndIndex(points, j, end, returnFrom);
    if (distTo(points[refined], end) > matchRadiusM) continue;
    if (refined <= startIndex) continue;
    return { start_index: startIndex, end_index: refined };
  }

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

export const resolveLoopSegmentIndices = (
  points: IndexedPoint[],
  endpoints: SegmentEndpoints,
): { start_index: number; end_index: number } | null => {
  if (points.length < 3) return null;

  const { start, end } = endpoints;
  const matchRadiusM = endpoints.match_radius_m ?? DEFAULT_MATCH_RADIUS_M;
  const startGateSq = nearestDistSq(points, start) + ENDPOINT_SNAP_SLACK;
  const start_index = earliestNearIndex(points, start, startGateSq);
  if (start_index < 0) return null;
  return tryLoopFromStart(points, start_index, end, matchRadiusM);
};

/**
 * Resolve segment endpoints so activity order holds: start_index < end_index.
 * When start and end are the same place, uses path-leave + local-min return.
 */
export const resolveSegmentIndices = (
  points: IndexedPoint[],
  endpoints: SegmentEndpoints,
): { start_index: number; end_index: number } => {
  if (points.length < 2) {
    throw new BadRequestError("Source activity has too few GPS points");
  }

  const { start, end } = endpoints;
  const samePoint =
    distSq({ lat: start.lat, lon: start.lon }, end.lat, end.lon) <= SAME_POINT_DIST_SQ;

  if (samePoint) {
    const loop = resolveLoopSegmentIndices(points, endpoints);
    if (!loop) {
      throw new BadRequestError(
        "Could not close a loop: no return within the match radius after leaving the start.",
      );
    }
    return loop;
  }

  const cum = new Array<number>(points.length);
  cum[0] = 0;
  for (let i = 1; i < points.length; i++) {
    cum[i] =
      cum[i - 1] +
      haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
  }
  const minPathM = MIN_LOOP_PATH_DISTANCE_M;

  let nearestStartDist = Infinity;
  let nearestEndDist = Infinity;
  for (const p of points) {
    const ds = distSq(p, start.lat, start.lon);
    const de = distSq(p, end.lat, end.lon);
    if (ds < nearestStartDist) nearestStartDist = ds;
    if (de < nearestEndDist) nearestEndDist = de;
  }

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

  if (start_index < 0 || end_index <= start_index) {
    throw new BadRequestError(
      "Segment end must be further along the route than the start (at least 40 m of path).",
    );
  }

  if (cum[end_index] - cum[start_index] < minPathM) {
    throw new BadRequestError(
      "Segment path is too short. Start and end must span at least 40 m along the route.",
    );
  }

  const startSnap = distSq(points[start_index], start.lat, start.lon);
  if (startSnap > nearestStartDist + ENDPOINT_SNAP_SLACK) {
    throw new BadRequestError(
      "Segment end must be further along the route than the start. Click an end point ahead on the path.",
    );
  }

  let nearestValidEndDist = Infinity;
  for (let j = 0; j < points.length; j++) {
    if (cum[j] - cum[start_index] < minPathM) continue;
    const de = distSq(points[j], end.lat, end.lon);
    if (de < nearestValidEndDist) nearestValidEndDist = de;
  }
  const endSnap = distSq(points[end_index], end.lat, end.lon);
  if (endSnap > nearestValidEndDist + ENDPOINT_SNAP_SLACK) {
    throw new BadRequestError(
      "Segment end must be further along the route than the start. Click an end point ahead on the path.",
    );
  }

  return { start_index, end_index };
};
