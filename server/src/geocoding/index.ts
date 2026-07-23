import { createPhotonGeocoder } from "./photonGeocoder.js";
import type { ReverseGeocoder } from "./types.js";

export type { GeocodedLocation, ReverseGeocoder } from "./types.js";
export { coordCacheKey } from "./coordCacheKey.js";
export { createPhotonGeocoder } from "./photonGeocoder.js";
export { parsePhotonReverseResponse } from "./parsePhotonResponse.js";
export { pickLocationLabel } from "./pickLocationLabel.js";

export type GeocoderProvider = "photon";

export const createReverseGeocoder = (
  provider: GeocoderProvider = (process.env.GEOCODER_PROVIDER as GeocoderProvider | undefined) ?? "photon",
): ReverseGeocoder => {
  switch (provider) {
    case "photon":
      return createPhotonGeocoder();
    default:
      throw new Error(`Unknown geocoder provider: ${provider satisfies never}`);
  }
};

let defaultGeocoder: ReverseGeocoder | null = null;

export const getDefaultReverseGeocoder = (): ReverseGeocoder => {
  if (!defaultGeocoder) {
    defaultGeocoder = createReverseGeocoder();
  }
  return defaultGeocoder;
};

export const setReverseGeocoderForTests = (geocoder: ReverseGeocoder | null): void => {
  defaultGeocoder = geocoder;
};