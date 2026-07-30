import { useState } from "react";
import { useProfileContext } from "../../app/ProfileContext";
import { cn } from "../../lib/cn";
import { AppBrand } from "../app/AppBrand";
import { sidebarListStyles } from "../AppSidebar/sidebarList.styles";
import { LoadingState, Stack } from "../ui";
import { CreateProfileModal } from "./CreateProfileModal";
import { profileSelectStyles } from "./ProfileSelectScreen.styles";

type ProfileSelectScreenProps = {
  /** Embed the chooser in the app landing canvas instead of a full-page gate. */
  embedded?: boolean;
};

export const ProfileSelectScreen = ({ embedded = false }: ProfileSelectScreenProps) => {
  const { profiles, ready, activeProfileId, selectProfile } = useProfileContext();
  const [addOpen, setAddOpen] = useState(false);

  if (!ready) {
    const loading = <LoadingState message="Loading profiles…" />;
    return embedded ? loading : <div className={profileSelectStyles.root}>{loading}</div>;
  }

  const card = (
    <div className={profileSelectStyles.card(embedded)}>
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

      <Stack>
        <ul className={sidebarListStyles.list}>
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className={cn(
                sidebarListStyles.listItem(false),
                profile.id === activeProfileId && "border-accent bg-accent/10",
              )}
              onClick={() => selectProfile(profile.id)}
            >
              <div className={sidebarListStyles.itemName}>
                {profile.name}
                {profile.id === activeProfileId && " (current)"}
              </div>
            </li>
          ))}
          <li
            className={sidebarListStyles.listItem(false)}
            onClick={() => setAddOpen(true)}
          >
            <div className={sidebarListStyles.itemName}>Add profile</div>
            <div className={sidebarListStyles.itemMeta}>Create a new activity profile</div>
          </li>
        </ul>
      </Stack>
    </div>
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
