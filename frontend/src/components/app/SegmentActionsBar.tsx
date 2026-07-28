import { useMemo, useState } from "react";
import { appStyles } from "../../App.styles";
import type { Segment, SegmentCompare, SegmentPass } from "../../types";
import { Button, DropdownMenu } from "../ui";
import { StretchSourceControl } from "../segments/StretchPanel/StretchSourceControl";
import { SegmentEditorDrawer } from "./SegmentEditorDrawer";
import { SegmentReverseDrawer } from "./SegmentReverseDrawer";

type SegmentActionsBarProps = {
  segment: Segment;
  comparison: SegmentCompare | null;
  loading: boolean;
  editError: string | null;
  onSegmentSaved: (segmentId: number) => void;
  onComparePasses: () => void;
  onReverse: (segmentId: number, name: string) => Promise<boolean>;
  onRescan: () => void;
  onDelete: () => void;
  stretchSourcePassId?: number | null;
  stretchSourceActivityId?: number | null;
  onSetStretchSource?: (activityId: number) => void;
};

export const SegmentActionsBar = ({
  segment,
  comparison,
  loading,
  editError,
  onSegmentSaved,
  onComparePasses,
  onReverse,
  onRescan,
  onDelete,
  stretchSourcePassId,
  stretchSourceActivityId,
  onSetStretchSource,
}: SegmentActionsBarProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const compareDisabled = loading || !comparison?.reference_points?.length;

  const matchedPasses = useMemo(
    () => (comparison?.passes ?? []).filter((pass): pass is SegmentPass => pass.matched),
    [comparison],
  );
  const canChangeSource =
    Boolean(onSetStretchSource) && matchedPasses.length > 1 && !loading;

  const actionGroups = useMemo(
    () => [
      {
        items: [
          { id: "edit", label: "Edit", onSelect: () => setEditOpen(true), disabled: loading },
          { id: "reverse", label: "Reverse", onSelect: () => setReverseOpen(true), disabled: loading },
          {
            id: "change-source",
            label: "Change source",
            onSelect: () => setSourceOpen(true),
            disabled: !canChangeSource,
          },
        ],
      },
      {
        items: [
          { id: "rescan", label: "Re-scan", onSelect: onRescan, disabled: loading },
          {
            id: "delete",
            label: "Delete",
            onSelect: onDelete,
            disabled: loading,
            variant: "danger" as const,
          },
        ],
      },
    ],
    [canChangeSource, loading, onDelete, onRescan],
  );

  return (
    <>
      <div className={appStyles.segmentActions}>
        <Button variant="primary" size="sm" onClick={onComparePasses} disabled={compareDisabled}>
          Compare passes
        </Button>
        <DropdownMenu triggerLabel="Actions" groups={actionGroups} disabled={loading} />
      </div>
      <SegmentEditorDrawer
        open={editOpen}
        target={{ kind: "edit", segment }}
        loading={loading}
        onClose={() => setEditOpen(false)}
        onSaved={(segmentId) => {
          setEditOpen(false);
          onSegmentSaved(segmentId);
        }}
      />
      <SegmentReverseDrawer
        open={reverseOpen}
        segment={segment}
        loading={loading}
        error={editError}
        onClose={() => setReverseOpen(false)}
        onCreate={(segmentId, name) => {
          void onReverse(segmentId, name).then((created) => {
            if (created) setReverseOpen(false);
          });
        }}
      />
      {onSetStretchSource ? (
        <StretchSourceControl
          open={sourceOpen}
          onClose={() => setSourceOpen(false)}
          passes={matchedPasses}
          stretchSourcePassId={stretchSourcePassId}
          stretchSourceActivityId={stretchSourceActivityId}
          onSetStretchSource={onSetStretchSource}
          loading={loading}
        />
      ) : null}
    </>
  );
};
