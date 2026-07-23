import type { SegmentCompare } from "../../../types";

export type RouteExplorerTarget =
  | { kind: "activity"; activityId: number; activityName: string }
  | { kind: "segment"; comparison: SegmentCompare };

export const routeExplorerTargetKey = (target: RouteExplorerTarget): string =>
  target.kind === "activity"
    ? `activity:${target.activityId}`
    : `segment:${target.comparison.segment.id}`;