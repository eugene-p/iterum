import type { DistanceUnit, TrackPoint } from "../types";
import { haversineM } from "./geo/haversine";

const M_PER_MILE = 1609.344;

export type ActivitySplit = {
  index: number;
  distance_m: number;
  duration_sec: number | null;
  avg_hr: number | null;
};

export const splitIntervalM = (
  profile: Pick<
    { distance_unit: DistanceUnit; split_distance_m: number },
    "distance_unit" | "split_distance_m"
  > | null | undefined,
): number => {
  return profile?.split_distance_m ?? 1_000;
};

export const splitUnitLabel = (unit: DistanceUnit | null | undefined): string =>
  unit === "mi" ? "mi" : "km";

const cumulativeDistanceM = (points: readonly TrackPoint[]): number[] => {
  if (points.length === 0) return [];
  const source = points.map((point) => point.distance_m);
  const sourceStart = source[0];
  const canUseSource =
    sourceStart != null &&
    source.every(
      (distance, index) =>
        distance != null && Number.isFinite(distance) && (index === 0 || distance >= source[index - 1]!),
    );
  if (canUseSource) return source.map((distance) => distance! - sourceStart);

  const cumulative = [0];
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    cumulative.push(
      cumulative[index - 1] + haversineM(previous.lat, previous.lon, current.lat, current.lon),
    );
  }
  return cumulative;
};

const timeAtDistance = (points: readonly TrackPoint[], cumulative: readonly number[], target: number) => {
  for (let index = 1; index < cumulative.length; index++) {
    if (cumulative[index] < target) continue;
    const previousTime = points[index - 1].timestamp ? new Date(points[index - 1].timestamp!).getTime() : NaN;
    const currentTime = points[index].timestamp ? new Date(points[index].timestamp!).getTime() : NaN;
    const distance = cumulative[index] - cumulative[index - 1];
    if (!Number.isFinite(previousTime) || !Number.isFinite(currentTime) || distance <= 0) return null;
    return previousTime + ((target - cumulative[index - 1]) / distance) * (currentTime - previousTime);
  }
  return null;
};

const averageHr = (
  points: readonly TrackPoint[],
  cumulative: readonly number[],
  start: number,
  end: number,
): number | null => {
  const values = points
    .filter((_, index) => cumulative[index] >= start && cumulative[index] <= end)
    .map((point) => point.heart_rate)
    .filter((value): value is number => value != null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};

/**
 * Derives even distance splits from the imported track, falling back to GPS path
 * distance when an import did not include cumulative distance samples.
 */
export const buildActivitySplits = (
  points: readonly TrackPoint[],
  intervalM: number,
): ActivitySplit[] => {
  if (points.length < 2 || !Number.isFinite(intervalM) || intervalM <= 0) return [];
  const cumulative = cumulativeDistanceM(points);
  const totalDistance = cumulative[cumulative.length - 1] ?? 0;
  if (totalDistance < 1) return [];

  const boundaries = [0];
  for (let distance = intervalM; distance < totalDistance - 1; distance += intervalM) {
    boundaries.push(distance);
  }
  boundaries.push(totalDistance);

  return boundaries.slice(1).map((end, index) => {
    const start = boundaries[index];
    const startTime = timeAtDistance(points, cumulative, start);
    const endTime = timeAtDistance(points, cumulative, end);
    return {
      index: index + 1,
      distance_m: end - start,
      duration_sec: startTime != null && endTime != null ? (endTime - startTime) / 1000 : null,
      avg_hr: averageHr(points, cumulative, start, end),
    };
  });
};

export const formatSplitDistance = (distanceM: number, unit: DistanceUnit): string => {
  if (unit === "mi") return `${(distanceM / M_PER_MILE).toFixed(2)} mi`;
  return `${(distanceM / 1_000).toFixed(2)} km`;
};

/** Concise interval label for settings, e.g. "1 km", "0.5 km", or "1.7 mi". */
export const formatSplitInterval = (distanceM: number, unit: DistanceUnit): string => {
  const value = unit === "mi" ? distanceM / M_PER_MILE : distanceM / 1_000;
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} ${unit}`;
};

export const formatSplitPace = (
  durationSec: number | null,
  distanceM: number,
  unit: DistanceUnit,
): string => {
  if (durationSec == null || durationSec <= 0 || distanceM <= 0) return "—";
  const unitDistance = unit === "mi" ? distanceM / M_PER_MILE : distanceM / 1_000;
  if (unitDistance <= 0) return "—";
  const seconds = durationSec / unitDistance;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.round(seconds % 60).toString().padStart(2, "0")} /${unit}`;
};
