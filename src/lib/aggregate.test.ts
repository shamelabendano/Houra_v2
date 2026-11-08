import { describe, expect, it } from "vitest";
import {
  durationSec,
  earnings,
  effectiveRate,
  goalProgress,
  inRange,
  rangeForPreset,
  tagChartData,
  totalByDay,
  totalByTag,
  totalSec,
} from "./aggregate";
import type { Session, Tag } from "../types";

// Test-only fixtures; real tag names live in seed.ts.
const tag = (id: string, over: Partial<Tag> = {}): Tag => ({
  id,
  name: id,
  color: "#123456",
  icon: "code",
  parentId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const session = (id: string, startedAt: string, endedAt: string | null, tagId: string | null = null): Session => ({
  id,
  title: id,
  tagId,
  startedAt,
  endedAt,
  source: "manual",
});

const NOW = new Date("2026-03-18T12:00:00").getTime(); // a Wednesday

describe("durationSec", () => {
  it("is endedAt - startedAt", () => {
    expect(durationSec(session("a", "2026-03-18T10:00:00", "2026-03-18T10:30:00"))).toBe(1800);
  });
  it("counts a running session up to now", () => {
    expect(durationSec(session("a", "2026-03-18T11:00:00", null), NOW)).toBe(3600);
  });
  it("never goes negative", () => {
    expect(durationSec(session("a", "2026-03-18T12:00:00", "2026-03-18T11:00:00"))).toBe(0);
  });
});

describe("totals", () => {
  const sessions = [
    session("a", "2026-03-18T09:00:00", "2026-03-18T10:00:00", "t1"),
    session("b", "2026-03-18T10:00:00", "2026-03-18T10:30:00", "t1"),
    session("c", "2026-03-17T10:00:00", "2026-03-17T11:00:00", null),
  ];
  it("totalByTag keys untagged separately", () => {
    expect(totalByTag(sessions, NOW)).toEqual({ t1: 5400, untagged: 3600 });
  });
  it("totalSec equals the sum of chart data", () => {
    const chart = tagChartData(sessions, [tag("t1")], NOW);
    expect(chart.reduce((s, d) => s + d.seconds, 0)).toBe(totalSec(sessions, NOW));
  });
  it("totalByDay groups newest day first with day totals", () => {
    const groups = totalByDay(sessions, NOW);
    expect(groups.map((g) => g.day)).toEqual(["2026-03-18", "2026-03-17"]);
    expect(groups[0].totalSec).toBe(5400);
    expect(groups[0].sessions.map((s) => s.id)).toEqual(["b", "a"]);
  });
});

describe("ranges", () => {
  const now = new Date("2026-03-18T12:00:00");
  it("weeks start on Monday", () => {
    const r = rangeForPreset("thisWeek", now);
    expect(r.start.getDay()).toBe(1);
    expect(r.start.getDate()).toBe(16);
  });
  it("lastWeek is the seven days before thisWeek", () => {
    const r = rangeForPreset("lastWeek", now);
    expect(r.start.getDate()).toBe(9);
    expect(r.end.getDate()).toBe(15);
  });
  it("inRange uses the start time, inclusive", () => {
    const r = rangeForPreset("today", now);
    expect(inRange(session("a", "2026-03-18T00:00:00", "2026-03-18T01:00:00"), r)).toBe(true);
    expect(inRange(session("b", "2026-03-17T23:59:59", "2026-03-18T01:00:00"), r)).toBe(false);
  });
});

describe("earnings", () => {
  const tags = [tag("p", { hourlyRate: 200 }), tag("c", { parentId: "p" }), tag("free")];
  it("a 30-minute session at 200/hr is 100", () => {
    const s = [session("a", "2026-03-18T10:00:00", "2026-03-18T10:30:00", "p")];
    expect(earnings(s, tags, NOW).total).toBe(100);
  });
  it("sub-tags inherit the parent's rate", () => {
    expect(effectiveRate(tags[1], tags)).toBe(200);
  });
  it("a sub-tag's own rate wins over the parent's", () => {
    const t = [tag("p", { hourlyRate: 200 }), tag("c", { parentId: "p", hourlyRate: 300 })];
    expect(effectiveRate(t[1], t)).toBe(300);
  });
  it("untagged and rateless tags earn nothing", () => {
    const s = [
      session("a", "2026-03-18T10:00:00", "2026-03-18T11:00:00", null),
      session("b", "2026-03-18T10:00:00", "2026-03-18T11:00:00", "free"),
    ];
    expect(earnings(s, tags, NOW).total).toBe(0);
  });
  it("rows sum to the total", () => {
    const s = [
      session("a", "2026-03-18T10:00:00", "2026-03-18T10:20:07", "p"),
      session("b", "2026-03-18T11:00:00", "2026-03-18T11:13:41", "c"),
    ];
    const e = earnings(s, tags, NOW);
    expect(Object.values(e.byTag).reduce((a, b) => a + b, 0)).toBeCloseTo(e.total, 2);
  });
});

describe("goalProgress", () => {
  const tags = [tag("p", { weeklyGoalSec: 7200 }), tag("c", { parentId: "p" })];
  it("counts sub-tag time toward the parent's goal, this week only", () => {
    const s = [
      session("a", "2026-03-18T09:00:00", "2026-03-18T10:00:00", "p"),
      session("b", "2026-03-17T09:00:00", "2026-03-17T09:30:00", "c"),
      session("old", "2026-03-02T09:00:00", "2026-03-02T12:00:00", "p"),
    ];
    const g = goalProgress("p", s, tags, NOW);
    expect(g.trackedSec).toBe(5400);
    expect(g.fraction).toBeCloseTo(0.75);
  });
  it("clamps to 1 and returns null without a goal", () => {
    const s = [session("a", "2026-03-18T01:00:00", "2026-03-18T11:00:00", "p")];
    expect(goalProgress("p", s, tags, NOW).fraction).toBe(1);
    expect(goalProgress("c", s, tags, NOW).fraction).toBeNull();
  });
});
