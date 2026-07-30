import {
  enrichStretch,
  type Stretch,
  type StretchResult,
  type StretchThresholds,
  type StoredStretch,
} from "./stretchSegmentation.js";

export type ManualStretchInput = {
  index?: number;
  start: { lat: number; lon: number; elevation_m: number };
  end: { lat: number; lon: number; elevation_m: number };
  length_m: number;
  name?: string | null;
};

const MIN_LENGTH_M = 1;

export const normalizeManualStretches = (
  inputs: ManualStretchInput[],
  thresholds: StretchThresholds,
  segmentLengthM?: number,
): StretchResult => {
  if (!inputs.length) {
    return {
      stretches: [],
      segment_length_m: segmentLengthM ?? 0,
      thresholds,
      reason: "No stretches provided",
    };
  }

  const stored: StoredStretch[] = inputs.map((input, index) => {
    if (
      !Number.isFinite(input.start.lat) ||
      !Number.isFinite(input.start.lon) ||
      !Number.isFinite(input.start.elevation_m) ||
      !Number.isFinite(input.end.lat) ||
      !Number.isFinite(input.end.lon) ||
      !Number.isFinite(input.end.elevation_m) ||
      !Number.isFinite(input.length_m) ||
      input.length_m < MIN_LENGTH_M
    ) {
      throw new Error(`Invalid stretch at index ${index}`);
    }
    const name =
      input.name != null && String(input.name).trim()
        ? String(input.name).trim()
        : null;
    return {
      index,
      start: {
        lat: input.start.lat,
        lon: input.start.lon,
        elevation_m: input.start.elevation_m,
      },
      end: {
        lat: input.end.lat,
        lon: input.end.lon,
        elevation_m: input.end.elevation_m,
      },
      length_m: input.length_m,
      name,
    };
  });

  const stretches: Stretch[] = stored.map((s) => enrichStretch(s, thresholds));
  const totalLength = stretches.reduce((sum, s) => sum + s.length_m, 0);

  return {
    stretches,
    segment_length_m: segmentLengthM ?? totalLength,
    thresholds,
  };
};
