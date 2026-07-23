export type SegmentDraft = {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  start_index?: number;
  end_index?: number;
};

export type SegmentEditorMode = {
  kind: "create" | "edit" | "subset";
  activityId: number;
  segmentId?: number;
  constrainIndices?: { min: number; max: number };
};

export type SegmentPickMode = "none" | "start" | "end";