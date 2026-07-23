import { describe, expect, it } from "vitest";
import { matchesFuzzySearch, scoreFuzzySearch } from "./fuzzySearch";

describe("fuzzySearch", () => {
  const fields = {
    tags: ["morning", "run", "hills"],
    name: "Morning run in Kitsilano (hills)",
    extras: ["Kitsilano", "86836-activity.tcx"],
  };

  it("matches tag substrings before needing the name", () => {
    expect(matchesFuzzySearch(fields, "run")).toBe(true);
    expect(scoreFuzzySearch(fields, "run").matchedViaTags).toBe(true);
  });

  it("fuzzy-matches tags with missing characters", () => {
    expect(matchesFuzzySearch(fields, "hil")).toBe(true);
    expect(scoreFuzzySearch(fields, "hil").matchedViaTags).toBe(true);
  });

  it("requires every token to match tags or name", () => {
    expect(matchesFuzzySearch(fields, "morning run")).toBe(true);
    expect(matchesFuzzySearch(fields, "morning bike")).toBe(false);
  });

  it("falls back to name when token does not match a tag", () => {
    expect(matchesFuzzySearch(fields, "kitsilano")).toBe(true);
    const result = scoreFuzzySearch(fields, "kitsilano");
    expect(result.matchedViaTags).toBe(false);
    expect(result.score).toBeGreaterThan(0);
  });

  it("ranks tag matches above name matches", () => {
    const tagFirst = scoreFuzzySearch(fields, "run");
    const nameFirst = scoreFuzzySearch(fields, "kits");
    expect(tagFirst.score).toBeGreaterThan(nameFirst.score);
  });

  it("uses extras only after tags and name", () => {
    expect(matchesFuzzySearch(fields, "86836")).toBe(true);
    expect(scoreFuzzySearch(fields, "86836").score).toBeLessThan(scoreFuzzySearch(fields, "run").score);
  });
});