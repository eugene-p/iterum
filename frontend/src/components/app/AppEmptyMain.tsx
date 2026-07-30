import { useMemo } from "react";
import { useAppWorkspace } from "../../app/useAppWorkspaceContext";
import { useProfileContext } from "../../app/ProfileContext";
import {
  readLastOpened,
  resolveResumeTargets,
} from "../../lib/lastOpenedStorage";
import { ActivityUploadControl } from "../activities/ActivityUploadControl";
import { Button, MutedText } from "../ui";
import { AppBrand } from "./AppBrand";
import { appEmptyMainStyles } from "./AppEmptyMain.styles";
import { ProfileSelectScreen } from "../profiles/ProfileSelectScreen";

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
    <div className={appEmptyMainStyles.root}>
      <div className={appEmptyMainStyles.canvas}>
        <header className={appEmptyMainStyles.hero}>
          <AppBrand />
        </header>

        <div className={appEmptyMainStyles.grid}>
          <section className={appEmptyMainStyles.uploadSection} aria-label="Upload an activity">
            <div className={appEmptyMainStyles.sectionHead}>
              <h2 className={appEmptyMainStyles.title}>Upload an activity</h2>
              <MutedText>
                {canUpload
                  ? "Drop one or more route files here to add them to the current profile."
                  : "Choose a profile to enable uploading."}
              </MutedText>
            </div>
            {canUpload ? (
              <ActivityUploadControl
                variant="main"
                profileId={activeProfileId}
                className={appEmptyMainStyles.uploadControl}
                dropzoneClassName={appEmptyMainStyles.uploadDropzone}
                onRefresh={refreshLists}
                onComplete={(uploaded) => {
                  const last = uploaded[uploaded.length - 1];
                  if (last) navigation.goActivity(last.id);
                }}
              />
            ) : (
              <MutedText role="status">Select or create a profile to enable uploads.</MutedText>
            )}
          </section>

          <aside className={appEmptyMainStyles.sideColumn}>
            <section className={appEmptyMainStyles.profileSection} aria-label="Choose a profile">
              <ProfileSelectScreen embedded />
            </section>

            {hasResume && (
              <section
                className={appEmptyMainStyles.resumeSection}
                aria-label="Continue where you left off"
              >
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
          </aside>
        </div>
      </div>
    </div>
  );
};
