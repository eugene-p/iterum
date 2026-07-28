import { sampleActivityRoute } from "../api";
import type { RouteSamplePoint } from "./activityRouteCluster";

/** Concurrent route-sample fetches when building soft route groups. */
export const ROUTE_SAMPLE_FETCH_CONCURRENCY = 6;

export const fetchActivityRouteSamplesMap = async (
  activityIds: readonly number[],
  fetchSample: (id: number) => Promise<{ points: RouteSamplePoint[] }> = sampleActivityRoute,
): Promise<Map<number, RouteSamplePoint[]>> => {
  const unique = [...new Set(activityIds)];
  const map = new Map<number, RouteSamplePoint[]>();
  if (unique.length === 0) return map;

  let next = 0;
  const worker = async () => {
    while (true) {
      const idx = next;
      next += 1;
      if (idx >= unique.length) return;
      const id = unique[idx]!;
      try {
        const { points } = await fetchSample(id);
        map.set(id, points);
      } catch {
        map.set(id, []);
      }
    }
  };

  const workerCount = Math.min(ROUTE_SAMPLE_FETCH_CONCURRENCY, unique.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return map;
};
