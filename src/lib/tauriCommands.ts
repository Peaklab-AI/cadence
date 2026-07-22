import { invoke } from "@tauri-apps/api/core";
import type { AppSnapshot, BilledPeriod, Client, Interval, Project, TimeEntry } from "../types";

export function getState(): Promise<AppSnapshot> {
  return invoke("get_state");
}

export function listTimeEntries(): Promise<TimeEntry[]> {
  return invoke("list_time_entries");
}

export function listBilledPeriods(): Promise<BilledPeriod[]> {
  return invoke("list_billed_periods");
}

export function markPeriodBilled(
  projectId: string,
  periodStart: string,
  invoiceId: string | null,
): Promise<BilledPeriod> {
  return invoke("mark_period_billed", { projectId, periodStart, invoiceId });
}

export function unmarkPeriodBilled(projectId: string, periodStart: string): Promise<void> {
  return invoke("unmark_period_billed", { projectId, periodStart });
}

export function addClient(name: string): Promise<Client> {
  return invoke("add_client", { name });
}

export function addProject(
  clientId: string,
  name: string,
  interval: Interval,
  rate: number | null,
  currency: string | null,
): Promise<Project> {
  return invoke("add_project", { clientId, name, interval, rate, currency });
}

export function startTracking(clientId: string, projectId: string): Promise<void> {
  return invoke("start_tracking", { clientId, projectId });
}

export function pauseTracking(): Promise<void> {
  return invoke("pause_tracking");
}

export function updateProject(
  projectId: string,
  name: string,
  clientId: string,
  interval: Interval,
  rate: number | null,
  currency: string | null,
): Promise<Project> {
  return invoke("update_project", { projectId, name, clientId, interval, rate, currency });
}

export function deleteProject(projectId: string): Promise<void> {
  return invoke("delete_project", { projectId });
}

export function respondToPrompt(stillWorking: boolean): Promise<void> {
  return invoke("respond_to_prompt", { stillWorking });
}

export function confirmLeaveTrackingOff(): Promise<void> {
  return invoke("confirm_leave_tracking_off");
}

export function cancelLeaveTrackingOff(): Promise<void> {
  return invoke("cancel_leave_tracking_off");
}

export function saveTextFile(filename: string, contents: string): Promise<string> {
  return invoke("save_text_file", { filename, contents });
}

export function updateTimeEntry(
  entryId: string,
  clientId: string,
  projectId: string,
  startedAt: string,
  endedAt: string,
): Promise<TimeEntry> {
  return invoke("update_time_entry", { entryId, clientId, projectId, startedAt, endedAt });
}

export function deleteTimeEntry(entryId: string): Promise<void> {
  return invoke("delete_time_entry", { entryId });
}

export function addManualTimeEntry(
  clientId: string,
  projectId: string,
  startedAt: string,
  endedAt: string,
): Promise<TimeEntry> {
  return invoke("add_manual_time_entry", { clientId, projectId, startedAt, endedAt });
}
