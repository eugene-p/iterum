type DisplayActivityIdInput = {
  segmentEditorActivityId?: number;
  selectedPassActivityId?: number;
  sourceActivityId?: number;
  selectedActivityId: number | null;
};

export const resolveDisplayActivityId = ({
  segmentEditorActivityId,
  selectedPassActivityId,
  sourceActivityId,
  selectedActivityId,
}: DisplayActivityIdInput): number | null =>
  segmentEditorActivityId ??
  selectedPassActivityId ??
  sourceActivityId ??
  selectedActivityId ??
  null;