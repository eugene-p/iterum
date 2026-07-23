import { STRETCH_PROGRESS_COLORS } from "../../stretchUtils";

/**
 * Fixed per-pass colors for map markers, sidebar dots, and compare charts.
 * High-contrast hues that stay distinct on maps and overlaid HR lines.
 * Deliberately excludes STRETCH_PROGRESS_COLORS so position ranking
 * (green / yellow / red / gray) stays visually distinct in the sidebar.
 */
export const PASS_IDENTITY_COLORS = [
  "#f97316",
  "#22d3ee",
  "#a3e635",
  "#f43f5e",
  "#facc15",
  "#c084fc",
  "#2dd4bf",
  "#fb7185",
] as const;

export const REFERENCE_IDENTITY_COLOR = "#f97316";

export const SOLO_ACTIVITY_COLOR = "#fb923c";

export function passIdentityColor(index: number): string {
  return PASS_IDENTITY_COLORS[index % PASS_IDENTITY_COLORS.length];
}

export function passIdentityColorForPass(
  passId: number,
  matchedPasses: ReadonlyArray<{ id: number }>,
): string {
  const index = matchedPasses.findIndex((pass) => pass.id === passId);
  return passIdentityColor(index >= 0 ? index : 0);
}

/** Guard in tests: identity palette must not reuse position ranking colors. */
export function identityColorsDistinctFromPositionColors(): boolean {
  const positionSet = new Set<string>([...STRETCH_PROGRESS_COLORS]);
  return PASS_IDENTITY_COLORS.every((color) => !positionSet.has(color));
}