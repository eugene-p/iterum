import { z } from "zod";

export const stretchKindSchema = z.enum(["climb", "flat", "descent"]);
export type StretchKind = z.infer<typeof stretchKindSchema>;

export const geoPointSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  elevation_m: z.number(),
});
export type GeoPoint = z.infer<typeof geoPointSchema>;

export const DEFAULT_STRETCH_THRESHOLDS = {
  climb_grade_pct: 3,
  descent_grade_pct: -3,
  grade_hysteresis_pct: 1,
  min_stretch_pct: 0.04,
  min_stretch_m: 50,
  max_stretch_pct: 0.2,
  max_stretch_m: 800,
  resample_spacing_m: 10,
  grade_window_m: 30,
} as const;

export const stretchThresholdsSchema = z.object({
  climb_grade_pct: z.coerce.number(),
  descent_grade_pct: z.coerce.number(),
  grade_hysteresis_pct: z.coerce.number(),
  min_stretch_pct: z.coerce.number(),
  min_stretch_m: z.coerce.number(),
  max_stretch_pct: z.coerce.number(),
  max_stretch_m: z.coerce.number(),
  resample_spacing_m: z.coerce.number(),
  grade_window_m: z.coerce.number(),
});
export type StretchThresholds = z.infer<typeof stretchThresholdsSchema>;

const stretchThresholdOverridesSchema = stretchThresholdsSchema.partial();

export const parseStretchThresholds = (input: unknown): StretchThresholds => {
  const parsed = stretchThresholdOverridesSchema.safeParse(input);
  if (!parsed.success) {
    return { ...DEFAULT_STRETCH_THRESHOLDS };
  }
  return { ...DEFAULT_STRETCH_THRESHOLDS, ...parsed.data };
};