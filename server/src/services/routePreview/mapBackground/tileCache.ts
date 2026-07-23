/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TILES_ROOT = path.resolve(__dirname, "../../../../data/tiles");

export const tileCachePath = (zoom: number, x: number, y: number): string =>
  path.join(TILES_ROOT, String(zoom), String(x), `${y}.png`);

const ensureTileDirectory = async (zoom: number, x: number): Promise<void> => {
  await fs.mkdir(path.join(TILES_ROOT, String(zoom), String(x)), { recursive: true });
};

export async function readCachedTile(
  zoom: number,
  x: number,
  y: number,
): Promise<Buffer | null> {
  try {
    return await fs.readFile(tileCachePath(zoom, x, y));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeCachedTile(
  zoom: number,
  x: number,
  y: number,
  buffer: Buffer,
): Promise<void> {
  await ensureTileDirectory(zoom, x);
  await fs.writeFile(tileCachePath(zoom, x, y), buffer);
}