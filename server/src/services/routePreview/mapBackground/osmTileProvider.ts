import { boundsCenter } from "../bounds.js";
import {
  TILE_SIZE,
  latLonToWorldPixel,
  mercatorProjectorForBounds,
  tileRangeForViewport,
} from "../mercator.js";
import { readCachedTile, writeCachedTile } from "./tileCache.js";
import type { MapBackgroundPaintRequest, MapBackgroundProvider } from "./types.js";

const OSM_TILE_SUBDOMAINS = ["a", "b", "c"] as const;
const TILE_FETCH_TIMEOUT_MS = 10_000;
const pendingTileFetches = new Map<string, Promise<Buffer | null>>();

export type TileFetch = (zoom: number, x: number, y: number) => Promise<Buffer | null>;

/* v8 ignore start -- @preserve */
// Network + disk-cache tile fetch. Inject `fetchTile` in unit tests; cover defaults via integration.
const tileUrl = (zoom: number, x: number, y: number): string => {
  const subdomain = OSM_TILE_SUBDOMAINS[Math.abs(x + y) % OSM_TILE_SUBDOMAINS.length];
  return `https://${subdomain}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
};

const fetchTileFromNetwork = async (zoom: number, x: number, y: number): Promise<Buffer | null> => {
  try {
    const response = await fetch(tileUrl(zoom, x, y), {
      signal: AbortSignal.timeout(TILE_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
};

const fetchTileWithCache = async (zoom: number, x: number, y: number): Promise<Buffer | null> => {
  const cached = await readCachedTile(zoom, x, y);
  if (cached) return cached;

  const key = `${zoom}/${x}/${y}`;
  const pending = pendingTileFetches.get(key);
  if (pending) return pending;

  const fetchAndCache = (async () => {
    const buffer = await fetchTileFromNetwork(zoom, x, y);
    if (buffer) await writeCachedTile(zoom, x, y, buffer);
    return buffer;
  })();
  pendingTileFetches.set(key, fetchAndCache);
  try {
    return await fetchAndCache;
  } finally {
    pendingTileFetches.delete(key);
  }
};
/* v8 ignore stop -- @preserve */

export type OsmTileBackgroundProviderOptions = {
  /** When set, bypasses disk cache (used in tests). */
  fetchTile?: TileFetch;
};

export const createOsmTileBackgroundProvider = (
  options: OsmTileBackgroundProviderOptions = {},
): MapBackgroundProvider => {
  const fetchTile = options.fetchTile ?? fetchTileWithCache;

  return {
    id: "osm-tiles",

    async paint(context, request: MapBackgroundPaintRequest) {
      const { bounds, width, height, padding } = request;
      const { zoom } = mercatorProjectorForBounds(bounds, width, height, padding);
      const center = boundsCenter(bounds);
      const centerPixel = latLonToWorldPixel(center.lat, center.lon, zoom);
      const topLeft = {
        x: centerPixel.x - width / 2,
        y: centerPixel.y - height / 2,
      };
      const bottomRight = {
        x: centerPixel.x + width / 2,
        y: centerPixel.y + height / 2,
      };
      const tileRange = tileRangeForViewport(topLeft, bottomRight);

      const tileJobs: Array<Promise<void>> = [];

      for (let tileX = tileRange.minX; tileX <= tileRange.maxX; tileX += 1) {
        for (let tileY = tileRange.minY; tileY <= tileRange.maxY; tileY += 1) {
          const drawX = Math.round(tileX * TILE_SIZE - topLeft.x);
          const drawY = Math.round(tileY * TILE_SIZE - topLeft.y);

          tileJobs.push(
            fetchTile(zoom, tileX, tileY).then((buffer) => {
              if (buffer) {
                context.composites.push({ input: buffer, left: drawX, top: drawY });
              }
            }),
          );
        }
      }

      await Promise.all(tileJobs);
    },
  };
};

/* v8 ignore next -- @preserve */
export const defaultMapBackgroundProvider = createOsmTileBackgroundProvider();
export { solidColorBackgroundProvider } from "./solidColorBackgroundProvider.js";
