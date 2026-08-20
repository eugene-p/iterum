import { z } from "zod";
import { parseStretchThresholds, stretchThresholdsSchema } from "../stretch.js";

const coordinateSchema = z.coerce.number().finite();

export const listSegmentsQuerySchema = z.object({
  profile_id: z
    .union([z.literal("all"), z.coerce.number().int().positive()])
    .optional(),
});
export type ListSegmentsQuery = z.infer<typeof listSegmentsQuerySchema>;

export const createSegmentBodySchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  source_activity_id: z.coerce.number().int().positive(),
  start_index: z.coerce.number().int().nonnegative(),
  end_index: z.coerce.number().int().nonnegative(),
  start_lat: coordinateSchema,
  start_lon: coordinateSchema,
  end_lat: coordinateSchema,
  end_lon: coordinateSchema,
  radius_m: z.coerce.number().positive().optional(),
  match_threshold: z.coerce.number().min(0).max(1).optional(),
});
export type CreateSegmentBody = z.infer<typeof createSegmentBodySchema>;

export const updateSegmentBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().nullable().optional(),
    start_lat: coordinateSchema.optional(),
    start_lon: coordinateSchema.optional(),
    end_lat: coordinateSchema.optional(),
    end_lon: coordinateSchema.optional(),
    radius_m: z.coerce.number().positive().optional(),
    match_threshold: z.coerce.number().min(0).max(1).optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field is required",
  });
export type UpdateSegmentBody = z.infer<typeof updateSegmentBodySchema>;

export const reverseSegmentBodySchema = z.object({
  name: z.string().optional(),
});
export type ReverseSegmentBody = z.infer<typeof reverseSegmentBodySchema>;

export const segmentCompareQuerySchema = z
  .object({
    stretch_source_activity_id: z.coerce.number().int().positive().optional(),
    climb_grade_pct: z.coerce.number().optional(),
    descent_grade_pct: z.coerce.number().optional(),
    grade_hysteresis_pct: z.coerce.number().optional(),
    min_stretch_pct: z.coerce.number().optional(),
    min_stretch_m: z.coerce.number().optional(),
    max_stretch_pct: z.coerce.number().optional(),
    max_stretch_m: z.coerce.number().optional(),
    resample_spacing_m: z.coerce.number().optional(),
    grade_window_m: z.coerce.number().optional(),
  })
  .transform((query) => {
    const {
      stretch_source_activity_id: stretchSourceActivityId,
      ...thresholdFields
    } = query;
    const hasThresholdOverride = Object.values(thresholdFields).some(
      (value) => value !== undefined,
    );
    return {
      stretchSourceActivityId,
      thresholds: hasThresholdOverride
        ? parseStretchThresholds(thresholdFields)
        : undefined,
    };
  });
export type SegmentCompareQuery = z.infer<typeof segmentCompareQuerySchema>;

export const segmentBaselinesQuerySchema = z
  .object({
    activity_id: z.coerce.number().int().positive().optional(),
    pass: z.coerce.number().int().positive().optional(),
    activity_segment_match_id: z.coerce.number().int().positive().optional(),
  })
  .refine((query) => query.pass === undefined || query.activity_id !== undefined, {
    message: "pass requires activity_id",
  });
export type SegmentBaselinesQuery = z.infer<typeof segmentBaselinesQuerySchema>;

const stretchGeoPointSchema = z.object({
  lat: z.number().finite(),
  lon: z.number().finite(),
  elevation_m: z.number().finite(),
});

export const manualStretchBodySchema = z.object({
  index: z.number().int().nonnegative().optional(),
  start: stretchGeoPointSchema,
  end: stretchGeoPointSchema,
  length_m: z.number().positive(),
  name: z.string().trim().min(1).max(120).nullable().optional(),
});

export const saveSegmentStretchesBodySchema = z.object({
  thresholds: stretchThresholdsSchema.partial().default({}),
  stretch_source_activity_id: z
    .union([z.null(), z.coerce.number().int().positive()])
    .optional(),
  /** When set, persist these boundaries instead of recomputing from thresholds. */
  stretches: z.array(manualStretchBodySchema).min(1).optional(),
});
export type SaveSegmentStretchesBody = z.infer<typeof saveSegmentStretchesBodySchema>;
