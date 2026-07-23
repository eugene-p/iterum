import { passIdentityColor } from "../../passIdentityColors";

export const PASS_CHART_LINE_DASHES = [
  undefined,
  "7 4",
  "3 3",
  "9 4 2 4",
  "5 2",
  "11 4 2 4",
  "2 2",
  "14 4 3 4",
] as const;

export const passChartLineColor = passIdentityColor;

export const passChartLineDash = (index: number): string | undefined =>
  PASS_CHART_LINE_DASHES[index % PASS_CHART_LINE_DASHES.length];