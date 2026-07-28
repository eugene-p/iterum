import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { SegmentEditorDrawerFields } from "../../components/app/SegmentEditorDrawerFields";
import { Button } from "../../components/ui";
import { useSegmentEditor } from "../../hooks/useSegmentEditor";
import { useAppNavigation } from "../useAppNavigation";
import { useAppWorkspace } from "../useAppWorkspaceContext";
import { createSegmentScreenStyles } from "./CreateSegmentScreenContainer.styles";

const SEGMENT_EDITOR_FORM_ID = "create-segment-form";

export const CreateSegmentScreenContainer = () => {
  const { activityId: activityIdParam } = useParams();
  const parsedActivityId = Number.parseInt(activityIdParam ?? "", 10);
  const activityId =
    Number.isFinite(parsedActivityId) && parsedActivityId > 0 ? parsedActivityId : -1;
  const navigation = useAppNavigation();
  const { segments } = useAppWorkspace();

  const editorMode = useMemo(
    () => ({ kind: "create" as const, activityId }),
    [activityId],
  );

  const editor = useSegmentEditor({
    mode: editorMode,
    segments,
    enabled: activityId > 0,
  });

  if (activityId <= 0) return null;

  const handleSave = async () => {
    const savedId = await editor.saveSegment();
    if (savedId != null) navigation.goSegment(savedId, { replace: true });
  };

  const handleBack = () => {
    navigation.goActivity(activityId);
  };

  return (
    <div className={createSegmentScreenStyles.root}>
      <div className={createSegmentScreenStyles.header}>
        <button
          type="button"
          className={createSegmentScreenStyles.back}
          onClick={handleBack}
        >
          Back to activity
        </button>
        <span className={createSegmentScreenStyles.sep} aria-hidden="true">
          ·
        </span>
        <div className={createSegmentScreenStyles.headerLead}>
          <h2 className={createSegmentScreenStyles.title}>Create segment</h2>
        </div>
        <div className={createSegmentScreenStyles.actions}>
          <Button
            type="button"
            size="sm"
            className={createSegmentScreenStyles.actionBtn}
            onClick={handleBack}
            disabled={editor.loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={SEGMENT_EDITOR_FORM_ID}
            variant="primary"
            size="sm"
            className={createSegmentScreenStyles.actionBtn}
            disabled={editor.loading || !editor.screen.name.trim()}
          >
            Create
          </Button>
        </div>
      </div>
      <form
        id={SEGMENT_EDITOR_FORM_ID}
        className={createSegmentScreenStyles.form}
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
          onClearDraft={() => editor.dispatchEditor(editor.editorActions.clearDraft())}
          onRadiusChange={(radius) => editor.dispatchEditor(editor.editorActions.setRadius(radius))}
          onMatchThresholdChange={(matchThreshold) =>
            editor.dispatchEditor(editor.editorActions.setMatchThreshold(matchThreshold))
          }
          onMapClick={editor.onMapClick}
        />
      </form>
    </div>
  );
};
