import { describe, expect, it } from "vitest";
import {
  APP_NAME,
  APP_TAGLINE,
  buildDocumentTitle,
} from "./brandingConstants";

describe("buildDocumentTitle", () => {
  it("uses name and tagline when no page title is given", () => {
    expect(buildDocumentTitle()).toBe(`${APP_NAME} · ${APP_TAGLINE}`);
  });

  it("prefixes a page title for a later dynamic tab label", () => {
    expect(buildDocumentTitle("Climb")).toBe(`Climb · ${APP_NAME}`);
  });
});
