import { describe, it, expect } from "vitest";
import { formatElapsed } from "./time";

describe("formatElapsed", () => {
  it("returns 00:00 when there's no start time", () => {
    expect(formatElapsed(null, new Date(2026, 0, 1, 12, 0, 0))).toBe("00:00");
  });

  it("formats sub-hour durations as MM:SS", () => {
    const start = "2026-01-01T12:00:00";
    const now = new Date(2026, 0, 1, 12, 5, 9);
    expect(formatElapsed(start, now)).toBe("05:09");
  });

  it("formats durations of an hour or more as HH:MM:SS", () => {
    const start = "2026-01-01T12:00:00";
    const now = new Date(2026, 0, 1, 13, 2, 3);
    expect(formatElapsed(start, now)).toBe("01:02:03");
  });

  it("clamps a negative delta (clock skew) to 0 instead of going negative", () => {
    const start = "2026-01-01T12:00:05";
    const now = new Date(2026, 0, 1, 12, 0, 0); // now is before startedAt
    expect(formatElapsed(start, now)).toBe("00:00");
  });
});
