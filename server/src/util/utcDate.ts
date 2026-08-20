/** UTC calendar date used by segment baseline windows. */
export type UtcDate = string;

const UTC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const assertUtcDate = (value: string): UtcDate => {
  if (!UTC_DATE_PATTERN.test(value)) {
    throw new Error(`Expected a UTC calendar date (YYYY-MM-DD), got ${value}`);
  }
  return value;
};

export const utcDateFromTimestamptz = (value: string | Date): UtcDate => {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`Invalid timestamp: ${String(value)}`);
  }
  return date.toISOString().slice(0, 10);
};

/**
 * Normalize a PostgreSQL DATE value. node-postgres returns DATE columns as
 * local-midnight Date objects by default, so local calendar getters preserve
 * the database date without shifting it across a UTC boundary.
 */
export const utcDateFromPgDate = (value: string | Date): UtcDate => {
  if (typeof value === "string") return assertUtcDate(value);
  if (!Number.isFinite(value.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`);
  }
  return assertUtcDate(
    `${value.getFullYear().toString().padStart(4, "0")}-${(value.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${value.getDate().toString().padStart(2, "0")}`,
  );
};

export const addUtcDays = (date: UtcDate, days: number): UtcDate => {
  assertUtcDate(date);
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
