const LAST_OPENED_KEY = "fit-analysis.last-opened";

export type LastOpened = {
  segmentId: number | null;
  activityId: number | null;
};

export type ResumeEntity = {
  id: number;
  name: string;
};

const emptyLastOpened = (): LastOpened => ({ segmentId: null, activityId: null });

const parsePositiveId = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const readLastOpened = (): LastOpened => {
  try {
    const raw = localStorage.getItem(LAST_OPENED_KEY);
    if (!raw) return emptyLastOpened();
    const parsed = JSON.parse(raw) as Partial<LastOpened>;
    return {
      segmentId: parsePositiveId(parsed.segmentId),
      activityId: parsePositiveId(parsed.activityId),
    };
  } catch {
    return emptyLastOpened();
  }
};

const writeLastOpened = (next: LastOpened) => {
  localStorage.setItem(LAST_OPENED_KEY, JSON.stringify(next));
};

export const writeLastOpenedSegment = (segmentId: number) => {
  writeLastOpened({ ...readLastOpened(), segmentId });
};

export const writeLastOpenedActivity = (activityId: number) => {
  writeLastOpened({ ...readLastOpened(), activityId });
};

export const clearLastOpened = () => {
  localStorage.removeItem(LAST_OPENED_KEY);
};

export const resolveResumeTargets = (
  last: LastOpened,
  segments: ResumeEntity[],
  activities: ResumeEntity[],
): { segment: ResumeEntity | null; activity: ResumeEntity | null } => ({
  segment:
    last.segmentId == null
      ? null
      : (segments.find((segment) => segment.id === last.segmentId) ?? null),
  activity:
    last.activityId == null
      ? null
      : (activities.find((activity) => activity.id === last.activityId) ?? null),
});
