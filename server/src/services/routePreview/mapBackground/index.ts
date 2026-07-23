export type { MapBackgroundPaintRequest, MapBackgroundProvider, RoutePreviewPaintContext } from "./types.js";
export {
  createOsmTileBackgroundProvider,
  defaultMapBackgroundProvider,
  solidColorBackgroundProvider,
  type OsmTileBackgroundProviderOptions,
  type TileFetch,
} from "./osmTileProvider.js";
export { createBoxProjector } from "./solidColorBackgroundProvider.js";