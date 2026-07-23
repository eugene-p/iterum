/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

/** Public segment service facade — commands, queries, and matching re-exports. */

export {
  createReversedSegment,
  createSegmentFromActivity,
  deleteSegment,
  saveSegmentStretchesFromPreview,
  updateSegment,
  type CreateSegmentInput,
  type UpdateSegmentInput,
} from "./segmentCommands.js";

export {
  getSegmentById,
  getSegmentPasses,
  getSegmentReferencePoints,
  listSegments,
} from "./segmentQueries.js";

export {
  matchActivityAgainstAllSegments,
  rescanSegment,
} from "./segmentMatching.js";
