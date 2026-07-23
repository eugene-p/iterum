import {
  segmentFractionAtIndex,
  stretchProgressRankColor,
  stretchProgressScore,
} from "../../../stretchUtils";
import type { Stretch } from "../../../types";
import type { PositionPassRow } from "../components/positionCompareTypes";

/** segment = further along whole segment; stretch = further into current stretch piece. */
export type StretchProgressMode = "segment" | "stretch";

export function assignStretchProgressColors(
  rows: PositionPassRow[],
  stretches: Stretch[],
  mode: StretchProgressMode,
): PositionPassRow[] {
  if (rows.length === 0) return rows;

  if (mode === "stretch") {
    const scores = rows.map((row) => row.stretchContext.stretchElapsedSec ?? -1);
    return rows.map((row, index) => ({
      ...row,
      positionColor: stretchProgressRankColor(scores, scores[index], true),
    }));
  }

  if (!stretches.length) return rows;

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

export function stretchProgressColorForValue(
  value: number,
  peerValues: number[],
  _mode: StretchProgressMode,
): string | null {
  if (!peerValues.length) return null;
  return stretchProgressRankColor([...peerValues, value], value, true);
}
