import { useMemo } from "react";
import type { TrackPoint } from "../types";

type MapRoute = { id: number; points: TrackPoint[]; selected: boolean };

export const useMapRoutes = (
  displayActivityId: number | null,
  displayPoints: TrackPoint[] | undefined,
): MapRoute[] =>
  useMemo(() => {
    if (!displayPoints || displayPoints.length < 2 || displayActivityId == null) return [];
    return [{ id: displayActivityId, points: displayPoints, selected: true }];
  }, [displayPoints, displayActivityId]);