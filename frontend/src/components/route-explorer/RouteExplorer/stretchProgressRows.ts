import { metricsAtIndex } from "../../../routeExplorerUtils";
import {
  segmentFractionAtIndex,
  stretchProgressRankColor,
  stretchProgressScore,
} from "../../../stretchUtils";
import type { Stretch } from "../../../types";
import type { PositionPassRow } from "../components/positionCompareTypes";

export type StretchProgressMode = "position" | "time";

export function assignStretchProgressColors(
  rows: PositionPassRow[],
  stretches: Stretch[],
  mode: StretchProgressMode,
): PositionPassRow[] {
  if (!stretches.length || rows.length === 0) return rows;

  if (mode === "time") {
    const scores = rows.map((row) =>
      stretchProgressScore(
        stretches,
        row.slice.points,
        segmentFractionAtIndex(row.slice.points, row.index),
      ),
    );
    return rows.map((row, index) => ({
      ...row,
      positionColor: stretchProgressRankColor(scores, scores[index], true),
    }));
  }

  const elapsedTimes = rows.map(
    (row) => metricsAtIndex(row.slice.points, row.index, row.slice.durationSec)?.elapsedSec ?? -1,
  );
  return rows.map((row, index) => ({
    ...row,
    positionColor: stretchProgressRankColor(elapsedTimes, elapsedTimes[index], false),
  }));
}

export function stretchProgressColorForValue(
  value: number,
  peerValues: number[],
  mode: StretchProgressMode,
): string | null {
  if (!peerValues.length) return null;
  return stretchProgressRankColor(
    [...peerValues, value],
    value,
    mode === "time",
  );
}