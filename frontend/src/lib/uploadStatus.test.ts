import { describe, expect, it } from "vitest";
import { uploadStatusText } from "./uploadStatus";

describe("uploadStatusText", () => {
  it("formats uploading progress with file name", () => {
    expect(
      uploadStatusText({
        phase: "uploading",
        fileName: "ride.gpx",
        index: 2,
        total: 3,
        doneCount: 1,
      }),
    ).toBe("Uploading and processing ride.gpx (2 of 3)…");
  });

  it("formats done message for multiple files", () => {
    expect(
      uploadStatusText({
        phase: "done",
        fileName: null,
        index: 0,
        total: 0,
        doneCount: 4,
      }),
    ).toBe("4 activities imported successfully.");
  });
});