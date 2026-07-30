import { useState } from "react";
import { useProfileContext } from "../../app/ProfileContext";
import { cn } from "../../lib/cn";
import { AppBrand } from "../app/AppBrand";
import { sidebarListStyles } from "../AppSidebar/sidebarList.styles";
import { SidebarListButton } from "../AppSidebar";
import { Card, LoadingState, Stack, Switch } from "../ui";
import { CreateProfileModal } from "./CreateProfileModal";
import { profileSelectStyles } from "./ProfileSelectScreen.styles";

type ProfileSelectScreenProps = {
  /** Embed the chooser in the app landing canvas instead of a full-page gate. */
  embedded?: boolean;
};

export const ProfileSelectScreen = ({ embedded = false }: ProfileSelectScreenProps) => {
  const {
    profiles,
    ready,
    activeProfileId,
    activeProfile,
    viewScope,
    selectProfile,
    showAllProfiles,
  } = useProfileContext();
  const [addOpen, setAddOpen] = useState(false);
  const scopedToProfile = viewScope !== "all";

  const handleScopeChange = (checked: boolean) => {
    if (!activeProfile) return;
    if (checked) selectProfile(activeProfile.id);
    else showAllProfiles();
  };

  if (!ready) {
    const loading = <LoadingState message="Loading profiles…" />;
    return embedded ? loading : <div className={profileSelectStyles.root}>{loading}</div>;
  }

  const card = (
    <Card
      className={profileSelectStyles.card(embedded)}
      bodyClassName={profileSelectStyles.body}
      header={
        <>
        {!embedded && (
          <div className={profileSelectStyles.brand}>
            <AppBrand />
          </div>
        )}
        <h2 className={profileSelectStyles.title}>
          {activeProfileId == null ? "Choose a profile" : "Profiles"}
        </h2>
        <p className={profileSelectStyles.subtitle}>
          {activeProfileId == null
            ? "Activities belong to a profile. Segments are shared across profiles."
            : "Switch profiles or create another activity profile."}
        </p>
        {embedded && activeProfile && (
          <Switch
            size="sm"
            labelPosition="end"
            className={profileSelectStyles.scopeCheck}
            checked={scopedToProfile}
            onChange={(event) => handleScopeChange(event.target.checked)}
            label="Scope activities to this profile"
          />
        )}
        </>
      }
    >

      <Stack>
        <ul className={sidebarListStyles.list}>
          {profiles.map((profile) => (
            <li key={profile.id}>
              <SidebarListButton
                selected={profile.id === activeProfileId}
                className={cn(profile.id === activeProfileId && "border-accent bg-accent/10")}
                onClick={() => selectProfile(profile.id)}
              >
                <div className={sidebarListStyles.itemName}>
                  {profile.name}
                  {profile.id === activeProfileId && " (current)"}
                </div>
              </SidebarListButton>
            </li>
          ))}
          <li>
            <SidebarListButton onClick={() => setAddOpen(true)}>
              <div className={sidebarListStyles.itemName}>Add profile</div>
              <div className={sidebarListStyles.itemMeta}>Create a new activity profile</div>
            </SidebarListButton>
          </li>
        </ul>
      </Stack>
    </Card>
  );

  return (
    <>
      {embedded ? card : <div className={profileSelectStyles.root}>{card}</div>}
      <CreateProfileModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(profileId) => selectProfile(profileId)}
      />
    </>
  );
};
