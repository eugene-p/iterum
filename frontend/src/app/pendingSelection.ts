import type { AppLocation } from "./appRoutes";
import type { PendingSelection } from "./appShellTypes";

export const locationMatchesPending = (
  pending: PendingSelection,
  location: AppLocation,
): boolean => {
  if (pending.kind === "activity" && location.type === "activity") {
    return location.activityId === pending.id;
  }
  if (pending.kind === "segment" && location.type === "segment") {
    return location.segmentId === pending.id;
  }
  return false;
};

/** True while main should show a loader instead of the previous entity. */
export const shouldShowPendingSelection = (
  pending: PendingSelection | null,
  location: AppLocation,
): boolean => {
  if (pending == null) return false;
  return !locationMatchesPending(pending, location);
};

/**
 * Clear when the target route has landed, or when navigation settled somewhere
 * else (back/home/other link). Keep pending while still on `fromPathname` so a
 * deferred route update from a list page is not cleared immediately.
 */
export const shouldClearPendingSelection = (
  pending: PendingSelection | null,
  location: AppLocation,
  pathname: string,
): boolean => {
  if (pending == null) return false;
  if (locationMatchesPending(pending, location)) return true;
  return pathname !== pending.fromPathname;
};

export type BeginPendingPlan =
  | { action: "set"; pending: PendingSelection }
  | { action: "clear" }
  | { action: "none" };

/**
 * Plan the shell update when the user picks an entity from the sidebar.
 * Re-selecting the already-visible entity clears any in-flight pending so the
 * main loader cannot stick after an abandoned switch.
 */
export const planBeginPendingSelection = (
  target: Pick<PendingSelection, "kind" | "id">,
  location: AppLocation,
  pathname: string,
  currentPending: PendingSelection | null,
): BeginPendingPlan => {
  const pending: PendingSelection = { ...target, fromPathname: pathname };
  if (locationMatchesPending(pending, location)) {
    return currentPending != null ? { action: "clear" } : { action: "none" };
  }
  return { action: "set", pending };
};
