import {
  indexAtElapsedSec,
  indexAtRelativePosition,
  metricsAtIndex,
  type ExplorerPassSlice,
} from "../../../routeExplorerUtils";
import {
  segmentFractionAtIndex,
  stretchAtFraction,
  stretchPointContextAtIndex,
} from "../../../stretchUtils";
import type { SegmentPass, Stretch, TrackPoint } from "../../../types";
import type { ExplorerMarker } from "../../maps/RouteExplorerMap/RouteExplorerMap";
import type { PositionPassRow } from "../components/positionCompareTypes";
import { passIdentityColorForPass } from "../passIdentityColors";

export const buildPositionPassRows = (
  passSlices: ExplorerPassSlice[],
  positionFraction: number,
  currentStretch: Stretch | null,
  matchedPasses: SegmentPass[],
): PositionPassRow[] =>
  passSlices.map((slice) => {
    const index = indexAtRelativePosition(slice.points, positionFraction);
    return {
      slice,
      index,
      color: passIdentityColorForPass(slice.pass.id, matchedPasses),
      stretchContext: stretchPointContextAtIndex(
        slice.points,
        currentStretch,
        index,
        slice.durationSec,
      ),
    };
  });

export const buildTimePassRows = (
  passSlices: ExplorerPassSlice[],
  timeElapsedSec: number,
  stretches: Stretch[],
  matchedPasses: SegmentPass[],
): PositionPassRow[] =>
  passSlices.map((slice) => {
    const index = indexAtElapsedSec(slice.points, timeElapsedSec, slice.durationSec);
    const passStretch = stretchAtFraction(
      stretches,
      slice.points,
      segmentFractionAtIndex(slice.points, index),
    );
    return {
      slice,
      index,
      color: passIdentityColorForPass(slice.pass.id, matchedPasses),
      stretchContext: stretchPointContextAtIndex(
        slice.points,
        passStretch,
        index,
        slice.durationSec,
      ),
    };
  });

export const markersFromPassRows = (
  rows: PositionPassRow[],
  idPrefix: string,
): ExplorerMarker[] => {
  const markers: ExplorerMarker[] = [];
  for (const row of rows) {
    const metrics = metricsAtIndex(row.slice.points, row.index);
    if (metrics) {
      markers.push({
        id: `${idPrefix}-${row.slice.pass.id}`,
        point: metrics.point,
        color: row.color,
      });
    }
  }
  return markers;
};

export const soloActivityMarker = (
  points: TrackPoint[],
  index: number,
  durationSec: number | null,
  color: string,
): ExplorerMarker[] => {
  const metrics = metricsAtIndex(points, index, durationSec);
  if (!metrics) return [];
  return [{ id: "current", point: metrics.point, color }];
};
