import { useProfileContext } from "../../app/ProfileContext";
import { sidebarListStyles } from "../AppSidebar/sidebarList.styles";
import { SidebarListButton } from "../AppSidebar";
import { LoadingState, Modal, ModalHeader } from "../ui";
import { profileModalStyles } from "./profileModalStyles";

type ProfileSwitchModalProps = {
  open: boolean;
  onClose: () => void;
  onAddProfile: () => void;
};

export const ProfileSwitchModal = ({ open, onClose, onAddProfile }: ProfileSwitchModalProps) => {
  const { profiles, ready, activeProfileId, selectProfile } = useProfileContext();

  const handleSelect = (profileId: number) => {
    selectProfile(profileId);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} panelClassName={profileModalStyles.panel}>
      <ModalHeader title="Switch profile" onClose={onClose} />
      <div className={profileModalStyles.body}>
        {!ready ? (
          <LoadingState message="Loading profiles…" />
        ) : (
          <ul className={sidebarListStyles.list}>
            {profiles.map((profile) => (
              <li key={profile.id}>
                <SidebarListButton
                  selected={profile.id === activeProfileId}
                  onClick={() => handleSelect(profile.id)}
                >
                  <div className={sidebarListStyles.itemName}>{profile.name}</div>
                </SidebarListButton>
              </li>
            ))}
            <li>
              <SidebarListButton onClick={onAddProfile}>
                <div className={sidebarListStyles.itemName}>Add profile</div>
                <div className={sidebarListStyles.itemMeta}>Create a new activity profile</div>
              </SidebarListButton>
            </li>
          </ul>
        )}
      </div>
    </Modal>
  );
};
