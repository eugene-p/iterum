import { useState } from "react";
import { useProfileContext } from "../../app/ProfileContext";
import { sidebarListStyles } from "../AppSidebar/sidebarList.styles";
import { Stack, Switch } from "../ui";
import { CreateProfileModal } from "./CreateProfileModal";
import { ProfileEditDrawer } from "./ProfileEditDrawer";
import { ProfileSwitchModal } from "./ProfileSwitchModal";
import { profileSidebarStyles } from "./profileSidebar.styles";

type ProfileModal = "edit" | "switch" | "add" | null;

export const ProfileSidebarPanel = () => {
  const { activeProfile, viewScope, selectProfile, showAllProfiles } = useProfileContext();
  const [modal, setModal] = useState<ProfileModal>(null);

  const scopedToProfile = viewScope !== "all";
  const closeModal = () => setModal(null);

  const handleScopeChange = (checked: boolean) => {
    if (!activeProfile) return;
    if (checked) selectProfile(activeProfile.id);
    else showAllProfiles();
  };

  return (
    <>
      <div className={profileSidebarStyles.root}>
        <Stack>
          <ul className={sidebarListStyles.list}>
            <li className={profileSidebarStyles.statusRow}>
              <div className={sidebarListStyles.itemName}>
                {activeProfile?.name ?? "—"}
              </div>
              {activeProfile && (
                <Switch
                  size="sm"
                  labelPosition="end"
                  className={profileSidebarStyles.scopeCheck}
                  checked={scopedToProfile}
                  onChange={(e) => handleScopeChange(e.target.checked)}
                  label="Scope activities to this profile"
                />
              )}
            </li>

            {activeProfile && (
              <li
                className={sidebarListStyles.listItem(false)}
                onClick={() => setModal("edit")}
              >
                <div className={sidebarListStyles.itemName}>Edit profile</div>
                <div className={sidebarListStyles.itemMeta}>
                  Name, stretch defaults, delete
                </div>
              </li>
            )}

            <li
              className={sidebarListStyles.listItem(false)}
              onClick={() => setModal("switch")}
            >
              <div className={sidebarListStyles.itemName}>Switch profile</div>
              <div className={sidebarListStyles.itemMeta}>Choose a different profile</div>
            </li>

            <li
              className={sidebarListStyles.listItem(false)}
              onClick={() => setModal("add")}
            >
              <div className={sidebarListStyles.itemName}>Add profile</div>
              <div className={sidebarListStyles.itemMeta}>Create a new activity profile</div>
            </li>
          </ul>
        </Stack>
      </div>

      {activeProfile && (
        <ProfileEditDrawer
          open={modal === "edit"}
          profile={activeProfile}
          onClose={closeModal}
        />
      )}

      <ProfileSwitchModal
        open={modal === "switch"}
        onClose={closeModal}
        onAddProfile={() => setModal("add")}
      />

      <CreateProfileModal
        open={modal === "add"}
        onClose={closeModal}
        onCreated={(profileId) => {
          selectProfile(profileId);
          closeModal();
        }}
      />
    </>
  );
};