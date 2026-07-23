export type LocationParts = {
  district?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  osm_value?: string | null;
  osm_key?: string | null;
  name?: string | null;
};

const trimOrNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const isPark = (parts: LocationParts): boolean =>
  parts.osm_key === "leisure" && parts.osm_value === "park";

export const pickLocationLabel = (parts: LocationParts): string | null => {
  if (isPark(parts)) {
    const parkName = trimOrNull(parts.name);
    if (parkName) return parkName;
  }

  return trimOrNull(parts.district) ?? trimOrNull(parts.city);
};