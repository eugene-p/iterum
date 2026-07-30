import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Modal, ModalHeader, MutedText } from "../../ui";
import type { StretchEditSession } from "../../../hooks/useStretchEditSession";
import type { Stretch } from "../../../types";
import { formatDistance } from "../../../utils";
import {
  stretchDisplayName,
  stretchDisplayNumber,
} from "../../../lib/stretchEdit";
import { StretchDragHandle } from "./StretchDragHandle";
import { stretchStripEditorStyles as styles } from "./StretchStripEditor.styles";

export type StretchToolMode = "idle" | "edit" | "merge" | "split";

/** Soft-merge nudge after resize: only the two stretches on the dragged boundary. */
type BoundaryMergeNudge = {
  shortIndex: number;
  partnerIndex: number;
  shortLengthM: number;
};

type StretchStripEditorProps = {
  session: StretchEditSession;
  selectedIndex: number | null;
  convertOpen: boolean;
  convertName: string;
  convertBusy: boolean;
  onConvertNameChange: (name: string) => void;
  onOpenConvert: () => void;
  onCloseConvert: () => void;
  onConfirmConvert: () => void;
  onCloseWorkspace?: () => void;
  /** Live split cut distance (path m) for map preview; null when not splitting. */
  onSplitCutChange?: (cutDistanceM: number | null) => void;
};

const SELECT_STRETCH_LABEL = "Select a stretch";

const cellLabel = (stretch: Stretch | null, fallback: string) => {
  if (!stretch) return fallback;
  return `${stretchDisplayNumber(stretch.index)} · ${stretchDisplayName(stretch)}`;
};

const frWeight = (lengthM: number | undefined, hasCell: boolean) => {
  if (!hasCell) return 0.15;
  return Math.max(lengthM ?? 1, 1);
};

export const StretchStripEditor = ({
  session,
  selectedIndex,
  convertOpen,
  convertName,
  convertBusy,
  onConvertNameChange,
  onOpenConvert,
  onCloseConvert,
  onConfirmConvert,
  onCloseWorkspace,
  onSplitCutChange,
}: StretchStripEditorProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const editTrackRef = useRef<HTMLDivElement>(null);
  const splitTrackRef = useRef<HTMLDivElement>(null);
  const [toolMode, setToolMode] = useState<StretchToolMode>("idle");
  const [splitCutM, setSplitCutM] = useState<number | null>(null);
  const [mergeNudge, setMergeNudge] = useState<BoundaryMergeNudge | null>(null);
  /** Boundary index last dragged (1 = between stretch 0 and 1). */
  const lastBoundaryRef = useRef<number | null>(null);
  const stretchesRef = useRef(session.stretches);
  const { stretches, dirty, saving, boundaries, canEdit, minStretchM } = session;

  useEffect(() => {
    stretchesRef.current = stretches;
  }, [stretches]);

  // Window-level keys while this editor is mounted (no need to focus strip first).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "Escape") {
        if (toolMode !== "idle") {
          event.preventDefault();
          setToolMode("idle");
          setSplitCutM(null);
          if (dirty) session.cancel();
          return;
        }
        if (dirty) {
          event.preventDefault();
          session.cancel();
          return;
        }
        return;
      }
      if (toolMode !== "idle") return;
      session.handleKeyDown(event);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, toolMode, dirty]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  const current =
    selectedIndex != null ? (stretches[selectedIndex] ?? null) : null;
  const prev =
    selectedIndex != null && selectedIndex > 0
      ? stretches[selectedIndex - 1]
      : null;
  const next =
    selectedIndex != null && selectedIndex < stretches.length - 1
      ? stretches[selectedIndex + 1]
      : null;

  const selectedSpan = useMemo(() => {
    if (selectedIndex == null || boundaries.length < 2) return null;
    const start = boundaries[selectedIndex];
    const end = boundaries[selectedIndex + 1];
    if (start == null || end == null) return null;
    return { start, end };
  }, [boundaries, selectedIndex]);

  /** Path span covering prev + selected + next (for edit handle track). */
  const editTrackSpan = useMemo(() => {
    if (selectedIndex == null || boundaries.length < 2) return null;
    const startIdx = prev ? selectedIndex - 1 : selectedIndex;
    const endIdx = next ? selectedIndex + 1 : selectedIndex;
    const start = boundaries[startIdx];
    const end = boundaries[endIdx + 1];
    if (start == null || end == null || end <= start) return null;
    return { start, end };
  }, [boundaries, selectedIndex, prev, next]);

  /** Split cut must leave both sides ≥ min stretch length. */
  const splitDragRange = useMemo(() => {
    if (!selectedSpan) return null;
    const minLen = minStretchM;
    const lo = selectedSpan.start + minLen;
    const hi = selectedSpan.end - minLen;
    if (hi <= lo) return null;
    return { minM: lo, maxM: hi };
  }, [selectedSpan, minStretchM]);

  useEffect(() => {
    if (toolMode !== "split" || !selectedSpan || !splitDragRange) {
      onSplitCutChange?.(null);
      return;
    }
    setSplitCutM((prevCut) => {
      const next =
        prevCut != null &&
        prevCut >= splitDragRange.minM &&
        prevCut <= splitDragRange.maxM
          ? prevCut
          : (splitDragRange.minM + splitDragRange.maxM) / 2;
      onSplitCutChange?.(next);
      return next;
    });
  }, [toolMode, selectedSpan, splitDragRange, onSplitCutChange]);

  const enterEdit = () => {
    if (selectedIndex == null) return;
    setToolMode("edit");
    setSplitCutM(null);
    setMergeNudge(null);
    lastBoundaryRef.current = null;
  };

  const enterMerge = () => {
    if (selectedIndex == null || (!prev && !next)) return;
    setToolMode("merge");
    setSplitCutM(null);
    setMergeNudge(null);
  };

  const enterSplit = () => {
    if (selectedIndex == null || !selectedSpan || !splitDragRange) return;
    setToolMode("split");
    setMergeNudge(null);
  };

  const exitTool = () => {
    setToolMode("idle");
    setSplitCutM(null);
    setMergeNudge(null);
    lastBoundaryRef.current = null;
    onSplitCutChange?.(null);
  };

  const handleMergePick = (direction: "left" | "right") => {
    session.merge(direction);
    setToolMode("idle");
    setMergeNudge(null);
  };

  /**
   * Live while dragging: only the two stretches on this boundary.
   * Show when either hits min length; clear when both are back above min.
   */
  const updateBoundaryMergeNudge = useCallback(
    (boundaryIndex: number, list: Stretch[]) => {
      lastBoundaryRef.current = boundaryIndex;
      const leftIdx = boundaryIndex - 1;
      const rightIdx = boundaryIndex;
      if (leftIdx < 0 || rightIdx >= list.length) {
        setMergeNudge(null);
        return;
      }
      const left = list[leftIdx];
      const right = list[rightIdx];
      const atMin = (len: number) => len <= minStretchM + 0.5;
      if (!atMin(left.length_m) && !atMin(right.length_m)) {
        setMergeNudge(null);
        return;
      }
      const shortIndex = left.length_m <= right.length_m ? leftIdx : rightIdx;
      const partnerIndex = shortIndex === leftIdx ? rightIdx : leftIdx;
      setMergeNudge({
        shortIndex,
        partnerIndex,
        shortLengthM: list[shortIndex].length_m,
      });
    },
    [minStretchM],
  );

  const handleBoundaryResize = useCallback(
    (boundaryIndex: number, distanceM: number) => {
      const next = session.resizeBoundary(boundaryIndex, distanceM);
      if (next) updateBoundaryMergeNudge(boundaryIndex, next);
    },
    [session, updateBoundaryMergeNudge],
  );

  const applyBoundaryMergeNudge = () => {
    if (!mergeNudge) return;
    const { shortIndex, partnerIndex } = mergeNudge;
    // Merge short into partner: short left of partner → merge right; else merge left.
    if (shortIndex < partnerIndex) session.merge("right", shortIndex);
    else session.merge("left", shortIndex);
    setMergeNudge(null);
  };

  const handleSave = async () => {
    if (toolMode === "split" && splitCutM != null && selectedIndex != null) {
      session.splitAt(selectedIndex, splitCutM);
      setToolMode("idle");
      setSplitCutM(null);
    }
    setMergeNudge(null);
    await session.save();
    setToolMode("idle");
  };

  const handleCancel = () => {
    session.cancel();
    exitTool();
  };

  if (!canEdit && !dirty) {
    return (
      <MutedText className={styles.hint}>
        Stretch path data is required to edit boundaries.
      </MutedText>
    );
  }

  const leftBoundaryIndex = selectedIndex ?? 0;
  const rightBoundaryIndex = selectedIndex != null ? selectedIndex + 1 : 1;
  const leftBound = boundaries[leftBoundaryIndex];
  const rightBound = boundaries[rightBoundaryIndex];

  const showActionBar = toolMode === "idle" && current != null && !dirty;

  const editGridTemplate = `${frWeight(prev?.length_m, Boolean(prev))}fr ${frWeight(current?.length_m, Boolean(current))}fr ${frWeight(next?.length_m, Boolean(next))}fr`;

  return (
    <div ref={rootRef} className={styles.root} tabIndex={-1}>
      <div className={styles.header}>
        <h2 className={styles.title}>Edit stretches</h2>
        <div className={styles.headerActions}>
          {dirty || toolMode === "split" ? (
            <>
              <Button size="sm" type="button" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || (toolMode === "split" && splitCutM == null)}
              >
                Save
              </Button>
            </>
          ) : null}
          {toolMode !== "idle" && !dirty && toolMode !== "split" ? (
            <Button size="sm" type="button" onClick={exitTool}>
              Done
            </Button>
          ) : null}
          {onCloseWorkspace ? (
            <Button
              size="sm"
              type="button"
              onClick={() => {
                if (dirty) handleCancel();
                onCloseWorkspace();
              }}
            >
              Close
            </Button>
          ) : null}
        </div>
      </div>

      <div className={styles.stripWrap}>
        {toolMode === "edit" && editTrackSpan ? (
          <div
            ref={editTrackRef}
            className={styles.track}
            style={{ gridTemplateColumns: editGridTemplate }}
            aria-label="Stretch boundary editor"
          >
            <div className={styles.cell({ dim: !prev })}>
              <span className={styles.cellLabel}>{cellLabel(prev, "—")}</span>
              {prev && (
                <span className={styles.cellMeta}>{formatDistance(prev.length_m)}</span>
              )}
            </div>
            <div className={styles.cell({ active: true })}>
              <span className={styles.cellLabel}>
                {current ? cellLabel(current, SELECT_STRETCH_LABEL) : SELECT_STRETCH_LABEL}
              </span>
              {current && (
                <span className={styles.cellMeta}>
                  {formatDistance(current.length_m)} · {current.avg_grade_pct.toFixed(1)}%
                </span>
              )}
            </div>
            <div className={styles.cell({ dim: !next })}>
              <span className={styles.cellLabel}>{cellLabel(next, "—")}</span>
              {next && (
                <span className={styles.cellMeta}>{formatDistance(next.length_m)}</span>
              )}
            </div>
            {prev && leftBound != null && (
              <StretchDragHandle
                trackRef={editTrackRef}
                minM={editTrackSpan.start}
                maxM={editTrackSpan.end}
                valueM={leftBound}
                ariaLabel="Left boundary"
                onChange={(d) => handleBoundaryResize(leftBoundaryIndex, d)}
              />
            )}
            {next && rightBound != null && (
              <StretchDragHandle
                trackRef={editTrackRef}
                minM={editTrackSpan.start}
                maxM={editTrackSpan.end}
                valueM={rightBound}
                ariaLabel="Right boundary"
                onChange={(d) => handleBoundaryResize(rightBoundaryIndex, d)}
              />
            )}
          </div>
        ) : toolMode === "merge" ? (
          <div className={styles.stripSimple} aria-label="Merge stretch">
            <div
              className={styles.cell({
                dim: !prev,
                clickable: Boolean(prev),
                mergeTarget: Boolean(prev),
              })}
              onClick={() => prev && handleMergePick("left")}
              role={prev ? "button" : undefined}
            >
              <span className={styles.cellLabel}>{cellLabel(prev, "—")}</span>
              {prev && (
                <span className={styles.cellMeta}>{formatDistance(prev.length_m)}</span>
              )}
            </div>
            <div className={styles.cell({ active: true })}>
              <span className={styles.cellLabel}>Select a stretch to merge</span>
              <span className={styles.cellMeta}>
                Click previous or next neighbor
              </span>
            </div>
            <div
              className={styles.cell({
                dim: !next,
                clickable: Boolean(next),
                mergeTarget: Boolean(next),
              })}
              onClick={() => next && handleMergePick("right")}
              role={next ? "button" : undefined}
            >
              <span className={styles.cellLabel}>{cellLabel(next, "—")}</span>
              {next && (
                <span className={styles.cellMeta}>{formatDistance(next.length_m)}</span>
              )}
            </div>
          </div>
        ) : toolMode === "split" ? (
          <div className={styles.stripSimple} aria-label="Split stretch">
            <div className={styles.cell({ dim: true })}>
              <span className={styles.cellLabel}>{cellLabel(prev, "—")}</span>
            </div>
            <div ref={splitTrackRef} className={styles.cell({ active: true })}>
              <span className={styles.cellLabel}>
                {current ? cellLabel(current, "—") : "—"}
              </span>
              {current && (
                <span className={styles.cellMeta}>
                  Drag handle to place split · {formatDistance(current.length_m)}
                </span>
              )}
              {selectedSpan && splitDragRange && splitCutM != null && (
                <StretchDragHandle
                  trackRef={splitTrackRef}
                  minM={splitDragRange.minM}
                  maxM={splitDragRange.maxM}
                  valueM={splitCutM}
                  ariaLabel="Split position"
                  onChange={(d) => {
                    const next = Math.max(
                      splitDragRange.minM,
                      Math.min(splitDragRange.maxM, d),
                    );
                    setSplitCutM(next);
                    onSplitCutChange?.(next);
                  }}
                />
              )}
            </div>
            <div className={styles.cell({ dim: true })}>
              <span className={styles.cellLabel}>{cellLabel(next, "—")}</span>
            </div>
          </div>
        ) : (
          <div className={styles.stripSimple} aria-label="Stretch strip">
            <div
              className={styles.cell({
                dim: !prev,
                clickable: Boolean(prev) && !dirty,
              })}
              onClick={() => {
                if (!dirty && prev) session.goAdjacent(-1);
              }}
            >
              <span className={styles.cellLabel}>{cellLabel(prev, "—")}</span>
              {prev && (
                <span className={styles.cellMeta}>{formatDistance(prev.length_m)}</span>
              )}
            </div>
            <div className={styles.cell({ active: true })}>
              {showActionBar && (
                <div className={styles.actionBar} role="toolbar" aria-label="Stretch actions">
                  <button
                    type="button"
                    className={styles.actionBtn()}
                    title="Edit boundaries"
                    aria-label="Edit boundaries"
                    onClick={enterEdit}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn()}
                    title="Split"
                    aria-label="Split stretch"
                    disabled={!selectedSpan || !splitDragRange}
                    onClick={enterSplit}
                  >
                    Split
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn()}
                    title="Merge"
                    aria-label="Merge stretch"
                    disabled={!prev && !next}
                    onClick={enterMerge}
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn()}
                    title="Convert to segment"
                    aria-label="Convert to segment"
                    onClick={onOpenConvert}
                  >
                    Convert
                  </button>
                </div>
              )}
              <span className={styles.cellLabel}>
                {current ? cellLabel(current, SELECT_STRETCH_LABEL) : SELECT_STRETCH_LABEL}
              </span>
              {current && (
                <span className={styles.cellMeta}>
                  {formatDistance(current.length_m)} · {current.avg_grade_pct.toFixed(1)}%
                </span>
              )}
              {!current && (
                <span className={styles.cellMeta}>Use ← → or the list</span>
              )}
            </div>
            <div
              className={styles.cell({
                dim: !next,
                clickable: Boolean(next) && !dirty,
              })}
              onClick={() => {
                if (!dirty && next) session.goAdjacent(1);
              }}
            >
              <span className={styles.cellLabel}>{cellLabel(next, "—")}</span>
              {next && (
                <span className={styles.cellMeta}>{formatDistance(next.length_m)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {toolMode === "idle" && (
        <MutedText className={styles.hint}>
          ← → select stretch · Shift+←/→ merge · Esc cancel. Actions on the
          selected stretch: edit boundaries, split, merge, convert.
        </MutedText>
      )}
      {toolMode === "edit" && mergeNudge && (
        <div className={styles.nudgeToast} role="status">
          <p className={styles.nudgeText}>
            Stretch {stretchDisplayNumber(mergeNudge.shortIndex)} is only{" "}
            {formatDistance(mergeNudge.shortLengthM)} (min{" "}
            {formatDistance(minStretchM)}). Merge it with stretch{" "}
            {stretchDisplayNumber(mergeNudge.partnerIndex)}?
          </p>
          <div className={styles.nudgeActions}>
            <Button size="sm" type="button" onClick={applyBoundaryMergeNudge}>
              Merge {stretchDisplayNumber(mergeNudge.shortIndex)} +{" "}
              {stretchDisplayNumber(mergeNudge.partnerIndex)}
            </Button>
            <Button size="sm" type="button" onClick={() => setMergeNudge(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
      {toolMode === "edit" && !mergeNudge && (
        <MutedText className={styles.hint}>
          Drag the boundary grips — strip widths follow path length. Save when happy.
        </MutedText>
      )}
      {toolMode === "merge" && (
        <MutedText className={styles.hint}>
          Click previous or next stretch to merge into the selection.
        </MutedText>
      )}
      {toolMode === "split" && (
        <MutedText className={styles.hint}>
          Drag the handle (both sides stay at least {formatDistance(minStretchM)}
          ), then Save.
        </MutedText>
      )}
      {dirty && toolMode !== "split" && (
        <MutedText className={styles.hint}>
          Unsaved stretch edits. Save to keep, Cancel (Esc) to discard.
        </MutedText>
      )}

      <Modal open={convertOpen} onClose={onCloseConvert}>
        <ModalHeader title="Convert stretch to segment" onClose={onCloseConvert} />
        <div className={styles.convertRow}>
          <Input
            value={convertName}
            onChange={(event) => onConvertNameChange(event.target.value)}
            placeholder="Segment name"
            aria-label="New segment name"
          />
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={!convertName.trim() || convertBusy}
            onClick={onConfirmConvert}
          >
            Create segment
          </Button>
        </div>
      </Modal>
    </div>
  );
};
