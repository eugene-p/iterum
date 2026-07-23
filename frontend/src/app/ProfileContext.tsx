import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearProfileStorage,
  readActiveProfileId,
  readViewScope,
  writeActiveProfileId,
  writeViewScope,
} from "../lib/profileStorage";
import { useProfilesQuery } from "../queries/profiles";
import type { Profile, ProfileViewScope, StretchThresholds } from "../types";

type ProfileContextValue = {
  ready: boolean;
  activeProfileId: number | null;
  viewScope: ProfileViewScope | null;
  profiles: Profile[];
  activeProfile: Profile | null;
  profileStretchDefaults: StretchThresholds | null;
  selectProfile: (profileId: number) => void;
  setViewScope: (scope: ProfileViewScope) => void;
  showAllProfiles: () => void;
  clearActiveProfile: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const profilesQuery = useProfilesQuery();
  const profiles = useMemo(() => profilesQuery.data ?? [], [profilesQuery.data]);

  const [activeProfileId, setActiveProfileId] = useState<number | null>(() =>
    readActiveProfileId(),
  );
  const [viewScope, setViewScopeState] = useState<ProfileViewScope | null>(() => readViewScope());

  useEffect(() => {
    if (!profiles.length) return;
    if (activeProfileId != null && profiles.some((p) => p.id === activeProfileId)) return;
    if (profiles.length === 1) {
      setActiveProfileId(profiles[0].id);
      setViewScopeState(profiles[0].id);
      writeActiveProfileId(profiles[0].id);
      writeViewScope(profiles[0].id);
    }
  }, [activeProfileId, profiles]);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [activeProfileId, profiles],
  );

  const effectiveViewScope = viewScope ?? activeProfileId;

  const selectProfile = useCallback((profileId: number) => {
    setActiveProfileId(profileId);
    setViewScopeState(profileId);
    writeActiveProfileId(profileId);
    writeViewScope(profileId);
  }, []);

  const setViewScope = useCallback((scope: ProfileViewScope) => {
    setViewScopeState(scope);
    writeViewScope(scope);
  }, []);

  const showAllProfiles = useCallback(() => {
    setViewScopeState("all");
    writeViewScope("all");
  }, []);

  const clearActiveProfile = useCallback(() => {
    setActiveProfileId(null);
    setViewScopeState(null);
    clearProfileStorage();
  }, []);

  const value = useMemo(
    (): ProfileContextValue => ({
      ready: profilesQuery.isSuccess,
      activeProfileId,
      viewScope: effectiveViewScope,
      profiles,
      activeProfile,
      profileStretchDefaults: activeProfile?.default_stretch_thresholds ?? null,
      selectProfile,
      setViewScope,
      showAllProfiles,
      clearActiveProfile,
    }),
    [
      activeProfile,
      activeProfileId,
      effectiveViewScope,
      profiles,
      profilesQuery.isSuccess,
      selectProfile,
      setViewScope,
      showAllProfiles,
      clearActiveProfile,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfileContext = () => {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfileContext must be used within ProfileProvider");
  return value;
};