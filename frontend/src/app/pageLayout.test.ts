import { describe, expect, it } from "vitest";
import { resolvePageLayout, resolveSidebarLayout } from "./pageLayout";

describe("resolvePageLayout", () => {
  const activeProfile = { hasActiveProfile: true };
  const activityPath = "/activities/12";
  const segmentPath = "/segments/4";

  it("uses the empty layout for list routes", () => {
    expect(resolvePageLayout({ pathname: "/segments", ...activeProfile })).toBe("empty");
    expect(resolvePageLayout({ pathname: "/activities", ...activeProfile })).toBe("empty");
  });

  it("uses the data layout for entity details and keeps activity route modal-based", () => {
    expect(resolvePageLayout({ pathname: activityPath, ...activeProfile })).toBe("data");
    expect(
      resolvePageLayout({ pathname: activityPath, search: "?view=route", ...activeProfile }),
    ).toBe("data");
    expect(resolvePageLayout({ pathname: segmentPath, ...activeProfile })).toBe("data");
  });

  it("uses the map layout for segment task workspaces", () => {
    expect(
      resolvePageLayout({ pathname: segmentPath, search: "?view=compare", ...activeProfile }),
    ).toBe("map");
    expect(
      resolvePageLayout({ pathname: segmentPath, search: "?view=stretches", ...activeProfile }),
    ).toBe("map");
    expect(resolvePageLayout({ pathname: "/activities/12/segments/new", ...activeProfile })).toBe(
      "map",
    );
  });

  it("gives a missing active profile precedence over every route", () => {
    expect(
      resolvePageLayout({
        pathname: segmentPath,
        search: "?view=compare",
        hasActiveProfile: false,
      }),
    ).toBe("empty");
    expect(
      resolvePageLayout({ pathname: "/activities/12/segments/new", hasActiveProfile: false }),
    ).toBe("empty");
  });
});

describe("resolveSidebarLayout", () => {
  it("keeps navigation full on the landing canvas and collapses detail/task layouts to a rail", () => {
    expect(resolveSidebarLayout("empty", false)).toBe("full");
    expect(resolveSidebarLayout("data", false)).toBe("rail");
    expect(resolveSidebarLayout("map", false)).toBe("rail");
    expect(resolveSidebarLayout("data", true)).toBe("full");
    expect(resolveSidebarLayout("map", true)).toBe("full");
  });
});
