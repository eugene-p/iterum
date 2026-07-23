import type { SegmentDraft, SegmentEditorMode, SegmentPickMode } from "../hooks/segmentEditorTypes";

export type EditorScreen = {
  mode: SegmentEditorMode;
  pickMode: SegmentPickMode;
  draft: Partial<SegmentDraft>;
  name: string;
  radius: number;
  matchThreshold: number;
  notice: string | null;
  error: string | null;
};

export const createEditorScreen = (
  mode: SegmentEditorMode,
  notice: string,
  seed?: {
    name?: string;
    radius?: number;
    matchThreshold?: number;
    draft?: Partial<SegmentDraft>;
  },
): EditorScreen => ({
  mode,
  pickMode: "none",
  draft: seed?.draft ?? {},
  name: seed?.name ?? "New segment",
  radius: seed?.radius ?? 30,
  matchThreshold: seed?.matchThreshold ?? 0.9,
  notice,
  error: null,
});