import { useMemo } from "react";
import { useAppWorkspace } from "../../app/useAppWorkspaceContext";
import { useProfileContext } from "../../app/ProfileContext";
import {
  readLastOpened,
  resolveResumeTargets,
} from "../../lib/lastOpenedStorage";
import { ActivityUploadControl } from "../activities/ActivityUploadControl";
import { Button, EmptySurface, MutedText, Stack } from "../ui";
import { AppBrand } from "./AppBrand";
import { appEmptyMainStyles } from "./AppEmptyMain.styles";

export const AppEmptyMain = () => {
  const { activities, segments, refreshLists, navigation } = useAppWorkspace();
  const { activeProfileId } = useProfileContext();

  const resume = useMemo(
    () => resolveResumeTargets(readLastOpened(), segments, activities),
    [activities, segments],
  );

  const resumeSegment = resume.segment;
  const resumeActivity = resume.activity;
  const hasResume = resumeSegment != null || resumeActivity != null;
  const canUpload = activeProfileId != null;

  return (
    <EmptySurface className={appEmptyMainStyles.root}>
      <AppBrand />

      {hasResume && (
        <section className={appEmptyMainStyles.section} aria-label="Continue where you left off">
          <h2 className={appEmptyMainStyles.title}>Continue where you left off</h2>
          <div className={appEmptyMainStyles.resumeList}>
            {resumeSegment && (
              <Button
                className={appEmptyMainStyles.resumeButton}
                onClick={() => navigation.goSegment(resumeSegment.id)}
              >
                Segment: {resumeSegment.name}
              </Button>
            )}
            {resumeActivity && (
              <Button
                className={appEmptyMainStyles.resumeButton}
                onClick={() => navigation.goActivity(resumeActivity.id)}
              >
                Activity: {resumeActivity.name}
              </Button>
            )}
          </div>
        </section>
      )}

      <section className={appEmptyMainStyles.section} aria-label="Upload an activity">
        <Stack className="items-center gap-2">
          <h2 className={appEmptyMainStyles.title}>Upload an activity</h2>
          <MutedText>
            Start by adding a route file, or pick a segment from the sidebar.
          </MutedText>
        </Stack>
        {canUpload ? (
          <ActivityUploadControl
            variant="main"
            profileId={activeProfileId}
            onRefresh={refreshLists}
            onComplete={(uploaded) => {
              const last = uploaded[uploaded.length - 1];
              if (last) navigation.goActivity(last.id);
            }}
          />
        ) : (
          <MutedText>Select a profile to upload activities.</MutedText>
        )}
      </section>
    </EmptySurface>
  );
};
