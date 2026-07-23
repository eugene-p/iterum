import { BadRequestError } from "../middleware/errors.js";
import type { ParsedActivity } from "../types.js";
import { parseCsv } from "./csv.js";
import { parseFitlog } from "./fitlog.js";
import { parseGpx } from "./gpx.js";
import { parseKml } from "./kml.js";
import { parseTcx } from "./tcx.js";

export type SupportedFormat = "gpx" | "tcx" | "kml" | "kmz" | "fitlog" | "csv";

type ParserFn = (content: string, filename: string) => ParsedActivity;

const EXTENSIONS: Record<string, SupportedFormat> = {
  gpx: "gpx",
  tcx: "tcx",
  kml: "kml",
  kmz: "kml",
  fitlog: "fitlog",
  csv: "csv",
};

const PARSERS: Record<SupportedFormat, ParserFn> = {
  gpx: parseGpx,
  tcx: parseTcx,
  kml: parseKml,
  kmz: parseKml,
  fitlog: parseFitlog,
  csv: parseCsv,
};

export const detectFormat = (filename: string): SupportedFormat | null => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? (EXTENSIONS[ext] ?? null) : null;
};

export const parseActivityFile = (content: string, filename: string): ParsedActivity => {
  const format = detectFormat(filename);
  if (!format) {
    throw new BadRequestError(
      `Unsupported file type. Supported: ${Object.keys(EXTENSIONS).join(", ")}`,
    );
  }

  const parser = PARSERS[format];
  if (!parser) {
    throw new BadRequestError(`Unsupported format: ${format}`);
  }

  return parser(content, filename);
};