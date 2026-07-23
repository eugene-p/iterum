import { useState } from "react";
import { useProfileContext } from "../../app/ProfileContext";
import { sidebarListStyles } from "../AppSidebar/sidebarList.styles";
import { LoadingState, Stack } from "../ui";
import { CreateProfileModal } from "./CreateProfileModal";
import { profileSelectStyles } from "./ProfileSelectScreen.styles";

export const ProfileSelectScreen = () => {
  const { profiles, ready, selectProfile } = useProfileContext();
  const [addOpen, setAddOpen] = useState(false);

  if (!ready) {
    return (
      <div className={profileSelectStyles.root}>
        <LoadingState message="Loading profiles…" />
      </div>
    );
  }

  return (
    <div className={profileSelectStyles.root}>
      <div className={profileSelectStyles.card}>
        <h1 className={profileSelectStyles.title}>Choose a profile</h1>
        <p className={profileSelectStyles.subtitle}>
          Activities belong to a profile. Segments are shared across profiles.
        </p>

        <Stack>
          <ul className={sidebarListStyles.list}>
            {profiles.map((profile) => (
              <li
                key={profile.id}
                className={sidebarListStyles.listItem(false)}
                onClick={() => selectProfile(profile.id)}
              >
                <div className={sidebarListStyles.itemName}>{profile.name}</div>
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

      <CreateProfileModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(profileId) => selectProfile(profileId)}
      />
    </div>
  );
};