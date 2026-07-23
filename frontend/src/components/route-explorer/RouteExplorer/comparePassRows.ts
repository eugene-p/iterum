import {
  indexAtElapsedSec,
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
import { indexAtStretchElapsedSec } from "./stretchCompareUtils";

export const buildSegmentTimePassRows = (
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

/** Alias kept for older imports. */
export const buildTimePassRows = buildSegmentTimePassRows;

export const buildStretchTimePassRows = (
  passSlices: ExplorerPassSlice[],
  stretch: Stretch,
  localElapsedSec: number,
  matchedPasses: SegmentPass[],
): PositionPassRow[] =>
  passSlices.map((slice) => {
    const index = indexAtStretchElapsedSec(
      slice.points,
      stretch,
      localElapsedSec,
      slice.durationSec,
    );
    return {
      slice,
      index,
      color: passIdentityColorForPass(slice.pass.id, matchedPasses),
      stretchContext: stretchPointContextAtIndex(
        slice.points,
        stretch,
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
