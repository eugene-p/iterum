/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { BadRequestError, NotFoundError } from "../middleware/errors.js";
import { query } from "../db/pool.js";
import {
  DEFAULT_STRETCH_THRESHOLDS,
  parseStretchThresholds,
  type StretchThresholds,
} from "./stretchSegmentation.js";
import type { DistanceUnit } from "@eugene-p/iterum-shared";

const DEFAULT_DISTANCE_UNIT: DistanceUnit = "km";
const DEFAULT_SPLIT_DISTANCE_M = 1_000;

export type ProfileRow = {
  id: number;
  name: string;
  year_of_birth: number | null;
  default_stretch_thresholds: StretchThresholds;
  distance_unit: DistanceUnit;
  split_distance_m: number;
  created_at: string;
};

const mapProfileRow = (row: {
  id: number;
  name: string;
  year_of_birth: number | null;
  default_stretch_thresholds: StretchThresholds | string;
  distance_unit: DistanceUnit;
  split_distance_m: number | string;
  created_at: string;
}): ProfileRow => ({
  id: row.id,
  name: row.name,
  year_of_birth: row.year_of_birth,
  default_stretch_thresholds:
    typeof row.default_stretch_thresholds === "string"
      ? parseStretchThresholds(
          JSON.parse(row.default_stretch_thresholds) as unknown as Record<string, unknown>,
        )
      : parseStretchThresholds(
          row.default_stretch_thresholds as unknown as Record<string, unknown>,
        ),
  distance_unit: row.distance_unit,
  split_distance_m: Number(row.split_distance_m),
  created_at: row.created_at,
});

const parseDistanceUnit = (value: unknown): DistanceUnit => {
  if (value === "km" || value === "mi") return value;
  throw new BadRequestError("Distance unit must be km or mi");
};

const parseSplitDistanceM = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 50 || parsed > 100_000) {
    throw new BadRequestError("Custom split distance must be between 50 m and 100 km");
  }
  return parsed;
};

const parseYearOfBirth = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new BadRequestError("Year of birth must be a whole number");
  }
  const currentYear = new Date().getFullYear();
  if (parsed < 1900 || parsed > currentYear) {
    throw new BadRequestError(`Year of birth must be between 1900 and ${currentYear}`);
  }
  return parsed;
};

export const listProfiles = async (): Promise<ProfileRow[]> => {
  const result = await query<{
    id: number;
    name: string;
    year_of_birth: number | null;
    default_stretch_thresholds: StretchThresholds;
    distance_unit: DistanceUnit;
    split_distance_m: number;
    created_at: string;
  }>(`SELECT id, name, year_of_birth, default_stretch_thresholds, distance_unit, split_distance_m, created_at FROM profiles ORDER BY name`);
  return result.rows.map(mapProfileRow);
};

export const getProfile = async (id: number): Promise<ProfileRow | null> => {
  const result = await query<{
    id: number;
    name: string;
    year_of_birth: number | null;
    default_stretch_thresholds: StretchThresholds;
    distance_unit: DistanceUnit;
    split_distance_m: number;
    created_at: string;
  }>(`SELECT id, name, year_of_birth, default_stretch_thresholds, distance_unit, split_distance_m, created_at FROM profiles WHERE id = $1`, [id]);
  if (!result.rowCount) return null;
  return mapProfileRow(result.rows[0]);
};

export const createProfile = async (
  name: string,
  options?: {
    defaultStretchThresholds?: StretchThresholds;
    yearOfBirth?: number | null;
    distanceUnit?: DistanceUnit;
    splitDistanceM?: number;
  },
): Promise<ProfileRow> => {
  const trimmed = name.trim();
  if (!trimmed) throw new BadRequestError("Profile name is required");

  const thresholds = options?.defaultStretchThresholds ?? DEFAULT_STRETCH_THRESHOLDS;
  const yearOfBirth = parseYearOfBirth(options?.yearOfBirth ?? null);
  const distanceUnit = parseDistanceUnit(options?.distanceUnit ?? DEFAULT_DISTANCE_UNIT);
  const splitDistanceM = parseSplitDistanceM(options?.splitDistanceM ?? DEFAULT_SPLIT_DISTANCE_M);
  const result = await query<{
    id: number;
    name: string;
    year_of_birth: number | null;
    default_stretch_thresholds: StretchThresholds;
    distance_unit: DistanceUnit;
    split_distance_m: number;
    created_at: string;
  }>(
    `INSERT INTO profiles (name, year_of_birth, default_stretch_thresholds, distance_unit, split_distance_m)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     RETURNING id, name, year_of_birth, default_stretch_thresholds, distance_unit, split_distance_m, created_at`,
    [trimmed, yearOfBirth ?? null, JSON.stringify(thresholds), distanceUnit, splitDistanceM],
  );
  return mapProfileRow(result.rows[0]);
};

export const updateProfile = async (
  id: number,
  updates: {
    name?: string;
    year_of_birth?: number | null;
    default_stretch_thresholds?: StretchThresholds;
    distance_unit?: DistanceUnit;
    split_distance_m?: number;
  },
): Promise<ProfileRow | null> => {
  const existing = await getProfile(id);
  if (!existing) return null;

  const name = updates.name !== undefined ? updates.name.trim() : existing.name;
  if (!name) throw new BadRequestError("Profile name is required");

  const thresholds = updates.default_stretch_thresholds ?? existing.default_stretch_thresholds;
  const yearOfBirth =
    updates.year_of_birth !== undefined
      ? parseYearOfBirth(updates.year_of_birth)
      : existing.year_of_birth;
  const distanceUnit =
    updates.distance_unit !== undefined
      ? parseDistanceUnit(updates.distance_unit)
      : existing.distance_unit;
  const splitDistanceM =
    updates.split_distance_m !== undefined
      ? parseSplitDistanceM(updates.split_distance_m)
      : existing.split_distance_m;
  const result = await query<{
    id: number;
    name: string;
    year_of_birth: number | null;
    default_stretch_thresholds: StretchThresholds;
    distance_unit: DistanceUnit;
    split_distance_m: number;
    created_at: string;
  }>(
    `UPDATE profiles
     SET name = $1, year_of_birth = $2, default_stretch_thresholds = $3::jsonb,
         distance_unit = $4, split_distance_m = $5
     WHERE id = $6
     RETURNING id, name, year_of_birth, default_stretch_thresholds, distance_unit, split_distance_m, created_at`,
    [name, yearOfBirth ?? null, JSON.stringify(thresholds), distanceUnit, splitDistanceM, id],
  );
  return mapProfileRow(result.rows[0]);
};

export const deleteProfile = async (id: number): Promise<void> => {
  const existing = await getProfile(id);
  if (!existing) throw new NotFoundError("Profile not found");

  const profileCount = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM profiles`);
  if (Number(profileCount.rows[0]?.count ?? 0) <= 1) {
    throw new BadRequestError("Cannot delete the last profile");
  }

  const activityCount = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM activities WHERE profile_id = $1`,
    [id],
  );
  if (Number(activityCount.rows[0]?.count ?? 0) > 0) {
    throw new BadRequestError("Cannot delete a profile that still has activities");
  }

  await query(`DELETE FROM profiles WHERE id = $1`, [id]);
};

export const getActivityProfileId = async (activityId: number): Promise<number | null> => {
  const result = await query<{ profile_id: number }>(
    `SELECT profile_id FROM activities WHERE id = $1`,
    [activityId],
  );
  return result.rowCount ? result.rows[0].profile_id : null;
};

export const getProfileStretchThresholdsForActivity = async (
  activityId: number,
): Promise<StretchThresholds> => {
  const result = await query<{ default_stretch_thresholds: StretchThresholds }>(
    `SELECT p.default_stretch_thresholds
     FROM activities a
     JOIN profiles p ON p.id = a.profile_id
     WHERE a.id = $1`,
    [activityId],
  );
  if (!result.rowCount) return DEFAULT_STRETCH_THRESHOLDS;
  return parseStretchThresholds(
    result.rows[0].default_stretch_thresholds as unknown as Record<string, unknown>,
  );
};
