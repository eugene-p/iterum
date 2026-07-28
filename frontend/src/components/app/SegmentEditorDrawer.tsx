import { useMemo } from "react";
import type { Segment } from "../../types";
import { useAppWorkspace } from "../../app/useAppWorkspaceContext";
import { useSegmentEditor } from "../../hooks/useSegmentEditor";
import { Button, Drawer } from "../ui";
import { entityEditDrawerStyles } from "./entityEditDrawerStyles";
import { SegmentEditorDrawerFields } from "./SegmentEditorDrawerFields";

const SEGMENT_EDITOR_FORM_ID = "segment-editor-form";

export type SegmentEditorDrawerTarget = { kind: "edit"; segment: Segment };

type SegmentEditorDrawerProps = {
  open: boolean;
  target: SegmentEditorDrawerTarget;
  loading: boolean;
  onClose: () => void;
  onSaved: (segmentId: number) => void;
};

export const SegmentEditorDrawer = ({
  open,
  target,
  loading,
  onClose,
  onSaved,
}: SegmentEditorDrawerProps) => {
  const { segments } = useAppWorkspace();
  const editorMode = useMemo(
    () => ({
      kind: "edit" as const,
      activityId: target.segment.source_activity_id,
      segmentId: target.segment.id,
    }),
    [target.segment.id, target.segment.source_activity_id],
  );
  const editor = useSegmentEditor({
    mode: editorMode,
    segments,
    enabled: open,
  });

  const handleSave = async () => {
    const savedId = await editor.saveSegment();
    if (savedId != null) onSaved(savedId);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit segment"
      size="map"
      bodyClassName={entityEditDrawerStyles.mapDrawerBody}
      footer={
        <div className={entityEditDrawerStyles.footerActions}>
          <Button type="button" onClick={onClose} disabled={loading || editor.loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={SEGMENT_EDITOR_FORM_ID}
            variant="primary"
            disabled={loading || editor.loading || !editor.screen.name.trim()}
          >
            Save
          </Button>
        </div>
      }
    >
      <form
        id={SEGMENT_EDITOR_FORM_ID}
        className={entityEditDrawerStyles.mapDrawerForm}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <SegmentEditorDrawerFields
          segmentEditor={editor.screen.mode}
          form={{
            notice: editor.screen.notice,
            name: editor.screen.name,
            pickMode: editor.screen.pickMode,
            draft: editor.screen.draft,
            radius: editor.screen.radius,
            matchThreshold: editor.screen.matchThreshold,
            error: editor.screen.error,
          }}
          map={{
            routes: editor.mapRoutes,
            parentSegmentHighlight: editor.parentSegmentHighlight,
            draftHighlightPoints: editor.draftHighlightPoints,
          }}
          selectedSegment={editor.segmentEntity}
          onNameChange={(name) => editor.dispatchEditor(editor.editorActions.setName(name))}
          onPickStart={() => {
            editor.dispatchEditor(
              editor.editorActions.setPickMode("start", editor.pickModeNotice("start")),
            );
          }}
          onPickEnd={() => {
            editor.dispatchEditor(
              editor.editorActions.setPickMode("end", editor.pickModeNotice("end")),
            );
          }}
          onCloseLoop={() => editor.closeLoop()}
          onClearDraft={() => editor.dispatchEditor(editor.editorActions.clearDraft())}
          onRadiusChange={(radius) => editor.dispatchEditor(editor.editorActions.setRadius(radius))}
          onMatchThresholdChange={(matchThreshold) =>
            editor.dispatchEditor(editor.editorActions.setMatchThreshold(matchThreshold))
          }
          onMapClick={editor.onMapClick}
        />
      </form>
    </Drawer>
  );
};
