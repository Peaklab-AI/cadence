import type { BilledPeriod, Client, Interval, Project, TimeEntry } from "../types";

/** One project's tracked time within a single calendar day — the finer
 * billing unit nested inside a week for hourly/daily-interval projects (see
 * ProjectPeriodHistory.days). Not used for weekly-interval projects, whose
 * rate is defined per week and can't be meaningfully split by day. */
export interface ProjectDayHistory {
  day: Date;
  /** "YYYY-MM-DD" for this specific day — see billedPeriodKeyFor(). */
  dayKey: string;
  display: string;
  billedQuantity: number;
  amount: number | null;
  billed: boolean;
  invoiceId: string | null;
}

/** One project's tracked time within a single week. */
export interface ProjectPeriodHistory {
  periodStart: Date;
  /** "YYYY-MM-DD" (that week's Monday) identity key — see weekStartKey(). */
  periodStartKey: string;
  display: string;
  /** Exact quantity in the project's own unit (hours/days/weeks) used to compute `amount` — summed across
   * periods to get a project's total unbilled quantity without re-deriving it from `display` strings. */
  billedQuantity: number;
  /** rate * quantity for this period, in the project's own unit; null if the project has no rate set. */
  amount: number | null;
  /** For hourly/daily-interval projects (where `days` is populated): true only when every day in the week is
   * billed. For weekly-interval projects (`days` is null): reflects the single week-level BilledPeriod record. */
  billed: boolean;
  /** Optional client-facing invoice reference; null when unbilled, not yet set, or (hourly/daily) when the
   * week's billed days don't all share the same invoice ID. */
  invoiceId: string | null;
  /** Per-day breakdown for hourly/daily-interval projects, most-recent-first within the week; null for
   * weekly-interval projects, whose billing can't be split finer than the week itself. */
  days: ProjectDayHistory[] | null;
}

export interface ProjectHistory {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  interval: Interval;
  currency: string | null;
  /** Most-recent-first; only periods with any tracked time appear. */
  periods: ProjectPeriodHistory[];
}

export interface ClientHistoryTotal {
  currency: string;
  amount: number;
}

/** One client's projects, grouped for the History panel — see
 * groupHistoryByClient(). */
export interface ClientHistory {
  clientId: string;
  clientName: string;
  /** Same order as produced by summarizeAllHistory: most-recently-logged
   * project first. */
  projects: ProjectHistory[];
  /** Unbilled amount owed by this client, one entry per currency present
   * among its projects with a rate set — sorted by currency code. */
  unbilledTotals: ClientHistoryTotal[];
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Start (Monday) of the calendar week containing `anchor`. */
export function weekStart(anchor: Date): Date {
  const day = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const daysSinceMonday = (day.getDay() + 6) % 7; // Monday = 0
  day.setDate(day.getDate() - daysSinceMonday);
  return day;
}

/** Exclusive end of the week containing `anchor`. */
export function weekEnd(anchor: Date): Date {
  return addDays(weekStart(anchor), 7);
}

function isoDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Canonical "which week" identity key — a zero-padded "YYYY-MM-DD" for that
 * week's Monday. This is what's sent to/from the mark/unmark-billed Tauri
 * commands, since Rust has no reason to duplicate this calendar math and
 * just stores the key as an opaque string. Zero-padding also makes plain
 * string sort chronologically correct, used to order a project's periods
 * most-recent-first. */
export function weekStartKey(anchor: Date): string {
  return isoDateKey(weekStart(anchor));
}

/** The BilledPeriod lookup/write key for one entry, at whatever granularity
 * its project bills at: the week's Monday for weekly-interval projects
 * (a flat weekly rate can't be split by day), or the entry's own day
 * otherwise. Single source of truth so History panel selection, CSV export,
 * and PDF reports all agree on which key a given project's billing lives
 * under. */
export function billedPeriodKeyFor(project: Project, date: Date): string {
  return project.interval === "weekly" ? weekStartKey(date) : isoDateKey(date);
}

/** True when `anchor` falls in the same week as `now` — used to label the
 * current week distinctly ("This week"). */
export function isCurrentWeek(anchor: Date, now: Date): boolean {
  return weekStart(anchor).getTime() === weekStart(now).getTime();
}

export function weekLabel(anchor: Date, now: Date): string {
  const start = weekStart(anchor);
  if (isCurrentWeek(anchor, now)) return "This week";
  const end = addDays(start, 6);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  return `${startStr} – ${endStr}`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function pluralize(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

/** Effective duration of an entry, computing live elapsed time for the
 * still-open (actively tracked) entry instead of its persisted 0. */
function entryDurationSeconds(entry: TimeEntry, now: Date): number {
  if (entry.endedAt) return entry.durationSeconds;
  return Math.max(0, Math.floor((now.getTime() - new Date(entry.startedAt).getTime()) / 1000));
}

/** Computes the display string and billed amount for one project's entries
 * within a single week, per the project's own rate cadence
 * (`project.interval`). */
function summarizePeriodEntries(
  projectEntries: TimeEntry[],
  project: Project,
  now: Date,
): { display: string; billedQuantity: number; amount: number | null } {
  let display: string;
  // Billed quantity in the project's own cadence unit — an hourly project
  // bills the exact elapsed time (fractional hours), while daily/weekly
  // quantities are already whole units (distinct days/weeks touched).
  let billedQuantity: number;
  if (project.interval === "hourly") {
    const totalSeconds = projectEntries.reduce((sum, e) => sum + entryDurationSeconds(e, now), 0);
    display = formatDuration(totalSeconds);
    billedQuantity = totalSeconds / 3600;
  } else if (project.interval === "daily") {
    const days = new Set(projectEntries.map((e) => dayKey(new Date(e.startedAt))));
    display = pluralize(days.size, "day");
    billedQuantity = days.size;
  } else {
    const weeks = new Set(projectEntries.map((e) => dayKey(weekStart(new Date(e.startedAt)))));
    display = pluralize(weeks.size, "week");
    billedQuantity = weeks.size;
  }

  return {
    display,
    billedQuantity,
    amount: project.rate !== null ? project.rate * billedQuantity : null,
  };
}

/** Computes the display string and billed amount for one project's entries
 * within a single day — the hourly/daily-interval equivalent of
 * summarizePeriodEntries, one cadence level down. Never called for
 * weekly-interval projects (see ProjectPeriodHistory.days). */
function summarizeDayEntries(
  dayEntries: TimeEntry[],
  project: Project,
  now: Date,
): { display: string; billedQuantity: number; amount: number | null } {
  if (project.interval === "hourly") {
    const totalSeconds = dayEntries.reduce((sum, e) => sum + entryDurationSeconds(e, now), 0);
    return {
      display: formatDuration(totalSeconds),
      billedQuantity: totalSeconds / 3600,
      amount: project.rate !== null ? project.rate * (totalSeconds / 3600) : null,
    };
  }
  // daily: any entries at all mean this day counts as one billed unit.
  return { display: "1 day", billedQuantity: 1, amount: project.rate };
}

/** Builds the per-day breakdown for one week's worth of a project's entries
 * (hourly/daily-interval only — see ProjectPeriodHistory.days), most-recent
 * day first, each joined against `billedByKey` by its own day key. */
function summarizePeriodDays(
  periodEntries: TimeEntry[],
  project: Project,
  billedByKey: Map<string, BilledPeriod>,
  now: Date,
): ProjectDayHistory[] {
  const byDay = new Map<string, TimeEntry[]>();
  for (const entry of periodEntries) {
    const key = isoDateKey(new Date(entry.startedAt));
    const list = byDay.get(key) ?? [];
    list.push(entry);
    byDay.set(key, list);
  }

  return Array.from(byDay.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dayKeyStr, dayEntries]) => {
      const { display, billedQuantity, amount } = summarizeDayEntries(dayEntries, project, now);
      const billedRecord = billedByKey.get(`${project.id}::${dayKeyStr}`);
      const entryStart = new Date(dayEntries[0].startedAt);
      return {
        day: new Date(entryStart.getFullYear(), entryStart.getMonth(), entryStart.getDate()),
        dayKey: dayKeyStr,
        display,
        billedQuantity,
        amount,
        billed: billedRecord !== undefined,
        invoiceId: billedRecord?.invoiceId ?? null,
      };
    });
}

/** Groups ALL tracked time (no date-range filter — the History panel always
 * shows everything) per project, bucketed by week. Each project's periods
 * are sorted most-recent-first, and each period's `billed` flag reflects
 * the matching `BilledPeriod` record, if any. Projects themselves are
 * ordered by their most recently logged period (whichever project has time
 * logged most recently appears first), tie-broken by client then project
 * name so otherwise-equal projects still sort predictably. */
export function summarizeAllHistory(
  entries: TimeEntry[],
  projects: Project[],
  clients: Client[],
  billedPeriods: BilledPeriod[],
  now: Date = new Date(),
): ProjectHistory[] {
  const billedByKey = new Map(billedPeriods.map((b) => [`${b.projectId}::${b.periodStart}`, b]));

  // projectId -> weekStartKey -> entries in that bucket
  const byProject = new Map<string, Map<string, TimeEntry[]>>();
  for (const entry of entries) {
    const key = weekStartKey(new Date(entry.startedAt));
    const byPeriod = byProject.get(entry.projectId) ?? new Map<string, TimeEntry[]>();
    const list = byPeriod.get(key) ?? [];
    list.push(entry);
    byPeriod.set(key, list);
    byProject.set(entry.projectId, byPeriod);
  }

  const clientNameById = new Map(clients.map((c) => [c.id, c.name]));

  const summaries: ProjectHistory[] = [];
  for (const project of projects) {
    const byPeriod = byProject.get(project.id);
    if (!byPeriod || byPeriod.size === 0) continue;

    const periods: ProjectPeriodHistory[] = Array.from(byPeriod.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, projectEntries]) => {
        const { display, billedQuantity, amount } = summarizePeriodEntries(projectEntries, project, now);

        if (project.interval === "weekly") {
          const billedRecord = billedByKey.get(`${project.id}::${key}`);
          return {
            periodStart: weekStart(new Date(projectEntries[0].startedAt)),
            periodStartKey: key,
            display,
            billedQuantity,
            amount,
            billed: billedRecord !== undefined,
            invoiceId: billedRecord?.invoiceId ?? null,
            days: null,
          };
        }

        const days = summarizePeriodDays(projectEntries, project, billedByKey, now);
        const billed = days.length > 0 && days.every((d) => d.billed);
        const invoiceIds = new Set(days.filter((d) => d.billed).map((d) => d.invoiceId));
        return {
          periodStart: weekStart(new Date(projectEntries[0].startedAt)),
          periodStartKey: key,
          display,
          billedQuantity,
          amount,
          billed,
          invoiceId: billed && invoiceIds.size === 1 ? [...invoiceIds][0] : null,
          days,
        };
      });

    summaries.push({
      projectId: project.id,
      projectName: project.name,
      clientId: project.clientId,
      clientName: clientNameById.get(project.clientId) ?? "Unknown client",
      interval: project.interval,
      currency: project.currency,
      periods,
    });
  }

  summaries.sort(
    (a, b) =>
      // periods[0] is each project's most recent period (sorted above), so
      // this orders projects by whichever was logged in most recently.
      b.periods[0].periodStartKey.localeCompare(a.periods[0].periodStartKey) ||
      a.clientName.localeCompare(b.clientName) ||
      a.projectName.localeCompare(b.projectName),
  );
  return summaries;
}

/** Total unbilled time and price for one project, across all its unbilled
 * periods — what's still owed, independent of whether billed periods are
 * currently shown. Used in the History panel's project header. */
export function summarizeUnbilledTotal(
  history: ProjectHistory,
  project: Project,
): { display: string; amount: number | null } {
  // Periods with a `days` breakdown (hourly/daily-interval) can be partially
  // billed, so their unbilled contribution is the sum of their unbilled
  // days, not an all-or-nothing check on the whole week.
  const totalQuantity = history.periods.reduce((sum, p) => {
    if (p.days) return sum + p.days.filter((d) => !d.billed).reduce((s, d) => s + d.billedQuantity, 0);
    return p.billed ? sum : sum + p.billedQuantity;
  }, 0);

  const display =
    project.interval === "hourly"
      ? formatDuration(totalQuantity * 3600)
      : pluralize(totalQuantity, project.interval === "daily" ? "day" : "week");

  return {
    display,
    amount: project.rate !== null ? project.rate * totalQuantity : null,
  };
}

/** Groups project histories by client for the History panel, so Paul can see
 * everything owed by one client together. Each client's unbilled total is
 * broken out per currency (a client's projects can bill in different
 * currencies, so amounts in different currencies are never added together
 * for display). Clients are ordered by total amount owed, highest first —
 * when a client has amounts in more than one currency, the raw numbers are
 * summed across currencies purely as an internal sort key, never shown. */
export function groupHistoryByClient(groups: ProjectHistory[], projects: Project[]): ClientHistory[] {
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const byClient = new Map<string, ProjectHistory[]>();
  for (const group of groups) {
    const list = byClient.get(group.clientId) ?? [];
    list.push(group);
    byClient.set(group.clientId, list);
  }

  const clients: ClientHistory[] = [];
  for (const [clientId, projectGroups] of byClient) {
    const totalsByCurrency = new Map<string, number>();
    for (const group of projectGroups) {
      const project = projectById.get(group.projectId);
      if (!project || !group.currency) continue;
      const { amount } = summarizeUnbilledTotal(group, project);
      if (amount !== null) {
        totalsByCurrency.set(group.currency, (totalsByCurrency.get(group.currency) ?? 0) + amount);
      }
    }

    clients.push({
      clientId,
      clientName: projectGroups[0].clientName,
      projects: projectGroups,
      unbilledTotals: Array.from(totalsByCurrency, ([currency, amount]) => ({ currency, amount })).sort((a, b) =>
        a.currency.localeCompare(b.currency),
      ),
    });
  }

  clients.sort((a, b) => {
    const sortKeyOf = (c: ClientHistory) => c.unbilledTotals.reduce((sum, t) => sum + t.amount, 0);
    return sortKeyOf(b) - sortKeyOf(a) || a.clientName.localeCompare(b.clientName);
  });

  return clients;
}

/** Drops fully-billed periods from each project (also dropping any already-
 * billed days from a still-partially-unbilled period's `days` list), and
 * drops any project left with no periods at all — used by the History panel
 * to hide settled work by default. */
export function hideBilledPeriods(groups: ProjectHistory[]): ProjectHistory[] {
  return groups
    .map((g) => ({
      ...g,
      periods: g.periods
        .filter((p) => !p.billed)
        .map((p) => (p.days ? { ...p, days: p.days.filter((d) => !d.billed) } : p)),
    }))
    .filter((g) => g.periods.length > 0);
}

function csvTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Quotes a free-text CSV cell, escaping embedded quotes, since notes may
 * contain commas or other characters that would otherwise break columns. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Itemized CSV of every closed session for a project — proof of exact
 * working dates/times if a client asks for the full log behind a summary
 * figure. The in-progress entry (if any) is skipped, since it has no final
 * duration yet. An Amount column is only meaningful for hourly-rate
 * projects — daily/weekly projects bill a flat amount per day/week
 * regardless of session count, so a per-row figure would be misleading.
 * `billed`/`invoiceId` are looked up per row via `billedPeriodKeyFor` —
 * weekly-interval projects bill (and so are exported) one week at a time, so
 * every row shares the same value, but hourly/daily-interval projects can
 * have different days within the same export billed independently. */
export function buildTimeLogCsv(entries: TimeEntry[], project: Project, billedPeriods: BilledPeriod[]): string {
  const billedByKey = new Map(billedPeriods.map((b) => [`${b.projectId}::${b.periodStart}`, b]));
  const closed = entries
    .filter((e) => e.projectId === project.id && e.endedAt)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  const includeAmount = project.interval === "hourly" && project.rate !== null;
  const header = includeAmount
    ? "Date,Start,End,Duration,Amount,Billed,Invoice,Notes"
    : "Date,Start,End,Duration,Billed,Invoice,Notes";

  const rows = closed.map((entry) => {
    const start = new Date(entry.startedAt);
    const end = new Date(entry.endedAt as string);
    const duration = formatDuration(entry.durationSeconds);
    const billedRecord = billedByKey.get(`${project.id}::${billedPeriodKeyFor(project, start)}`);
    const cells = [isoDateKey(start), csvTime(start), csvTime(end), duration];
    if (includeAmount) {
      // Per-session amounts stay floored to whole completed hours, matching
      // the live tracker indicator — unlike the History panel's period and
      // total amounts, which bill exact fractional hours.
      const billedHours = Math.floor(entry.durationSeconds / 3600);
      cells.push(((project.rate as number) * billedHours).toFixed(2));
    }
    cells.push(billedRecord !== undefined ? "Yes" : "No", csvCell(billedRecord?.invoiceId ?? ""), csvCell(entry.note ?? ""));
    return cells.join(",");
  });

  return [header, ...rows].join("\n");
}

/** One itemized row in a PDF report — see buildReportRows(). */
export interface ReportRow {
  date: string;
  start: string;
  end: string;
  duration: string;
  /** Raw seconds behind `duration` — kept alongside the formatted string so
   * section/report totals can be summed without re-parsing it. */
  durationSeconds: number;
  /** Per-entry amount, only computed for hourly-rate projects (see
   * buildTimeLogCsv's doc comment on why daily/weekly projects don't get a
   * meaningful per-row figure). */
  amount: number | null;
  billed: boolean;
  invoiceId: string | null;
  note: string;
}

/** One project's itemized rows within a report — grouped this way (rather
 * than one flat list) so the PDF can render a section per client/project for
 * readability when a report spans more than one. */
export interface ReportSection {
  clientName: string;
  projectName: string;
  currency: string | null;
  rows: ReportRow[];
}

/** Narrows a report to one client and/or project; omitted/null means "all". */
export interface ReportFilter {
  clientId?: string | null;
  projectId?: string | null;
}

/** Builds the itemized sections for a PDF report covering `[start, end)`,
 * optionally narrowed by `filter`. A report's date range can span multiple
 * billing periods, so each entry's billed status is looked up individually
 * via `billedPeriodKeyFor` rather than being a single value passed in by the
 * caller. */
export function buildReportRows(
  entries: TimeEntry[],
  projects: Project[],
  clients: Client[],
  billedPeriods: BilledPeriod[],
  start: Date,
  end: Date,
  filter: ReportFilter = {},
): ReportSection[] {
  const clientNameById = new Map(clients.map((c) => [c.id, c.name]));
  const billedByKey = new Map(billedPeriods.map((b) => [`${b.projectId}::${b.periodStart}`, b]));

  const projectsInScope = projects.filter((p) => {
    if (filter.projectId && p.id !== filter.projectId) return false;
    if (filter.clientId && p.clientId !== filter.clientId) return false;
    return true;
  });

  const sections: ReportSection[] = [];
  for (const project of projectsInScope) {
    const closed = entries
      .filter((e) => e.projectId === project.id && e.endedAt)
      .filter((e) => {
        const started = new Date(e.startedAt);
        return started >= start && started < end;
      })
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    if (closed.length === 0) continue;

    const includeAmount = project.interval === "hourly" && project.rate !== null;
    const rows: ReportRow[] = closed.map((entry) => {
      const entryStart = new Date(entry.startedAt);
      const entryEnd = new Date(entry.endedAt as string);
      const billedRecord = billedByKey.get(`${project.id}::${billedPeriodKeyFor(project, entryStart)}`);
      // Floored to whole completed hours, matching buildTimeLogCsv's
      // per-session amount convention.
      const billedHours = Math.floor(entry.durationSeconds / 3600);
      return {
        date: isoDateKey(entryStart),
        start: csvTime(entryStart),
        end: csvTime(entryEnd),
        duration: formatDuration(entry.durationSeconds),
        durationSeconds: entry.durationSeconds,
        amount: includeAmount ? (project.rate as number) * billedHours : null,
        billed: billedRecord !== undefined,
        invoiceId: billedRecord?.invoiceId ?? null,
        note: entry.note ?? "",
      };
    });

    sections.push({
      clientName: clientNameById.get(project.clientId) ?? "Unknown client",
      projectName: project.name,
      currency: project.currency,
      rows,
    });
  }

  sections.sort(
    (a, b) => a.clientName.localeCompare(b.clientName) || a.projectName.localeCompare(b.projectName),
  );
  return sections;
}
