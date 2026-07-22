export type Interval = "hourly" | "daily" | "weekly";

export type Status = "idle" | "tracking" | "paused" | "promptPending";

export interface Client {
  id: string;
  name: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  createdAt: string;
  interval: Interval;
  /** Optional billing rate, per the project's own interval unit. */
  rate: number | null;
  /** ISO 4217 currency code the rate is denominated in, e.g. "USD". */
  currency: string | null;
}

export interface TimeEntry {
  id: string;
  clientId: string;
  projectId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
}

/** Records that a project's tracked time for one calendar week has been
 * invoiced to the client. */
export interface BilledPeriod {
  id: string;
  projectId: string;
  /** "YYYY-MM-DD" (that week's Monday) — produced by weekStartKey() in lib/history.ts. */
  periodStart: string;
  billedAt: string;
  /** Optional client-facing invoice reference, editable after marking billed. */
  invoiceId: string | null;
}

export interface AppSnapshot {
  status: Status;
  activeClientId: string | null;
  activeProjectId: string | null;
  startedAt: string | null;
  promptDeadline: string | null;
  clients: Client[];
  projects: Project[];
}
