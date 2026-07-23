export type TaggingPoint = {
  lat: number;
  lon: number;
  elevation_m: number | null;
  speed_mps?: number | null;
  timestamp?: Date | string | null;
};