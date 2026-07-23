import { useMemo } from "react";
import { useActivityQuery } from "../queries/activities";
import { usePassActivityTracks } from "../app/usePassActivityTracks";
import type { SegmentCompare } from "../types";

export const useActivityTracks = (
  comparison: SegmentCompare | null | undefined,
  displayActivityId: number | null,
) => {
  const passActivityTracks = usePassActivityTracks(comparison);
  const displayActivityQuery = useActivityQuery(displayActivityId);

  return useMemo(() => {
    const tracks = { ...passActivityTracks };
    if (displayActivityQuery.data) {
      tracks[displayActivityQuery.data.id] = displayActivityQuery.data.points ?? [];
    }
    return tracks;
  }, [passActivityTracks, displayActivityQuery.data]);
};