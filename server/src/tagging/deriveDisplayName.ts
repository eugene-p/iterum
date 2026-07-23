import { ACTIVITY_TYPE_TAGS, TERRAIN_TAGS } from "./tagConstants.js";
import { isTimeOfDayTag } from "./deriveTimeOfDayTag.js";

export type DeriveDisplayNameInput = {
  tags: readonly string[];
  location: string | null;
};

const capitalize = (value: string): string =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

const findTag = (tags: readonly string[], candidates: readonly string[]): string | null =>
  tags.find((tag) => candidates.includes(tag)) ?? null;

export const deriveDisplayName = ({ tags, location }: DeriveDisplayNameInput): string | null => {
  const timeTag = tags.find((tag) => isTimeOfDayTag(tag)) ?? null;
  const activityTag = findTag(tags, ACTIVITY_TYPE_TAGS);
  const terrainTag = findTag(tags, TERRAIN_TAGS);

  const headlineParts: string[] = [];
  if (timeTag && activityTag) {
    headlineParts.push(`${capitalize(timeTag)} ${activityTag}`);
  } else if (activityTag) {
    headlineParts.push(capitalize(activityTag));
  } else if (timeTag) {
    headlineParts.push(capitalize(timeTag));
  }

  if (!headlineParts.length && !location && !terrainTag) return null;

  let name = headlineParts.join(" ");
  if (location) {
    name = name ? `${name} in ${location}` : location;
  }
  if (terrainTag) {
    name = name ? `${name} (${terrainTag})` : `(${terrainTag})`;
  }

  return name.trim() || null;
};