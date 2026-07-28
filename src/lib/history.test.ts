import { describe, it, expect } from "vitest";
import {
  weekStart,
  weekEnd,
  weekStartKey,
  isCurrentWeek,
  weekLabel,
  formatDuration,
  summarizeAllHistory,
  buildTimeLogCsv,
} from "./history";
import type { BilledPeriod, Client, Project, TimeEntry } from "../types";

function makeClient(overrides: Partial<Client> = {}): Client {
  return { id: "c1", name: "Acme", createdAt: "2026-01-01T00:00:00", ...overrides };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    clientId: "c1",
    name: "Project",
    createdAt: "2026-01-01T00:00:00",
    interval: "hourly",
    rate: 100,
    currency: "USD",
    ...overrides,
  };
}

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: "e1",
    clientId: "c1",
    projectId: "p1",
    startedAt: "2026-07-06T09:00:00",
    endedAt: "2026-07-06T10:00:00",
    durationSeconds: 3600,
    note: null,
    ...overrides,
  };
}

describe("weekStart / weekEnd", () => {
  it("returns the Monday of the week for a mid-week date", () => {
    // 2026-07-08 is a Wednesday
    const start = weekStart(new Date(2026, 6, 8));
    expect(start).toEqual(new Date(2026, 6, 6));
  });

  it("is a no-op when the anchor is already a Monday", () => {
    const start = weekStart(new Date(2026, 6, 6));
    expect(start).toEqual(new Date(2026, 6, 6));
  });

  it("rolls a Sunday back 6 days to the preceding Monday", () => {
    const start = weekStart(new Date(2026, 6, 12));
    expect(start).toEqual(new Date(2026, 6, 6));
  });

  it("returns exactly 7 days after weekStart", () => {
    const end = weekEnd(new Date(2026, 6, 8));
    expect(end).toEqual(new Date(2026, 6, 13));
  });
});

describe("weekStartKey", () => {
  it("is a zero-padded YYYY-MM-DD for that week's Monday", () => {
    expect(weekStartKey(new Date(2026, 6, 8))).toBe("2026-07-06");
  });

  it("sorts chronologically as a plain string for adjacent weeks", () => {
    const thisWeek = weekStartKey(new Date(2026, 6, 8));
    const nextWeek = weekStartKey(new Date(2026, 6, 15));
    expect(thisWeek < nextWeek).toBe(true);
  });
});

describe("isCurrentWeek", () => {
  it("is true for two dates in the same week", () => {
    expect(isCurrentWeek(new Date(2026, 6, 6), new Date(2026, 6, 10))).toBe(true);
  });

  it("is false for the following week", () => {
    expect(isCurrentWeek(new Date(2026, 6, 6), new Date(2026, 6, 13))).toBe(false);
  });

  it("is false right at the Sunday-to-Monday boundary", () => {
    const sundayNight = new Date(2026, 6, 12, 23, 59);
    const nextMonday = new Date(2026, 6, 13, 0, 0);
    expect(isCurrentWeek(sundayNight, nextMonday)).toBe(false);
  });
});

describe("weekLabel", () => {
  it("labels the current week as 'This week'", () => {
    const now = new Date(2026, 6, 8);
    expect(weekLabel(new Date(2026, 6, 8), now)).toBe("This week");
  });

  it("omits the year for a past week within the same year", () => {
    const anchor = new Date(2026, 5, 3); // week of Mon 2026-06-01
    const now = new Date(2026, 6, 28);
    const start = weekStart(anchor);
    const end = new Date(2026, 5, 7);
    const expected = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    expect(weekLabel(anchor, now)).toBe(expected);
  });

  it("includes the year on the end date for a week spanning a year boundary", () => {
    const anchor = new Date(2025, 11, 30); // week of Mon 2025-12-29 -> Sun 2026-01-04
    const now = new Date(2026, 6, 28);
    const start = weekStart(anchor);
    const end = new Date(2026, 0, 4);
    const expected = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    expect(weekLabel(anchor, now)).toBe(expected);
  });
});

describe("formatDuration", () => {
  it("formats 0 seconds as 0m", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("omits the hour segment when there are 0 whole hours", () => {
    expect(formatDuration(90)).toBe("2m"); // rounds up
  });

  it("formats exactly one hour", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
  });

  it("rounds the minutes remainder", () => {
    expect(formatDuration(3661)).toBe("1h 1m");
  });
});

describe("summarizeAllHistory", () => {
  it("floors hourly billing to whole completed hours but shows full live elapsed time in the display", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "hourly", rate: 100 })];
    const entries = [
      // one closed hour
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      // plus a still-open entry contributing 30 more live minutes
      makeEntry({ id: "e2", projectId: "p1", startedAt: "2026-07-07T09:00:00", endedAt: null, durationSeconds: 0 }),
    ];
    const now = new Date(2026, 6, 7, 9, 30); // 30 minutes after e2 started

    const result = summarizeAllHistory(entries, projects, clients, [], now);

    expect(result).toHaveLength(1);
    const [period] = result[0].periods;
    // total live seconds = 3600 + 1800 = 5400 -> display 1h 30m, but billed
    // quantity floors to 1 completed hour, not 1.5
    expect(period.display).toBe("1h 30m");
    expect(period.amount).toBe(100);
  });

  it("returns null amount when the project has no rate, regardless of quantity", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p2", interval: "daily", rate: null })];
    const entries = [
      makeEntry({ id: "e1", projectId: "p2", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e2", projectId: "p2", startedAt: "2026-07-06T14:00:00", endedAt: "2026-07-06T15:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e3", projectId: "p2", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T10:00:00", durationSeconds: 3600 }),
    ];

    const result = summarizeAllHistory(entries, projects, clients, []);

    const [period] = result[0].periods;
    // two same-day entries count as 1 day, the third entry is a second day
    expect(period.display).toBe("2 days");
    expect(period.amount).toBeNull();
  });

  it("counts all entries in a period as a single week for weekly-interval projects", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p3", interval: "weekly", rate: 200 })];
    const entries = [
      makeEntry({ id: "e1", projectId: "p3", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e2", projectId: "p3", startedAt: "2026-07-08T09:00:00", endedAt: "2026-07-08T10:00:00", durationSeconds: 3600 }),
    ];

    const result = summarizeAllHistory(entries, projects, clients, []);

    const [period] = result[0].periods;
    expect(period.display).toBe("1 week");
    expect(period.amount).toBe(200);
  });

  it("matches billed/invoiceId from billedPeriods by projectId::periodStart, leaving unmatched periods unbilled", () => {
    const clients = [makeClient()];
    const projects = [
      makeProject({ id: "p1", name: "Billed Project" }),
      makeProject({ id: "p2", name: "Unbilled Project" }),
    ];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1" }),
      makeEntry({ id: "e2", projectId: "p2" }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: "INV-1" },
    ];

    const result = summarizeAllHistory(entries, projects, clients, billedPeriods);

    const p1 = result.find((r) => r.projectId === "p1")!;
    const p2 = result.find((r) => r.projectId === "p2")!;
    expect(p1.periods[0].billed).toBe(true);
    expect(p1.periods[0].invoiceId).toBe("INV-1");
    expect(p2.periods[0].billed).toBe(false);
    expect(p2.periods[0].invoiceId).toBeNull();
  });

  it("sorts projects by client name then project name, and omits projects with no entries", () => {
    const clients = [makeClient({ id: "c1", name: "Acme" }), makeClient({ id: "c2", name: "Zulu" })];
    const projects = [
      makeProject({ id: "p1", clientId: "c1", name: "Bravo" }),
      makeProject({ id: "p2", clientId: "c1", name: "Alpha" }),
      makeProject({ id: "p3", clientId: "c2", name: "Solo" }),
      makeProject({ id: "p4", clientId: "c1", name: "NoEntries" }),
    ];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1" }),
      makeEntry({ id: "e2", projectId: "p2" }),
      makeEntry({ id: "e3", projectId: "p3" }),
    ];

    const result = summarizeAllHistory(entries, projects, clients, []);

    expect(result.map((r) => r.projectId)).toEqual(["p2", "p1", "p3"]);
  });
});

describe("buildTimeLogCsv", () => {
  it("includes an Amount column only for hourly projects with a rate", () => {
    const hourlyWithRate = makeProject({ interval: "hourly", rate: 100 });
    const daily = makeProject({ interval: "daily", rate: 50 });
    const hourlyNoRate = makeProject({ interval: "hourly", rate: null });

    expect(buildTimeLogCsv([], hourlyWithRate, false, null).split("\n")[0]).toContain("Amount");
    expect(buildTimeLogCsv([], daily, false, null).split("\n")[0]).not.toContain("Amount");
    expect(buildTimeLogCsv([], hourlyNoRate, false, null).split("\n")[0]).not.toContain("Amount");
  });

  it("excludes the still-open entry and sorts rows chronologically", () => {
    const project = makeProject({ interval: "hourly", rate: 100 });
    const entries = [
      makeEntry({ id: "later", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "earlier", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "open", startedAt: "2026-07-08T09:00:00", endedAt: null, durationSeconds: 0 }),
    ];

    const rows = buildTimeLogCsv(entries, project, false, null).split("\n").slice(1);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("2026-07-06");
    expect(rows[1]).toContain("2026-07-07");
  });

  it("escapes quotes in notes and doesn't break columns on commas", () => {
    const project = makeProject({ interval: "hourly", rate: 100 });
    const entries = [
      makeEntry({ note: 'said "hi", then left' }),
    ];

    const csv = buildTimeLogCsv(entries, project, false, null);

    expect(csv).toContain('"said ""hi"", then left"');
  });

  it("rounds down to completed hours for the Amount column and repeats billed/invoiceId on every row", () => {
    const project = makeProject({ interval: "hourly", rate: 100 });
    const entries = [
      makeEntry({ id: "e1", durationSeconds: 5400 }), // 1h30m -> bills 1 hour
    ];

    const csv = buildTimeLogCsv(entries, project, true, "INV-9");
    const row = csv.split("\n")[1];

    expect(row).toContain("100.00");
    expect(row).toContain("Yes");
    expect(row).toContain('"INV-9"');
  });
});
