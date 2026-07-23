export type GeocodedLocation = {
  label: string;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

export type ReverseGeocoder = {
  readonly provider: string;
  reverseGeocode: (coords: { lat: number; lon: number }) => Promise<GeocodedLocation | null>;
};