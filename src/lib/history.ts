import type { BilledPeriod, Client, Interval, Project, TimeEntry } from "../types";

/** One project's tracked time within a single week. */
export interface ProjectPeriodHistory {
  periodStart: Date;
  /** "YYYY-MM-DD" (that week's Monday) identity key — see weekStartKey(). */
  periodStartKey: string;
  display: string;
  /** rate * quantity for this period, in the project's own unit; null if the project has no rate set. */
  amount: number | null;
  billed: boolean;
  /** Optional client-facing invoice reference; null when unbilled or not yet set. */
  invoiceId: string | null;
}

export interface ProjectHistory {
  projectId: string;
  projectName: string;
  clientName: string;
  interval: Interval;
  currency: string | null;
  /** Most-recent-first; only periods with any tracked time appear. */
  periods: ProjectPeriodHistory[];
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
): { display: string; amount: number | null } {
  let display: string;
  // Billed quantity in the project's own cadence unit, rounded down to
  // whole units — an hourly project only bills completed hours (matching
  // the live tracker's session indicator), while daily/weekly quantities
  // are already whole units (distinct days/weeks touched).
  let billedQuantity: number;
  if (project.interval === "hourly") {
    const totalSeconds = projectEntries.reduce((sum, e) => sum + entryDurationSeconds(e, now), 0);
    display = formatDuration(totalSeconds);
    billedQuantity = Math.floor(totalSeconds / 3600);
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
    amount: project.rate !== null ? project.rate * billedQuantity : null,
  };
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
        const { display, amount } = summarizePeriodEntries(projectEntries, project, now);
        const billedRecord = billedByKey.get(`${project.id}::${key}`);
        return {
          periodStart: weekStart(new Date(projectEntries[0].startedAt)),
          periodStartKey: key,
          display,
          amount,
          billed: billedRecord !== undefined,
          invoiceId: billedRecord?.invoiceId ?? null,
        };
      });

    summaries.push({
      projectId: project.id,
      projectName: project.name,
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

/** Drops billed periods from each project, and drops any project left with
 * no periods at all — used by the History panel to hide settled work by
 * default. */
export function hideBilledPeriods(groups: ProjectHistory[]): ProjectHistory[] {
  return groups
    .map((g) => ({ ...g, periods: g.periods.filter((p) => !p.billed) }))
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
 * `billed`/`invoiceId` reflect whether the whole period being exported has
 * been marked billed and its invoice reference — the same values for every
 * row, since `entries` is already filtered down to one period by the caller. */
export function buildTimeLogCsv(
  entries: TimeEntry[],
  project: Project,
  billed: boolean,
  invoiceId: string | null,
): string {
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
    const cells = [isoDateKey(start), csvTime(start), csvTime(end), duration];
    if (includeAmount) {
      // Billed in whole completed hours, same rounding rule as the live
      // tracker indicator and the History summary total.
      const billedHours = Math.floor(entry.durationSeconds / 3600);
      cells.push(((project.rate as number) * billedHours).toFixed(2));
    }
    cells.push(billed ? "Yes" : "No", csvCell(invoiceId ?? ""), csvCell(entry.note ?? ""));
    return cells.join(",");
  });

  return [header, ...rows].join("\n");
}
