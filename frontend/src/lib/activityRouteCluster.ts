import type { ActivitySummary } from "../types";
import { haversineM } from "./geo/haversine";
import { sortActivities } from "./activityListSort";

export type RouteSamplePoint = {
  lat: number;
  lon: number;
};

export type ActivityRouteCluster = {
  id: string;
  representative: ActivitySummary;
  activities: ActivitySummary[];
  title: string;
};

/** Relative distance band for soft route membership. */
export const ROUTE_CLUSTER_DISTANCE_RATIO = 0.2;

/** Max start/end gate distance (m) to consider the same route. */
export const ROUTE_CLUSTER_ENDPOINT_MAX_M = 450;

/** Min shape score [0,1] against cluster representative path. */
export const ROUTE_CLUSTER_MIN_SHAPE_SCORE = 0.72;

/** Shape match tolerance (m). */
export const ROUTE_CLUSTER_SHAPE_TOLERANCE_M = 55;

const RESAMPLE_COUNT = 24;

const resamplePoints = (
  points: readonly RouteSamplePoint[],
  targetCount: number,
): RouteSamplePoint[] => {
  if (points.length === 0 || targetCount <= 0) return [];
  if (targetCount === 1) return [points[0]];
  if (points.length === 1) {
    return Array.from({ length: targetCount }, () => points[0]);
  }

  const result: RouteSamplePoint[] = [];
  const step = (points.length - 1) / (targetCount - 1);
  for (let i = 0; i < targetCount; i++) {
    result.push(points[Math.round(i * step)]!);
  }
  return result;
};

/**
 * Shape similarity in [0, 1] (avg nearest-neighbor distance vs tolerance).
 * Same idea as server segment shape matching, kept client-local for browse clustering.
 */
export const routeShapeScore = (
  reference: readonly RouteSamplePoint[],
  candidate: readonly RouteSamplePoint[],
  toleranceM: number,
): number => {
  if (reference.length < 2 || candidate.length < 2 || toleranceM <= 0) return 0;

  const ref = resamplePoints(reference, RESAMPLE_COUNT);
  const cand = resamplePoints(candidate, RESAMPLE_COUNT);
  let totalDist = 0;

  for (const r of ref) {
    let minDist = Infinity;
    for (const c of cand) {
      const d = haversineM(r.lat, r.lon, c.lat, c.lon);
      if (d < minDist) minDist = d;
    }
    totalDist += minDist;
  }

  const avgDist = totalDist / ref.length;
  return Math.max(0, Math.min(1, 1 - avgDist / toleranceM));
};

const endpoints = (
  points: readonly RouteSamplePoint[],
): { start: RouteSamplePoint; end: RouteSamplePoint } | null => {
  if (points.length < 2) return null;
  return { start: points[0]!, end: points[points.length - 1]! };
};

const distanceCompatible = (a: ActivitySummary, b: ActivitySummary): boolean => {
  const da = a.distance_m;
  const db = b.distance_m;
  if (da == null || db == null || da <= 0 || db <= 0) return true;
  const ratio = Math.abs(da - db) / Math.max(da, db);
  return ratio <= ROUTE_CLUSTER_DISTANCE_RATIO;
};

const endpointsCompatible = (
  a: readonly RouteSamplePoint[],
  b: readonly RouteSamplePoint[],
): boolean => {
  const ea = endpoints(a);
  const eb = endpoints(b);
  if (!ea || !eb) return false;

  const startDist = haversineM(ea.start.lat, ea.start.lon, eb.start.lat, eb.start.lon);
  const endDist = haversineM(ea.end.lat, ea.end.lon, eb.end.lat, eb.end.lon);
  if (startDist <= ROUTE_CLUSTER_ENDPOINT_MAX_M && endDist <= ROUTE_CLUSTER_ENDPOINT_MAX_M) {
    return true;
  }

  // Out-and-back / reverse direction: allow swapped ends.
  const startToEnd = haversineM(ea.start.lat, ea.start.lon, eb.end.lat, eb.end.lon);
  const endToStart = haversineM(ea.end.lat, ea.end.lon, eb.start.lat, eb.start.lon);
  return (
    startToEnd <= ROUTE_CLUSTER_ENDPOINT_MAX_M && endToStart <= ROUTE_CLUSTER_ENDPOINT_MAX_M
  );
};

const sameRoute = (
  a: ActivitySummary,
  aPoints: readonly RouteSamplePoint[],
  b: ActivitySummary,
  bPoints: readonly RouteSamplePoint[],
): boolean => {
  if (a.profile_id !== b.profile_id) return false;
  if (!distanceCompatible(a, b)) return false;
  if (aPoints.length < 2 || bPoints.length < 2) return false;
  if (!endpointsCompatible(aPoints, bPoints)) return false;

  const score = routeShapeScore(aPoints, bPoints, ROUTE_CLUSTER_SHAPE_TOLERANCE_M);
  const reverseScore = routeShapeScore(
    aPoints,
    [...bPoints].reverse(),
    ROUTE_CLUSTER_SHAPE_TOLERANCE_M,
  );
  return Math.max(score, reverseScore) >= ROUTE_CLUSTER_MIN_SHAPE_SCORE;
};

const clusterTitle = (activities: readonly ActivitySummary[]): string => {
  const newest = sortActivities(activities, "newest")[0];
  return newest?.name ?? "Route";
};

/**
 * Greedy soft clusters: walk newest-first, attach to first matching representative path.
 * Same profile only. Activities without usable samples become singletons.
 */
export const clusterActivitiesByRoute = (
  activities: readonly ActivitySummary[],
  samples: ReadonlyMap<number, readonly RouteSamplePoint[]>,
): ActivityRouteCluster[] => {
  const ordered = sortActivities(activities, "newest");
  type OpenCluster = {
    representative: ActivitySummary;
    points: readonly RouteSamplePoint[];
    activities: ActivitySummary[];
  };

  const open: OpenCluster[] = [];

  for (const activity of ordered) {
    const points = samples.get(activity.id) ?? [];
    let attached = false;

    if (points.length >= 2) {
      for (const cluster of open) {
        if (sameRoute(cluster.representative, cluster.points, activity, points)) {
          cluster.activities.push(activity);
          attached = true;
          break;
        }
      }
    }

    if (!attached) {
      open.push({
        representative: activity,
        points: points.length >= 2 ? points : [],
        activities: [activity],
      });
    }
  }

  return open.map((cluster) => {
    const members = sortActivities(cluster.activities, "newest");
    const representative = members[0] ?? cluster.representative;
    return {
      id: `route-${representative.id}`,
      representative,
      activities: members,
      title: clusterTitle(members),
    };
  });
};
