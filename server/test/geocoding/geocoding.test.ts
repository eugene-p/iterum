import { describe, expect, it } from "vitest";
import { coordCacheKey } from "@/geocoding/coordCacheKey.js";
import { parsePhotonReverseResponse } from "@/geocoding/parsePhotonResponse.js";
import { pickLocationLabel } from "@/geocoding/pickLocationLabel.js";
import { createPhotonGeocoder } from "@/geocoding/photonGeocoder.js";

const kitsilanoPhotonResponse = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        district: "Kitsilano",
        city: "Vancouver",
        state: "BC",
        country: "Canada",
        street: "West 4th Avenue",
        name: "Bank of Commerce",
      },
      geometry: { type: "Point", coordinates: [-123.1548949, 49.2684087] },
    },
  ],
};

describe("geocoding", () => {
  it("picks location labels", () => {
    expect(pickLocationLabel({ district: "Kitsilano", city: "Vancouver" })).toBe("Kitsilano");
    expect(pickLocationLabel({ city: "Vancouver" })).toBe("Vancouver");
    expect(pickLocationLabel({})).toBeNull();
    expect(
      pickLocationLabel({
        osm_key: "leisure",
        osm_value: "park",
        name: "Stanley Park",
        city: "Vancouver",
      }),
    ).toBe("Stanley Park");
  });

  it("parses photon reverse responses", () => {
    const parsed = parsePhotonReverseResponse(kitsilanoPhotonResponse);
    expect(parsed).not.toBeNull();
    expect(parsed!.label).toBe("Kitsilano");
    expect(parsed!.city).toBe("Vancouver");
    expect(parsePhotonReverseResponse({ features: [] })).toBeNull();
    expect(parsePhotonReverseResponse({ features: [{}] })).toBeNull();
    expect(
      parsePhotonReverseResponse({
        features: [{ properties: { street: "  " } }],
      }),
    ).toBeNull();
  });

  it("rounds coordinates for cache keys", () => {
    expect(coordCacheKey(49.2684123, -123.1548123)).toBe("49.268_-123.155");
  });

  it("reverse geocodes via photon and handles failures", async () => {
    const mockFetch: typeof fetch = async () =>
      ({
        ok: true,
        json: async () => kitsilanoPhotonResponse,
      }) as Response;

    const geocoder = createPhotonGeocoder(mockFetch);
    const result = await geocoder.reverseGeocode({ lat: 49.2684, lon: -123.1548 });
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Kitsilano");
    expect(geocoder.provider).toBe("photon");

    const failing: typeof fetch = async () =>
      ({
        ok: false,
        json: async () => ({}),
      }) as Response;
    await expect(
      createPhotonGeocoder(failing).reverseGeocode({ lat: 1, lon: 2 }),
    ).resolves.toBeNull();
  });
});
