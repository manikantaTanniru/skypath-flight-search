import { describe, expect, it } from "vitest";
import { diffMinutes, formatDuration, toInstant } from "../../src/utils/time";

describe("toInstant + diffMinutes", () => {
  it("computes elapsed minutes within the same timezone", () => {
    // SP110: JFK 07:00 -> ORD 08:30, both America/New_York
    const dep = toInstant("2024-03-15T07:00:00", "America/New_York");
    const arr = toInstant("2024-03-15T08:30:00", "America/New_York");
    expect(diffMinutes(arr, dep)).toBe(90);
  });

  it("computes elapsed minutes correctly across timezones (same calendar date)", () => {
    // SP101: JFK 08:30 America/New_York -> LAX 11:45 America/Los_Angeles
    const dep = toInstant("2024-03-15T08:30:00", "America/New_York");
    const arr = toInstant("2024-03-15T11:45:00", "America/Los_Angeles");
    expect(diffMinutes(arr, dep)).toBe(375);
  });

  it("computes elapsed minutes correctly across the international date line", () => {
    // SP540: SYD 09:00 (Australia/Sydney) -> LAX 06:00 (America/Los_Angeles), same
    // calendar date in the raw strings even though the flight takes ~15 hours -
    // arrival's local clock time looks earlier than departure's.
    const dep = toInstant("2024-03-15T09:00:00", "Australia/Sydney");
    const arr = toInstant("2024-03-15T06:00:00", "America/Los_Angeles");
    const minutes = diffMinutes(arr, dep);
    expect(minutes).toBeGreaterThan(0);
    expect(minutes).toBe(900); // 15h
  });

  it("throws on an invalid timezone", () => {
    expect(() => toInstant("2024-03-15T09:00:00", "Not/AZone")).toThrow();
  });
});

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(375)).toBe("6h 15m");
  });

  it("formats whole hours", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats minutes only", () => {
    expect(formatDuration(45)).toBe("45m");
  });
});
