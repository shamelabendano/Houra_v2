import { describe, expect, it } from "vitest";
import { formatCurrency, formatDayLabel, formatDuration, formatElapsedHms, formatHoursMinutes } from "./format";

describe("format", () => {
  it("formatDuration", () => {
    expect(formatDuration(3938)).toBe("01:05:38");
    expect(formatDuration(-5)).toBe("00:00:00");
  });
  it("formatHoursMinutes", () => expect(formatHoursMinutes(44460)).toBe("12:21"));
  it("formatElapsedHms", () => expect(formatElapsedHms(3938)).toBe("1h 05m 38s"));
  it("formatCurrency", () => expect(formatCurrency(100, "PHP")).toBe("₱100.00"));
  it("formatDayLabel", () => {
    const now = new Date("2026-03-18T12:00:00");
    expect(formatDayLabel("2026-03-18", now)).toBe("Today");
    expect(formatDayLabel("2026-03-17", now)).toBe("Yesterday");
  });
});
