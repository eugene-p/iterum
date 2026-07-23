import { pickLocationLabel, type LocationParts } from "./pickLocationLabel.js";
import type { GeocodedLocation } from "./types.js";

type PhotonFeature = {
  properties?: LocationParts;
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

export const parsePhotonReverseResponse = (json: unknown): GeocodedLocation | null => {
  const features = (json as PhotonResponse).features;
  if (!Array.isArray(features) || features.length === 0) return null;

  const props = features[0]?.properties;
  if (!props) return null;

  const label = pickLocationLabel(props);
  if (!label) return null;

  const trimOrNull = (value: string | null | undefined): string | null => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  return {
    label,
    district: trimOrNull(props.district),
    city: trimOrNull(props.city),
    state: trimOrNull(props.state),
    country: trimOrNull(props.country),
  };
};