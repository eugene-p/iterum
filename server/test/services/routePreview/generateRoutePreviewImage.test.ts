import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { generateRoutePreviewImage } from "@/services/routePreview/generateRoutePreviewImage.js";
import { createOsmTileBackgroundProvider } from "@/services/routePreview/mapBackground/index.js";

describe("generateRoutePreviewImage", () => {
  it("renders a jpeg preview with mock tiles", async () => {
    const tilePng = await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 3,
        background: "#808080",
      },
    })
      .png()
      .toBuffer();

    const provider = createOsmTileBackgroundProvider({
      fetchTile: async (_zoom, _x, _y) => tilePng,
    });

    const buffer = await generateRoutePreviewImage({
      kind: "activities",
      id: 1,
      points: [
        { lat: 48, lon: 16 },
        { lat: 48.1, lon: 16.2 },
      ],
      lineColor: "#2f6fed",
      provider,
    });

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer[0]).toBe(0xff);
    expect(buffer[1]).toBe(0xd8);

    const metadata = await sharp(buffer).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(380);
    expect(metadata.height).toBe(260);
  });
});
