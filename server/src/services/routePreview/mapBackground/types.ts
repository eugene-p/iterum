import type { OverlayOptions } from "sharp";
import type { RoutePreviewBounds } from "../bounds.js";

export type MapBackgroundPaintRequest = {
  bounds: RoutePreviewBounds;
  width: number;
  height: number;
  padding: number;
  backgroundColor: string;
};

export type RoutePreviewPaintContext = {
  width: number;
  height: number;
  backgroundColor: string;
  composites: OverlayOptions[];
};

/** Pluggable source for preview map backgrounds (tiles, static API, solid fill, etc.). */
export interface MapBackgroundProvider {
  readonly id: string;
  paint(context: RoutePreviewPaintContext, request: MapBackgroundPaintRequest): Promise<void>;
}