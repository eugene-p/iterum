/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { coordCacheKey, getDefaultReverseGeocoder, type ReverseGeocoder } from "../geocoding/index.js";
import { query } from "../db/pool.js";

export const resolveActivityLocation = async (
  lat: number,
  lon: number,
  geocoder: ReverseGeocoder = getDefaultReverseGeocoder(),
): Promise<string | null> => {
  const cacheKey = coordCacheKey(lat, lon);

  const cached = await query<{ label: string }>(
    `SELECT label FROM geocode_cache WHERE cache_key = $1`,
    [cacheKey],
  );
  if (cached.rows[0]) return cached.rows[0].label;

  const result = await geocoder.reverseGeocode({ lat, lon });
  if (!result) return null;

  await query(
    `INSERT INTO geocode_cache (cache_key, label, district, city, state, country, provider)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (cache_key) DO UPDATE
       SET label = EXCLUDED.label,
           district = EXCLUDED.district,
           city = EXCLUDED.city,
           state = EXCLUDED.state,
           country = EXCLUDED.country,
           provider = EXCLUDED.provider`,
    [
      cacheKey,
      result.label,
      result.district,
      result.city,
      result.state,
      result.country,
      geocoder.provider,
    ],
  );

  return result.label;
};