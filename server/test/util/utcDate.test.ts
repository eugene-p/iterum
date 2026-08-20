import { describe, expect, it } from "vitest";
import { addUtcDays, utcDateFromPgDate, utcDateFromTimestamptz } from "@/util/utcDate.js";

describe("utcDate", () => {
  it("uses the UTC calendar day rather than the local offset day", () => {
    expect(utcDateFromTimestamptz("2026-08-01T23:00:00-07:00")).toBe("2026-08-02");
  });

  it("preserves the calendar date returned by postgres DATE", () => {
    expect(utcDateFromPgDate(new Date(2026, 5, 23))).toBe("2026-06-23");
    expect(utcDateFromPgDate("2026-06-23")).toBe("2026-06-23");
  });

  it("adds calendar days without changing the date representation", () => {
    expect(addUtcDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addUtcDays("2026-03-01", 30)).toBe("2026-03-31");
  });
});
