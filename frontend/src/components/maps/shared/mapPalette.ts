/**
 * Map-specific colors are intentionally separate from UI status colors.
 * OSM uses pale greens for parks and land cover, so map selection uses violet
 * rather than the application's success green.
 */
export const mapPalette = {
  routePrimary: "#2f6fed",
  routeSecondary: "#6b8cb8",
  selectionGlow: "#7e22ce",
  selectionLine: "#c084fc",
  segmentStart: "#a855f7",
  segmentEnd: "#ff8f8f",
} as const;
