import { BadRequestError } from "../middleware/errors.js";
import type { ParsedActivity } from "../types.js";
import { parseCsv } from "./csv.js";
import { parseFit } from "./fit.js";
import { parseFitlog } from "./fitlog.js";
import { parseGpx } from "./gpx.js";
import { parseKml } from "./kml.js";
import { parseTcx } from "./tcx.js";

export type SupportedFormat = "gpx" | "tcx" | "kml" | "kmz" | "fitlog" | "csv" | "fit";
export type ActivityFileContent = string | Buffer | ArrayBuffer | Uint8Array;

type TextParserFn = (content: string, filename: string) => ParsedActivity;
type BinaryParserFn = (content: Buffer | ArrayBuffer | Uint8Array, filename: string) => Promise<ParsedActivity>;

const EXTENSIONS: Record<string, SupportedFormat> = {
  gpx: "gpx",
  tcx: "tcx",
  kml: "kml",
  kmz: "kml",
  fitlog: "fitlog",
  csv: "csv",
  fit: "fit",
};

const TEXT_PARSERS: Record<Exclude<SupportedFormat, "fit">, TextParserFn> = {
  gpx: parseGpx,
  tcx: parseTcx,
  kml: parseKml,
  kmz: parseKml,
  fitlog: parseFitlog,
  csv: parseCsv,
};

const BINARY_PARSERS: Record<"fit", BinaryParserFn> = {
  fit: parseFit,
};

const toText = (content: ActivityFileContent): string => {
  if (typeof content === "string") return content;
  if (content instanceof Buffer) return content.toString("utf8");
  if (content instanceof ArrayBuffer) return Buffer.from(content).toString("utf8");
  return Buffer.from(content).toString("utf8");
};

const toBinary = (content: ActivityFileContent): Buffer => {
  if (typeof content === "string") return Buffer.from(content, "binary");
  if (content instanceof Buffer) return content;
  if (content instanceof ArrayBuffer) return Buffer.from(content);
  return Buffer.from(content);
};

export const detectFormat = (filename: string): SupportedFormat | null => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? (EXTENSIONS[ext] ?? null) : null;
};

export const parseActivityFile = async (
  content: ActivityFileContent,
  filename: string,
): Promise<ParsedActivity> => {
  const format = detectFormat(filename);
  if (!format) {
    throw new BadRequestError(
      `Unsupported file type. Supported: ${Object.keys(EXTENSIONS).join(", ")}`,
    );
  }

  if (format === "fit") {
    return BINARY_PARSERS.fit(toBinary(content), filename);
  }

  const parser = TEXT_PARSERS[format];
  if (!parser) {
    throw new BadRequestError(`Unsupported format: ${format}`);
  }

  return parser(toText(content), filename);
};
