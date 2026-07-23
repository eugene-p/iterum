import type { SegmentDraft, SegmentPickMode } from "../../hooks/segmentEditorTypes";
import type { TrackPoint } from "../../types";
import type { MapRoute } from "./segmentDetailTypes";

export type SegmentEditorFormState = {
  notice: string | null;
  name: string;
  pickMode: SegmentPickMode;
  draft: Partial<SegmentDraft>;
  radius: number;
  matchThreshold: number;
  error: string | null;
};

export type SegmentEditorMapState = {
  routes: MapRoute[];
  parentSegmentHighlight: TrackPoint[];
  draftHighlightPoints: TrackPoint[];
};



