import type {
  ActivityDeleteInfo,
  ActivityDetail,
  ActivityMatchedSegment,
  ActivitySummary,
  DistanceUnit,
  Profile,
  ProfileViewScope,
  Segment,
  SegmentCompare,
  SegmentStretchPreviewOptions,
  Stretch,
  StretchThresholds,
  TrackPoint,
} from "./types";
import { sortActivitiesByTime, sortSegmentPassesByTime } from "./lib/activitySearch";
import { stretchPreviewQuery } from "./stretchUtils";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let detail = await response.text();
    try {
      const json = JSON.parse(detail) as { error?: string };
      if (json.error) detail = json.error;
    } catch {
      /* keep raw text */
    }
    throw new Error(detail || response.statusText);
  }
  return response.json() as Promise<T>;
}

const profileQueryParam = (scope?: ProfileViewScope) => {
  if (scope == null) return "";
  return `?profile_id=${scope}`;
};

export function listProfiles() {
  return request<Profile[]>("/api/profiles");
}

export function createProfile(name: string) {
  return request<Profile>("/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function updateProfile(
  id: number,
  payload: {
    name?: string;
    year_of_birth?: number | null;
    default_stretch_thresholds?: StretchThresholds;
    distance_unit?: DistanceUnit;
    split_distance_m?: number;
  },
) {
  return request<Profile>(`/api/profiles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteProfile(id: number) {
  return request<{ ok: boolean }>(`/api/profiles/${id}`, { method: "DELETE" });
}

export async function listActivities(profileScope?: ProfileViewScope) {
  const activities = await request<ActivitySummary[]>(
    `/api/activities${profileQueryParam(profileScope)}`,
  );
  return sortActivitiesByTime(activities);
}

export function getActivitySummary(id: number) {
  return request<ActivitySummary>(`/api/activities/${id}`);
}

export function getActivityPoints(id: number) {
  return request<{ points: TrackPoint[] }>(`/api/activities/${id}/points`);
}

export async function getActivityDetail(id: number): Promise<ActivityDetail> {
  const [summary, { points }] = await Promise.all([
    getActivitySummary(id),
    getActivityPoints(id),
  ]);
  return { ...summary, points };
}

export function getActivityDeleteInfo(id: number) {
  return request<ActivityDeleteInfo>(`/api/activities/${id}/delete-info`);
}

export function getActivityMatchedSegments(id: number) {
  return request<ActivityMatchedSegment[]>(`/api/activities/${id}/matched-segments`);
}

export async function uploadActivity(file: File, profileId: number) {
  const form = new FormData();
  form.append("file", file);
  form.append("profile_id", String(profileId));
  return request<ActivitySummary>("/api/activities/upload", {
    method: "POST",
    body: form,
  });
}

export function deleteActivity(id: number) {
  return request<{ ok: boolean }>(`/api/activities/${id}`, { method: "DELETE" });
}

export function updateActivity(
  id: number,
  payload: { name?: string; profile_id?: number },
) {
  return request<ActivitySummary>(`/api/activities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function sampleActivityRoute(id: number) {
  return request<{ points: Array<{ lat: number; lon: number }> }>(
    `/api/activities/${id}/route-sample`,
  );
}

export function listSegments(scope?: ProfileViewScope) {
  return request<Segment[]>(`/api/segments${profileQueryParam(scope)}`);
}

export function createSegment(payload: {
  name: string;
  description?: string | null;
  source_activity_id: number;
  start_index: number;
  end_index: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m?: number;
  match_threshold?: number;
}) {
  return request<Segment>("/api/segments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateSegment(
  id: number,
  payload: {
    name?: string;
    description?: string | null;
    start_lat?: number;
    start_lon?: number;
    end_lat?: number;
    end_lon?: number;
    radius_m?: number;
    match_threshold?: number;
  },
) {
  return request<Segment>(`/api/segments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function createReversedSegment(id: number, name?: string) {
  return request<Segment>(`/api/segments/${id}/reverse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function deleteSegment(id: number) {
  return request<{ ok: boolean }>(`/api/segments/${id}`, { method: "DELETE" });
}

export function rescanSegment(id: number) {
  return request<{ rescanned: number }>(`/api/segments/${id}/rescan`, { method: "POST" });
}

export async function compareSegment(
  segmentId: number,
  preview?: SegmentStretchPreviewOptions | null,
) {
  const query = preview ? stretchPreviewQuery(preview) : "";
  const suffix = query ? `?${query}` : "";
  const data = await request<SegmentCompare>(`/api/segments/${segmentId}/compare${suffix}`);
  return { ...data, passes: sortSegmentPassesByTime(data.passes) };
}

export async function saveSegmentStretches(
  segmentId: number,
  thresholds: StretchThresholds,
  stretchSourceActivityId?: number | null,
  stretches?: Stretch[] | null,
) {
  const data = await request<SegmentCompare>(`/api/segments/${segmentId}/stretches`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      thresholds,
      stretch_source_activity_id: stretchSourceActivityId ?? null,
      ...(stretches?.length
        ? {
            stretches: stretches.map((s) => ({
              index: s.index,
              start: s.start,
              end: s.end,
              length_m: s.length_m,
              name: s.name ?? null,
            })),
          }
        : {}),
    }),
  });
  return { ...data, passes: sortSegmentPassesByTime(data.passes) };
}

export function getSegmentReference(segmentId: number) {
  return request<TrackPoint[]>(`/api/segments/${segmentId}/reference`);
}
