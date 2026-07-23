/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RoutePreviewKind } from "./generateRoutePreviewImage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREVIEWS_ROOT = path.resolve(__dirname, "../../../data/previews");

export const previewFilePath = (kind: RoutePreviewKind, id: number): string =>
  path.join(PREVIEWS_ROOT, kind, `${id}.jpg`);

const ensureKindDirectory = async (kind: RoutePreviewKind): Promise<void> => {
  await fs.mkdir(path.join(PREVIEWS_ROOT, kind), { recursive: true });
};

export async function readPreviewFile(
  kind: RoutePreviewKind,
  id: number,
): Promise<Buffer | null> {
  try {
    return await fs.readFile(previewFilePath(kind, id));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writePreviewFile(
  kind: RoutePreviewKind,
  id: number,
  buffer: Buffer,
): Promise<void> {
  await ensureKindDirectory(kind);
  await fs.writeFile(previewFilePath(kind, id), buffer);
}

export async function deletePreviewFile(kind: RoutePreviewKind, id: number): Promise<void> {
  try {
    await fs.unlink(previewFilePath(kind, id));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}