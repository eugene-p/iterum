import type { SegmentPass } from "../../../types";

export type StretchSourceOption = {
  activityId: number;
  label: string;
  passId: number;
};

/** One option per activity (first pass wins). Used for stretch geometry source picker. */
export const stretchSourceOptionsFromPasses = (
  passes: ReadonlyArray<Pick<SegmentPass, "id" | "activity_id" | "activity_name" | "pass_number">>,
): StretchSourceOption[] => {
  const seen = new Set<number>();
  const options: StretchSourceOption[] = [];
  for (const pass of passes) {
    if (seen.has(pass.activity_id)) continue;
    seen.add(pass.activity_id);
    const passSuffix = pass.pass_number > 1 ? ` · pass ${pass.pass_number}` : "";
    options.push({
      activityId: pass.activity_id,
      passId: pass.id,
      label: `${pass.activity_name}${passSuffix}`,
    });
  }
  return options;
};

export const stretchSourceLabel = (
  options: ReadonlyArray<StretchSourceOption>,
  sourcePassId: number | null | undefined,
  sourceActivityId: number | null | undefined,
): string => {
  if (sourcePassId != null) {
    const byPass = options.find((option) => option.passId === sourcePassId);
    if (byPass) return byPass.label;
  }
  if (sourceActivityId != null) {
    const byActivity = options.find((option) => option.activityId === sourceActivityId);
    if (byActivity) return byActivity.label;
  }
  return "Segment default";
};
