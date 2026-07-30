import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildPathContext,
  mergeStretches,
  moveBoundary,
  projectStretchBoundaries,
  reindexStretches,
  splitStretch,
  type MergeDirection,
} from "../lib/stretchEdit";
import type { Stretch, StretchThresholds, TrackPoint } from "../types";
import { DEFAULT_STRETCH_THRESHOLDS } from "../lib/stretchThresholds";

type UseStretchEditSessionArgs = {
  /** Scopes draft; cleared when this changes. */
  segmentId: number;
  savedStretches: Stretch[];
  pathPoints: TrackPoint[] | undefined;
  thresholds: StretchThresholds | undefined;
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
  onPersist: (stretches: Stretch[]) => Promise<void>;
};

export const useStretchEditSession = ({
  segmentId,
  savedStretches,
  pathPoints,
  thresholds,
  selectedIndex,
  onSelectIndex,
  onPersist,
}: UseStretchEditSessionArgs) => {
  const [draft, setDraft] = useState<Stretch[] | null>(null);
  const [selectionAtDirty, setSelectionAtDirty] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const resolvedThresholds = thresholds ?? DEFAULT_STRETCH_THRESHOLDS;
  // API may return 1-based stretch_index; UI/edit ops use 0-based array indices.
  const baseline = useMemo(
    () => reindexStretches(savedStretches),
    [savedStretches],
  );
  const dirty = draft != null;
  const stretches = draft ?? baseline;

  const path = useMemo(
    () => (pathPoints?.length ? buildPathContext(pathPoints) : null),
    [pathPoints],
  );

  useEffect(() => {
    setDraft(null);
    setSelectionAtDirty(null);
  }, [segmentId]);

  const captureSelectionIfClean = useCallback(() => {
    setSelectionAtDirty((prev) => prev ?? selectedIndex);
  }, [selectedIndex]);

  const applyDraft = useCallback(
    (next: Stretch[]) => {
      captureSelectionIfClean();
      setDraft(next);
    },
    [captureSelectionIfClean],
  );

  const cancel = useCallback(() => {
    const restore = selectionAtDirty;
    setDraft(null);
    setSelectionAtDirty(null);
    if (restore != null) onSelectIndex(restore);
  }, [selectionAtDirty, onSelectIndex]);

  const save = useCallback(async () => {
    if (!draft?.length) return;
    setSaving(true);
    try {
      // Normalize empty names before persist.
      const normalized = draft.map((s) => ({
        ...s,
        name: s.name?.trim() ? s.name.trim() : null,
      }));
      await onPersist(normalized);
      setDraft(null);
      setSelectionAtDirty(null);
    } finally {
      setSaving(false);
    }
  }, [draft, onPersist]);

  const selectStretchIndex = useCallback(
    (index: number | null) => {
      onSelectIndex(index);
    },
    [onSelectIndex],
  );

  const goAdjacent = useCallback(
    (delta: number) => {
      if (!stretches.length) return;
      if (selectedIndex == null) {
        onSelectIndex(delta > 0 ? 0 : stretches.length - 1);
        return;
      }
      const next = selectedIndex + delta;
      if (next < 0 || next >= stretches.length) return;
      onSelectIndex(next);
    },
    [stretches.length, selectedIndex, onSelectIndex],
  );

  const merge = useCallback(
    (direction: MergeDirection, atIndex?: number) => {
      const index = atIndex ?? selectedIndex;
      if (index == null) return;
      const source = draft ?? baseline;
      const result = mergeStretches(
        source,
        index,
        direction,
        resolvedThresholds,
      );
      if (!result) return;
      applyDraft(result.stretches);
      onSelectIndex(result.selectedIndex);
    },
    [
      selectedIndex,
      draft,
      baseline,
      resolvedThresholds,
      onSelectIndex,
      applyDraft,
    ],
  );

  const split = useCallback(() => {
    if (selectedIndex == null || !path) return;
    const source = draft ?? baseline;
    const result = splitStretch(
      source,
      selectedIndex,
      path,
      resolvedThresholds,
    );
    if (!result) return;
    applyDraft(result.stretches);
    onSelectIndex(result.selectedIndex);
  }, [
    selectedIndex,
    path,
    draft,
    baseline,
    resolvedThresholds,
    onSelectIndex,
    applyDraft,
  ]);

  /** Split at an absolute path distance within the selected stretch. */
  const splitAt = useCallback(
    (index: number, cutDistanceM: number) => {
      if (!path) return;
      const source = draft ?? baseline;
      const result = splitStretch(
        source,
        index,
        path,
        resolvedThresholds,
        cutDistanceM,
      );
      if (!result) return;
      applyDraft(result.stretches);
      onSelectIndex(result.selectedIndex);
    },
    [path, draft, baseline, resolvedThresholds, onSelectIndex, applyDraft],
  );

  /** Resize a boundary; returns the new stretch list (for live min-length nudge). */
  const resizeBoundary = useCallback(
    (boundaryIndex: number, distanceM: number): Stretch[] | null => {
      if (selectedIndex == null || !path) return null;
      const source = draft ?? baseline;
      const next = moveBoundary(
        source,
        boundaryIndex,
        distanceM,
        path,
        resolvedThresholds,
      );
      if (!next) return null;
      // Preserve names by index after reproject (same count, same order).
      const withNames = next.map((s, i) => ({
        ...s,
        name: source[i]?.name ?? s.name ?? null,
      }));
      applyDraft(withNames);
      return withNames;
    },
    [selectedIndex, path, draft, baseline, resolvedThresholds, applyDraft],
  );

  /**
   * Rename by array index (not selection). Keeps raw text while typing;
   * empty → null. Uses functional draft updates so rapid keystrokes don't
   * clobber each other or hit the wrong stretch.
   */
  const renameStretch = useCallback(
    (index: number, name: string) => {
      const source = draft ?? baseline;
      if (index < 0 || index >= source.length) return;
      const nextName = name.length > 0 ? name : null;
      if ((source[index].name ?? null) === nextName) return;

      // Functional update so rapid keystrokes always build on latest draft.
      captureSelectionIfClean();
      setDraft((prev) => {
        const base = prev ?? baseline;
        if (index < 0 || index >= base.length) return prev;
        if ((base[index].name ?? null) === nextName) return prev;
        return base.map((s, i) =>
          i === index ? { ...s, name: nextName } : s,
        );
      });
    },
    [draft, baseline, captureSelectionIfClean],
  );

  const boundaries = useMemo(() => {
    if (!path || !stretches.length) return [];
    return projectStretchBoundaries(stretches, path);
  }, [path, stretches]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (dirty) {
          event.preventDefault();
          cancel();
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (event.shiftKey) merge("left");
        else goAdjacent(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (event.shiftKey) merge("right");
        else goAdjacent(1);
      }
    },
    [dirty, cancel, merge, goAdjacent],
  );

  return {
    stretches,
    dirty,
    saving,
    path,
    boundaries,
    minStretchM: resolvedThresholds.min_stretch_m,
    canEdit: path != null && stretches.length > 0,
    selectStretchIndex,
    goAdjacent,
    merge,
    split,
    splitAt,
    resizeBoundary,
    renameStretch,
    cancel,
    save,
    handleKeyDown,
  };
};

export type StretchEditSession = ReturnType<typeof useStretchEditSession>;
