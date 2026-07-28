import { parsePhotonReverseResponse } from "./parsePhotonResponse.js";
import type { ReverseGeocoder } from "./types.js";

const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";
const USER_AGENT = "iterum/0.1 (personal route analysis)";

export const createPhotonGeocoder = (fetchFn: typeof fetch = fetch): ReverseGeocoder => ({
  provider: "photon",
  reverseGeocode: async ({ lat, lon }) => {
    const url = `${PHOTON_REVERSE_URL}?lat=${lat}&lon=${lon}`;
    const response = await fetchFn(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return null;
    return parsePhotonReverseResponse(await response.json());
  },
});