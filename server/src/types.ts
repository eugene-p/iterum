export interface ParsedPoint {
  timestamp: Date | null;
  lat: number;
  lon: number;
  elevationM: number | null;
  heartRate: number | null;
  speedMps: number | null;
  distanceM: number | null;
}

export interface ParsedActivity {
  name: string;
  sport: string | null;
  startedAt: Date | null;
  durationSec: number | null;
  distanceM: number | null;
  avgHr: number | null;
  maxHr: number | null;
  points: ParsedPoint[];
}

export interface SegmentMatch {
  matched: boolean;
  reason?: string;
  startIndex?: number;
  endIndex?: number;
  durationSec?: number | null;
  distanceM?: number | null;
  avgSpeedKmh?: number | null;
  maxSpeedKmh?: number | null;
  avgHr?: number | null;
  maxHr?: number | null;
  elevationGainM?: number | null;
}