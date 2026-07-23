import sharp from "sharp";
import { BadRequestError } from "../../middleware/errors.js";
import {
  computeRoutePreviewBounds,
  expandRoutePreviewBounds,
  type RoutePreviewPoint,
} from "./bounds.js";
import { mercatorProjectorForBounds } from "./mercator.js";
import {
  createBoxProjector,
  defaultMapBackgroundProvider,
  solidColorBackgroundProvider,
  type MapBackgroundProvider,
  type RoutePreviewPaintContext,
} from "./mapBackground/index.js";

export type RoutePreviewKind = "activities" | "segments";

export type GenerateRoutePreviewOptions = {
  kind: RoutePreviewKind;
  id: number;
  points: Array<RoutePreviewPoint>;
  lineColor: string;
  provider?: MapBackgroundProvider;
};

const PREVIEW_WIDTH = 380;
const PREVIEW_HEIGHT = 260;
const DEFAULT_BACKGROUND = "#0a0f14";
const DEFAULT_PADDING = 18;
/** Sidebar thumbnails: lower quality + mozjpeg keeps map detail acceptable while cutting tile noise. */
const JPEG_OPTIONS = { quality: 68, mozjpeg: true } as const;

const buildRouteSvg = (
  points: ReadonlyArray<RoutePreviewPoint>,
  projectPoint: (point: RoutePreviewPoint) => [number, number],
  lineColor: string,
  width: number,
  height: number,
): string => {
  if (points.length < 2) return "";

  const projected = points.map(projectPoint);
  const pathD = projected
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>
</svg>`;
};

const paintBackground = async (
  provider: MapBackgroundProvider,
  context: RoutePreviewPaintContext,
  request: Parameters<MapBackgroundProvider["paint"]>[1],
): Promise<void> => {
  context.composites = [];
  await provider.paint(context, request);
};

export async function generateRoutePreviewImage(
  options: GenerateRoutePreviewOptions,
): Promise<Buffer> {
  const { points, lineColor } = options;
  if (points.length < 2) {
    throw new BadRequestError("Route preview requires at least 2 points");
  }

  const width = PREVIEW_WIDTH;
  const height = PREVIEW_HEIGHT;
  const backgroundColor = DEFAULT_BACKGROUND;
  const padding = DEFAULT_PADDING;

  const bounds = computeRoutePreviewBounds(points);
  if (!bounds) {
    throw new Error("Could not compute route preview bounds");
  }

  const expandedBounds = expandRoutePreviewBounds(bounds);
  const mercator = mercatorProjectorForBounds(expandedBounds, width, height, padding);

  const paintRequest = {
    bounds: expandedBounds,
    width,
    height,
    padding,
    backgroundColor,
  };

  const paintContext: RoutePreviewPaintContext = {
    width,
    height,
    backgroundColor,
    composites: [],
  };

  const primaryProvider = options.provider ?? defaultMapBackgroundProvider;
  let projectPoint = mercator.projectPoint;

  try {
    await paintBackground(primaryProvider, paintContext, paintRequest);
    if (primaryProvider.id === solidColorBackgroundProvider.id) {
      projectPoint = createBoxProjector(expandedBounds, width, height, padding);
    }
  } catch {
    await paintBackground(solidColorBackgroundProvider, paintContext, paintRequest);
    projectPoint = createBoxProjector(expandedBounds, width, height, padding);
  }

  const routeSvg = buildRouteSvg(points, projectPoint, lineColor, width, height);
  const composites = [
    ...paintContext.composites,
    { input: Buffer.from(routeSvg), left: 0, top: 0 },
  ];

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: backgroundColor,
    },
  })
    .composite(composites)
    .jpeg(JPEG_OPTIONS)
    .toBuffer();
}