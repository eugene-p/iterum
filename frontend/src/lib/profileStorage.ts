const ACTIVE_PROFILE_KEY = "iterum.active-profile-id";
const VIEW_SCOPE_KEY = "iterum.view-scope";

export const readActiveProfileId = (): number | null => {
  const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const writeActiveProfileId = (profileId: number) => {
  localStorage.setItem(ACTIVE_PROFILE_KEY, String(profileId));
};

export const readViewScope = (): number | "all" | null => {
  const raw = localStorage.getItem(VIEW_SCOPE_KEY);
  if (!raw) return null;
  if (raw === "all") return "all";
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const writeViewScope = (scope: number | "all") => {
  localStorage.setItem(VIEW_SCOPE_KEY, String(scope));
};

export const clearProfileStorage = () => {
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
  localStorage.removeItem(VIEW_SCOPE_KEY);
};