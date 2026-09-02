import { describe, it, expect } from "vitest";
import {
  weekStart,
  weekEnd,
  weekStartKey,
  billedPeriodKeyFor,
  isCurrentWeek,
  weekLabel,
  formatDuration,
  summarizeAllHistory,
  summarizeUnbilledTotal,
  hideBilledPeriods,
  groupHistoryByClient,
  buildTimeLogCsv,
  buildReportRows,
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

describe("billedPeriodKeyFor", () => {
  it("uses the week's Monday for a weekly-interval project", () => {
    const project = makeProject({ interval: "weekly" });
    // 2026-07-08 is a Wednesday.
    expect(billedPeriodKeyFor(project, new Date(2026, 6, 8))).toBe("2026-07-06");
  });

  it("uses the entry's own day for hourly/daily-interval projects", () => {
    const hourly = makeProject({ interval: "hourly" });
    const daily = makeProject({ interval: "daily" });
    expect(billedPeriodKeyFor(hourly, new Date(2026, 6, 8))).toBe("2026-07-08");
    expect(billedPeriodKeyFor(daily, new Date(2026, 6, 8))).toBe("2026-07-08");
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
  it("bills hourly time exactly, matching the live elapsed time in the display", () => {
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
    // total live seconds = 3600 + 1800 = 5400 -> 1h 30m, billed exactly (not
    // floored to the 1 completed hour)
    expect(period.display).toBe("1h 30m");
    expect(period.amount).toBe(150);
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

  it("orders projects by their most recently logged period, most recent first", () => {
    const clients = [makeClient({ id: "c1", name: "Acme" }), makeClient({ id: "c2", name: "Zulu" })];
    const projects = [
      makeProject({ id: "p1", clientId: "c1", name: "Bravo" }),
      makeProject({ id: "p2", clientId: "c1", name: "Alpha" }),
      makeProject({ id: "p3", clientId: "c2", name: "Solo" }),
      makeProject({ id: "p4", clientId: "c1", name: "NoEntries" }),
    ];
    const entries = [
      // p1 was logged longest ago, p3 in between, p2 most recently — despite
      // "Alpha" sorting first alphabetically, recency should win.
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-01-05T09:00:00" }),
      makeEntry({ id: "e2", projectId: "p3", startedAt: "2026-04-06T09:00:00" }),
      makeEntry({ id: "e3", projectId: "p2", startedAt: "2026-07-13T09:00:00" }),
    ];

    const result = summarizeAllHistory(entries, projects, clients, []);

    expect(result.map((r) => r.projectId)).toEqual(["p2", "p3", "p1"]);
  });

  it("tie-breaks by client name then project name when projects share the same most recent period, and omits projects with no entries", () => {
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

  it("gives weekly-interval periods no day breakdown", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "weekly", rate: 200 })];
    const entries = [makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00" })];

    const [period] = summarizeAllHistory(entries, projects, clients, [])[0].periods;

    expect(period.days).toBeNull();
  });

  it("splits an hourly-interval week into a per-day breakdown, most recent day first", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "hourly", rate: 100 })];
    const entries = [
      // Monday: two sessions totalling 2h. Tuesday: 1h.
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e2", projectId: "p1", startedAt: "2026-07-06T14:00:00", endedAt: "2026-07-06T15:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e3", projectId: "p1", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T10:00:00", durationSeconds: 3600 }),
    ];

    const [period] = summarizeAllHistory(entries, projects, clients, [])[0].periods;

    expect(period.days).toHaveLength(2);
    expect(period.days![0].dayKey).toBe("2026-07-07");
    expect(period.days![0].display).toBe("1h 0m");
    expect(period.days![0].amount).toBe(100);
    expect(period.days![1].dayKey).toBe("2026-07-06");
    expect(period.days![1].display).toBe("2h 0m");
    expect(period.days![1].amount).toBe(200);
  });

  it("marks a period billed only when every day is billed, sharing the invoice id when uniform", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "hourly", rate: 100 })];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
      makeEntry({ id: "e2", projectId: "p1", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T10:00:00" }),
    ];
    const oneDayBilled: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: "INV-1" },
    ];
    const bothDaysBilled: BilledPeriod[] = [
      ...oneDayBilled,
      { id: "b2", projectId: "p1", periodStart: "2026-07-07", billedAt: "2026-07-10T00:00:00", invoiceId: "INV-1" },
    ];

    const [partial] = summarizeAllHistory(entries, projects, clients, oneDayBilled)[0].periods;
    expect(partial.billed).toBe(false);
    expect(partial.invoiceId).toBeNull();
    expect(partial.days!.filter((d) => d.billed)).toHaveLength(1);

    const [full] = summarizeAllHistory(entries, projects, clients, bothDaysBilled)[0].periods;
    expect(full.billed).toBe(true);
    expect(full.invoiceId).toBe("INV-1");
  });
});

describe("hideBilledPeriods", () => {
  it("removes billed periods but keeps unbilled ones within the same project", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1" })];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00" }),
      makeEntry({ id: "e2", projectId: "p1", startedAt: "2026-07-13T09:00:00" }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: null },
    ];

    const groups = summarizeAllHistory(entries, projects, clients, billedPeriods);
    const result = hideBilledPeriods(groups);

    expect(result).toHaveLength(1);
    expect(result[0].periods).toHaveLength(1);
    expect(result[0].periods[0].periodStartKey).toBe("2026-07-13");
  });

  it("drops a project entirely when every one of its periods is billed", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", name: "All billed" }), makeProject({ id: "p2", name: "Still open" })];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00" }),
      makeEntry({ id: "e2", projectId: "p2", startedAt: "2026-07-06T09:00:00" }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: null },
    ];

    const groups = summarizeAllHistory(entries, projects, clients, billedPeriods);
    const result = hideBilledPeriods(groups);

    expect(result.map((r) => r.projectId)).toEqual(["p2"]);
  });

  it("is a no-op when nothing is billed", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1" })];
    const entries = [makeEntry({ id: "e1", projectId: "p1" })];

    const groups = summarizeAllHistory(entries, projects, clients, []);
    const result = hideBilledPeriods(groups);

    expect(result).toEqual(groups);
  });

  it("drops only the billed days from a partially-billed hourly-interval week, keeping the rest", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "hourly", rate: 100 })];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
      makeEntry({ id: "e2", projectId: "p1", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T10:00:00" }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: null },
    ];

    const groups = summarizeAllHistory(entries, projects, clients, billedPeriods);
    const [result] = hideBilledPeriods(groups);

    expect(result.periods).toHaveLength(1);
    expect(result.periods[0].days).toHaveLength(1);
    expect(result.periods[0].days![0].dayKey).toBe("2026-07-07");
  });
});

describe("groupHistoryByClient", () => {
  it("sums unbilled amounts across a client's projects that share a currency", () => {
    const clients = [makeClient({ id: "c1", name: "Acme" })];
    const projects = [
      makeProject({ id: "p1", clientId: "c1", interval: "hourly", rate: 100, currency: "USD" }),
      makeProject({ id: "p2", clientId: "c1", interval: "hourly", rate: 50, currency: "USD" }),
    ];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T11:00:00", durationSeconds: 7200 }),
      makeEntry({ id: "e2", projectId: "p2", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
    ];

    const groups = summarizeAllHistory(entries, projects, clients, []);
    const [clientHistory] = groupHistoryByClient(groups, projects);

    // p1: 2h * 100 = 200, p2: 1h * 50 = 50
    expect(clientHistory.unbilledTotals).toEqual([{ currency: "USD", amount: 250 }]);
    expect(clientHistory.projects.map((p) => p.projectId).sort()).toEqual(["p1", "p2"]);
  });

  it("keeps mixed currencies separate rather than adding them together", () => {
    const clients = [makeClient({ id: "c1", name: "Acme" })];
    const projects = [
      makeProject({ id: "p1", clientId: "c1", interval: "hourly", rate: 100, currency: "USD" }),
      makeProject({ id: "p2", clientId: "c1", interval: "hourly", rate: 50, currency: "AUD" }),
    ];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e2", projectId: "p2", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
    ];

    const groups = summarizeAllHistory(entries, projects, clients, []);
    const [clientHistory] = groupHistoryByClient(groups, projects);

    expect(clientHistory.unbilledTotals).toEqual([
      { currency: "AUD", amount: 50 },
      { currency: "USD", amount: 100 },
    ]);
  });

  it("contributes no figure for a project with no rate set", () => {
    const clients = [makeClient({ id: "c1", name: "Acme" })];
    const projects = [
      makeProject({ id: "p1", clientId: "c1", interval: "hourly", rate: 100, currency: "USD" }),
      makeProject({ id: "p2", clientId: "c1", interval: "daily", rate: null, currency: null }),
    ];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e2", projectId: "p2", startedAt: "2026-07-06T09:00:00" }),
    ];

    const groups = summarizeAllHistory(entries, projects, clients, []);
    const [clientHistory] = groupHistoryByClient(groups, projects);

    expect(clientHistory.unbilledTotals).toEqual([{ currency: "USD", amount: 100 }]);
    expect(clientHistory.projects).toHaveLength(2);
  });

  it("orders clients by unbilled amount owed, highest first", () => {
    const clients = [
      makeClient({ id: "c1", name: "Acme" }),
      makeClient({ id: "c2", name: "Big Co" }),
      makeClient({ id: "c3", name: "Zero Co" }),
    ];
    const projects = [
      makeProject({ id: "p1", clientId: "c1", interval: "hourly", rate: 100, currency: "USD" }),
      makeProject({ id: "p2", clientId: "c2", interval: "hourly", rate: 500, currency: "USD" }),
      makeProject({ id: "p3", clientId: "c3", interval: "daily", rate: null, currency: null }),
    ];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e2", projectId: "p2", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e3", projectId: "p3", startedAt: "2026-07-06T09:00:00" }),
    ];

    const groups = summarizeAllHistory(entries, projects, clients, []);
    const result = groupHistoryByClient(groups, projects);

    expect(result.map((c) => c.clientId)).toEqual(["c2", "c1", "c3"]);
  });
});

describe("summarizeUnbilledTotal", () => {
  it("totals only the unbilled periods for an hourly project, ignoring billed ones", () => {
    const clients = [makeClient()];
    const project = makeProject({ id: "p1", interval: "hourly", rate: 100 });
    const entries = [
      // billed week: 2h
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T11:00:00", durationSeconds: 7200 }),
      // unbilled week: 1h30m
      makeEntry({ id: "e2", projectId: "p1", startedAt: "2026-07-13T09:00:00", endedAt: "2026-07-13T10:30:00", durationSeconds: 5400 }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: null },
    ];

    const [history] = summarizeAllHistory(entries, [project], clients, billedPeriods);
    const result = summarizeUnbilledTotal(history, project);

    expect(result.display).toBe("1h 30m");
    expect(result.amount).toBe(150);
  });

  it("returns a null amount when the project has no rate", () => {
    const clients = [makeClient()];
    const project = makeProject({ id: "p1", interval: "daily", rate: null });
    const entries = [makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00" })];

    const [history] = summarizeAllHistory(entries, [project], clients, []);
    const result = summarizeUnbilledTotal(history, project);

    expect(result.display).toBe("1 day");
    expect(result.amount).toBeNull();
  });

  it("counts only the unbilled days of a partially-billed hourly-interval week — the 'billed Monday, not today' case", () => {
    const clients = [makeClient()];
    const project = makeProject({ id: "p1", interval: "hourly", rate: 100 });
    const entries = [
      // Monday: 1h, billed. Tuesday: 2h, unbilled.
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "e2", projectId: "p1", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T11:00:00", durationSeconds: 7200 }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: null },
    ];

    const [history] = summarizeAllHistory(entries, [project], clients, billedPeriods);
    const result = summarizeUnbilledTotal(history, project);

    expect(result.display).toBe("2h 0m");
    expect(result.amount).toBe(200);
  });
});

describe("buildTimeLogCsv", () => {
  it("includes an Amount column only for hourly projects with a rate", () => {
    const hourlyWithRate = makeProject({ interval: "hourly", rate: 100 });
    const daily = makeProject({ interval: "daily", rate: 50 });
    const hourlyNoRate = makeProject({ interval: "hourly", rate: null });

    expect(buildTimeLogCsv([], hourlyWithRate, []).split("\n")[0]).toContain("Amount");
    expect(buildTimeLogCsv([], daily, []).split("\n")[0]).not.toContain("Amount");
    expect(buildTimeLogCsv([], hourlyNoRate, []).split("\n")[0]).not.toContain("Amount");
  });

  it("excludes the still-open entry and sorts rows chronologically", () => {
    const project = makeProject({ interval: "hourly", rate: 100 });
    const entries = [
      makeEntry({ id: "later", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "earlier", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "open", startedAt: "2026-07-08T09:00:00", endedAt: null, durationSeconds: 0 }),
    ];

    const rows = buildTimeLogCsv(entries, project, []).split("\n").slice(1);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("2026-07-06");
    expect(rows[1]).toContain("2026-07-07");
  });

  it("escapes quotes in notes and doesn't break columns on commas", () => {
    const project = makeProject({ interval: "hourly", rate: 100 });
    const entries = [
      makeEntry({ note: 'said "hi", then left' }),
    ];

    const csv = buildTimeLogCsv(entries, project, []);

    expect(csv).toContain('"said ""hi"", then left"');
  });

  it("rounds down to completed hours for the Amount column and looks up billed/invoiceId per row's own day", () => {
    const project = makeProject({ id: "p1", interval: "hourly", rate: 100 });
    const entries = [
      // 2026-07-06 is a Monday.
      makeEntry({ id: "e1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:30:00", durationSeconds: 5400 }), // 1h30m -> bills 1 hour
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: "INV-9" },
    ];

    const csv = buildTimeLogCsv(entries, project, billedPeriods);
    const row = csv.split("\n")[1];

    expect(row).toContain("100.00");
    expect(row).toContain("Yes");
    expect(row).toContain('"INV-9"');
  });

  it("bills different days within the same export independently for an hourly project", () => {
    const project = makeProject({ id: "p1", interval: "hourly", rate: 100 });
    const entries = [
      // Monday and Tuesday of the same week.
      makeEntry({ id: "mon", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00", durationSeconds: 3600 }),
      makeEntry({ id: "tue", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T10:00:00", durationSeconds: 3600 }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: null },
    ];

    const rows = buildTimeLogCsv(entries, project, billedPeriods).split("\n").slice(1);

    expect(rows[0]).toContain("2026-07-06");
    expect(rows[0]).toContain("Yes");
    expect(rows[1]).toContain("2026-07-07");
    expect(rows[1]).toContain("No");
  });
});

describe("buildReportRows", () => {
  it("only includes closed entries within [start, end)", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "hourly", rate: 100 })];
    const entries = [
      makeEntry({ id: "before", startedAt: "2026-07-01T09:00:00", endedAt: "2026-07-01T10:00:00" }),
      makeEntry({ id: "inRange", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
      makeEntry({ id: "onEndBoundary", startedAt: "2026-07-13T00:00:00", endedAt: "2026-07-13T01:00:00" }),
      makeEntry({ id: "open", startedAt: "2026-07-07T09:00:00", endedAt: null, durationSeconds: 0 }),
    ];

    const sections = buildReportRows(entries, projects, clients, [], new Date(2026, 6, 6), new Date(2026, 6, 13));

    expect(sections).toHaveLength(1);
    expect(sections[0].rows).toHaveLength(1);
    expect(sections[0].rows[0].date).toBe("2026-07-06");
  });

  it("narrows to the given client and/or project", () => {
    const clients = [makeClient({ id: "c1", name: "Acme" }), makeClient({ id: "c2", name: "Globex" })];
    const projects = [
      makeProject({ id: "p1", clientId: "c1", name: "Website" }),
      makeProject({ id: "p2", clientId: "c2", name: "App" }),
    ];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
      makeEntry({ id: "e2", projectId: "p2", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
    ];
    const start = new Date(2026, 6, 1);
    const end = new Date(2026, 6, 31);

    const byClient = buildReportRows(entries, projects, clients, [], start, end, { clientId: "c1" });
    const byProject = buildReportRows(entries, projects, clients, [], start, end, { projectId: "p2" });

    expect(byClient.map((s) => s.projectName)).toEqual(["Website"]);
    expect(byProject.map((s) => s.projectName)).toEqual(["App"]);
  });

  it("looks up billed status per entry's own week, not a single value for the whole range", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "hourly", rate: 100 })];
    const entries = [
      makeEntry({ id: "e1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
      makeEntry({ id: "e2", startedAt: "2026-07-13T09:00:00", endedAt: "2026-07-13T10:00:00" }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: "INV-1" },
    ];

    const [section] = buildReportRows(
      entries,
      projects,
      clients,
      billedPeriods,
      new Date(2026, 6, 6),
      new Date(2026, 6, 20),
    );

    const week1 = section.rows.find((r) => r.date === "2026-07-06")!;
    const week2 = section.rows.find((r) => r.date === "2026-07-13")!;
    expect(week1.billed).toBe(true);
    expect(week1.invoiceId).toBe("INV-1");
    expect(week2.billed).toBe(false);
    expect(week2.invoiceId).toBeNull();
  });

  it("bills different days of the same week independently for an hourly-interval project", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "hourly", rate: 100 })];
    const entries = [
      makeEntry({ id: "mon", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
      makeEntry({ id: "tue", startedAt: "2026-07-07T09:00:00", endedAt: "2026-07-07T10:00:00" }),
    ];
    const billedPeriods: BilledPeriod[] = [
      { id: "b1", projectId: "p1", periodStart: "2026-07-06", billedAt: "2026-07-10T00:00:00", invoiceId: "INV-1" },
    ];

    const [section] = buildReportRows(
      entries,
      projects,
      clients,
      billedPeriods,
      new Date(2026, 6, 6),
      new Date(2026, 6, 13),
    );

    const monday = section.rows.find((r) => r.date === "2026-07-06")!;
    const tuesday = section.rows.find((r) => r.date === "2026-07-07")!;
    expect(monday.billed).toBe(true);
    expect(tuesday.billed).toBe(false);
  });

  it("only computes a per-row amount for hourly projects with a rate", () => {
    const clients = [makeClient()];
    const projects = [makeProject({ id: "p1", interval: "daily", rate: 200 })];
    const entries = [makeEntry({ id: "e1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" })];

    const [section] = buildReportRows(entries, projects, clients, [], new Date(2026, 6, 1), new Date(2026, 6, 31));

    expect(section.rows[0].amount).toBeNull();
  });

  it("omits projects with no entries in range and sorts sections by client then project name", () => {
    const clients = [makeClient({ id: "c1", name: "Zulu" }), makeClient({ id: "c2", name: "Acme" })];
    const projects = [
      makeProject({ id: "p1", clientId: "c1", name: "Website" }),
      makeProject({ id: "p2", clientId: "c2", name: "App" }),
      makeProject({ id: "p3", clientId: "c2", name: "NoEntries" }),
    ];
    const entries = [
      makeEntry({ id: "e1", projectId: "p1", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
      makeEntry({ id: "e2", projectId: "p2", startedAt: "2026-07-06T09:00:00", endedAt: "2026-07-06T10:00:00" }),
    ];

    const sections = buildReportRows(entries, projects, clients, [], new Date(2026, 6, 1), new Date(2026, 6, 31));

    expect(sections.map((s) => s.projectName)).toEqual(["App", "Website"]);
  });
});
