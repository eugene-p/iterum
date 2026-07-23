import { describe, expect, it } from "vitest";
import { planActivityGeocodeUpdate } from "@/services/planActivityGeocodeUpdate.js";

describe("planActivityGeocodeUpdate", () => {
  it("skips when the activity already has a location", () => {
    expect(
      planActivityGeocodeUpdate({
        currentName: "Morning run",
        currentLocation: "Berlin",
        tags: ["run", "morning"],
        geocodedLocation: "Munich",
      }),
    ).toEqual({ action: "skip", reason: "already_has_location" });
  });

  it("skips when reverse geocode returns nothing", () => {
    expect(
      planActivityGeocodeUpdate({
        currentName: "file.gpx",
        currentLocation: null,
        tags: ["run"],
        geocodedLocation: null,
      }),
    ).toEqual({ action: "skip", reason: "no_geocode_result" });
  });

  it("updates location and recomputes display name", () => {
    const plan = planActivityGeocodeUpdate({
      currentName: "file.gpx",
      currentLocation: null,
      tags: ["run", "morning"],
      geocodedLocation: "Potsdam",
    });

    expect(plan).toEqual({
      action: "update",
      location: "Potsdam",
      name: "Morning run in Potsdam",
    });
  });

  it("falls back to the current name when display name cannot be derived", () => {
    expect(
      planActivityGeocodeUpdate({
        currentName: "custom title",
        currentLocation: null,
        tags: [],
        geocodedLocation: "Somewhere",
      }),
    ).toEqual({
      action: "update",
      location: "Somewhere",
      name: "Somewhere",
    });
  });
});
