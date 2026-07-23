import { describe, expect, it } from "vitest";
import { parseGpx } from "@/parsers/gpx.js";

const sampleGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx>
  <trk>
    <name>Morning Run</name>
    <trkseg>
      <trkpt lat="48.0" lon="16.0">
        <time>2024-01-01T10:00:00Z</time>
        <ele>100</ele>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>125</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <trkpt lat="48.001" lon="16.001">
        <time>2024-01-01T10:05:00Z</time>
        <ele>110</ele>
      </trkpt>
      <trkpt lat="bad" lon="16.0">
        <ele>0</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

const routeOnlyGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx>
  <metadata>
    <time>2024-02-01T09:00:00Z</time>
  </metadata>
  <rte>
    <rtept lat="49.0" lon="-123.0">
      <ele>20</ele>
    </rtept>
    <rtept lat="49.001" lon="-123.001">
      <ele>25</ele>
    </rtept>
  </rte>
</gpx>`;

describe("parseGpx", () => {
  it("extracts track points, HR extensions, and activity metadata", () => {
    const activity = parseGpx(sampleGpx, "fallback.gpx");
    expect(activity.name).toBe("Morning Run");
    expect(activity.points).toHaveLength(2);
    expect(activity.points[0].elevationM).toBe(100);
    expect(activity.points[0].heartRate).toBe(125);
    expect(activity.durationSec).toBeCloseTo(300, 0);
  });

  it("falls back to route points when tracks are empty", () => {
    const activity = parseGpx(routeOnlyGpx, "route.gpx");
    expect(activity.points).toHaveLength(2);
    expect(activity.points[0].lat).toBe(49);
    expect(activity.startedAt?.toISOString()).toBe("2024-02-01T09:00:00.000Z");
  });
});
