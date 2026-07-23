import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  readCachedTile,
  tileCachePath,
  writeCachedTile,
} from "@/services/routePreview/mapBackground/tileCache.js";

describe("tileCache", () => {
  const zoom = 99;
  const x = 4242;
  const y = 1337;

  afterEach(async () => {
    await fs.unlink(tileCachePath(zoom, x, y)).catch(() => undefined);
  });

  it("uses zoom/x/y path layout", () => {
    expect(tileCachePath(zoom, x, y).endsWith(path.join(String(zoom), String(x), `${y}.png`))).toBe(
      true,
    );
  });

  it("writes and reads cached tiles", async () => {
    const payload = Buffer.from("test-tile");
    await writeCachedTile(zoom, x, y, payload);
    const cached = await readCachedTile(zoom, x, y);
    expect(cached?.equals(payload)).toBe(true);
  });

  it("returns null for missing tiles", async () => {
    expect(await readCachedTile(zoom, x, y)).toBeNull();
  });
});
