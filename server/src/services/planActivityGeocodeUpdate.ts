import { deriveDisplayName } from "../tagging/deriveDisplayName.js";

export type ActivityGeocodePlanInput = {
  currentName: string;
  currentLocation: string | null;
  tags: readonly string[];
  geocodedLocation: string | null;
};

export type ActivityGeocodePlan =
  | { action: "skip"; reason: "already_has_location" | "no_geocode_result" }
  | { action: "update"; location: string; name: string };

/**
 * Decide whether a reverse-geocode result should patch activity name/location.
 * Pure: no I/O — safe to unit test without DB or Photon.
 */
export const planActivityGeocodeUpdate = (
  input: ActivityGeocodePlanInput,
): ActivityGeocodePlan => {
  if (input.currentLocation) {
    return { action: "skip", reason: "already_has_location" };
  }
  if (!input.geocodedLocation) {
    return { action: "skip", reason: "no_geocode_result" };
  }

  const name =
    deriveDisplayName({
      tags: input.tags,
      location: input.geocodedLocation,
    }) ?? input.currentName;

  return {
    action: "update",
    location: input.geocodedLocation,
    name,
  };
};
