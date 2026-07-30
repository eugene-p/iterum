import { useMemo } from "react";
import { useAppWorkspace } from "../../app/useAppWorkspaceContext";
import { useProfileContext } from "../../app/ProfileContext";
import {
  readLastOpened,
  resolveResumeTargets,
} from "../../lib/lastOpenedStorage";
import { ActivityUploadControl } from "../activities/ActivityUploadControl";
import { SidebarListButton } from "../AppSidebar";
import { sidebarListStyles } from "../AppSidebar/sidebarList.styles";
import { Card, MutedText } from "../ui";
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
        <div className={appEmptyMainStyles.grid}>
          <Card
            className={appEmptyMainStyles.uploadSection}
            aria-label="Upload an activity"
            headerClassName={appEmptyMainStyles.sectionHead}
            bodyClassName={appEmptyMainStyles.uploadBody}
            header={
              <>
              <h2 className={appEmptyMainStyles.title}>Upload an activity</h2>
              <MutedText>
                {canUpload
                  ? "Drop one or more route files here to add them to the current profile."
                  : "Choose a profile to enable uploading."}
              </MutedText>
              </>
            }
          >
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
          </Card>

          <aside className={appEmptyMainStyles.sideColumn}>
            <section className={appEmptyMainStyles.profileSection} aria-label="Choose a profile">
              <ProfileSelectScreen embedded />
            </section>

            {hasResume && (
              <Card
                className={appEmptyMainStyles.resumeSection}
                aria-label="Continue where you left off"
                bodyClassName={appEmptyMainStyles.resumeBody}
                header={
                  <h2 className={appEmptyMainStyles.title}>Continue where you left off</h2>
                }
              >
                <ul className={sidebarListStyles.list}>
                  {resumeSegment && (
                    <li>
                      <SidebarListButton onClick={() => navigation.goSegment(resumeSegment.id)}>
                        <div className={sidebarListStyles.itemName}>{resumeSegment.name}</div>
                        <div className={sidebarListStyles.itemMeta}>Segment</div>
                      </SidebarListButton>
                    </li>
                  )}
                  {resumeActivity && (
                    <li>
                      <SidebarListButton onClick={() => navigation.goActivity(resumeActivity.id)}>
                        <div className={sidebarListStyles.itemName}>{resumeActivity.name}</div>
                        <div className={sidebarListStyles.itemMeta}>Activity</div>
                      </SidebarListButton>
                    </li>
                  )}
                </ul>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
