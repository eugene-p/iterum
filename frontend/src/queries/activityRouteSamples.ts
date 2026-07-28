import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { sampleActivityRoute } from "../api";
import type { RouteSamplePoint } from "../lib/activityRouteCluster";
import { queryKeys } from "./queryKeys";

const ROUTE_SAMPLE_STALE_MS = 5 * 60 * 1000;

/**
 * Per-activity route samples for soft clustering.
 * Keys are per-id so search/day filters reuse cache instead of re-fetching the whole set.
 */
export const useActivityRouteSamplesMapQuery = (
  activityIds: readonly number[],
  enabled: boolean,
) => {
  const sortedIds = useMemo(
    () => [...new Set(activityIds)].sort((a, b) => a - b),
    [activityIds],
  );

  const queries = useQueries({
    queries: sortedIds.map((id) => ({
      queryKey: queryKeys.activityRouteSample(id),
      queryFn: () => sampleActivityRoute(id),
      enabled: enabled && sortedIds.length > 0,
      staleTime: ROUTE_SAMPLE_STALE_MS,
    })),
  });

  const samplesKey = queries
    .map((query, index) =>
      query.data ? `${sortedIds[index]}:${query.data.points.length}` : `${sortedIds[index]}:pending`,
    )
    .join("|");

  const data = useMemo(() => {
    const map = new Map<number, RouteSamplePoint[]>();
    for (let i = 0; i < sortedIds.length; i++) {
      const points = queries[i]?.data?.points;
      if (points) map.set(sortedIds[i]!, points);
    }
    return map;
    // samplesKey tracks per-id data identity; queries array is new each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- samplesKey + sortedIds
  }, [sortedIds, samplesKey]);

  const hasAnyData = data.size > 0;
  const isPending = queries.some((query) => query.isPending);
  // Block the list only on cold start; keep clusters visible while extra ids load.
  const isLoading = enabled && sortedIds.length > 0 && !hasAnyData && isPending;

  return { data, isLoading, isPending };
};
