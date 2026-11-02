/** Cadence always bills against New Zealand time, regardless of the
 * device's own system timezone — Paul works from NZ, and a laptop that
 * temporarily thinks it's somewhere else (e.g. while traveling) must not
 * change which calendar day/week an already-logged entry falls into. Every
 * piece of "what day/week is this" logic in the app goes through here
 * instead of local Date getters. */
export const NZ_TIME_ZONE = "Pacific/Auckland";

export interface NzDateTimeParts {
  year: number;
  /** 1-12. */
  month: number;
  day: number;
  /** 0-23. */
  hour: number;
  minute: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: NZ_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Every field of `date` as seen on the NZ wall clock — the single source of
 * truth for "what calendar day/time is this", independent of the device's
 * own timezone. Correctly follows NZ's DST transitions via the IANA
 * database (through Intl), rather than a fixed UTC offset. */
export function nzParts(date: Date): NzDateTimeParts {
  const map: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

/** A calendar-date marker for the NZ calendar day `date` falls on, encoded
 * as UTC midnight of that Y-M-D. Safe to read back with UTC getters
 * (getUTCFullYear/Month/Date/Day) or to format with an explicit
 * `timeZone: NZ_TIME_ZONE` — both agree, because NZ's UTC offset is always
 * positive (+12h/+13h), so this instant never rolls back into the previous
 * NZ day. Only for calendar arithmetic/comparison/display — never a real
 * elapsed-time instant. */
export function nzCalendarMarker(date: Date): Date {
  const { year, month, day } = nzParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Adds (or subtracts, if negative) whole calendar days to a marker from
 * `nzCalendarMarker`/`weekStart`/`weekEnd`, via UTC date math so it isn't
 * affected by the host's own DST transitions. */
export function addCalendarDays(marker: Date, days: number): Date {
  const next = new Date(marker);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** The real instant at which the NZ wall clock reads
 * `year-month-day hour:minute:00` — the inverse of `nzParts`. Used only for
 * manual time-entry input, where what's typed into the form is explicitly
 * NZ wall-clock time. Accurate except within about an hour of NZ's twice-
 * yearly DST transition (which happens at 2am local, not midnight) — not
 * worth the extra complexity for a time-tracking app. */
export function nzWallClockToInstant(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guessMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const observed = nzParts(new Date(guessMs));
  const observedMs = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, 0);
  const offsetMs = observedMs - guessMs; // NZ is ahead of UTC, so this is positive.
  return new Date(guessMs - offsetMs);
}
