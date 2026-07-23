import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { getActivityPoints } from "../api";
import { queryKeys } from "../queries/queryKeys";
import type { SegmentCompare, TrackPoint } from "../types";

export const usePassActivityTracks = (comparison: SegmentCompare | null | undefined) => {
  const activityIds = useMemo(() => {
    if (!comparison?.passes.length) return [];
    return [
      ...new Set(
        comparison.passes
          .filter((pass) => pass.matched && pass.start_index != null && pass.end_index != null)
          .map((pass) => pass.activity_id),
      ),
    ];
  }, [comparison]);

  const queries = useQueries({
    queries: activityIds.map((id) => ({
      queryKey: queryKeys.activityPoints(id),
      queryFn: () => getActivityPoints(id),
    })),
  });

  const activityIdsKey = activityIds.join(",");
  const trackDataKey = queries
    .map((query, index) =>
      query.data ? `${activityIds[index]}:${query.data.points.length}` : "pending",
    )
    .join("|");
  const activityTracks = useMemo(() => {
    const tracks: Record<number, TrackPoint[]> = {};
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.data) tracks[activityIds[i]] = query.data.points;
    }
    return tracks;
  }, [activityIdsKey, trackDataKey, queries]);

  return activityTracks;
};