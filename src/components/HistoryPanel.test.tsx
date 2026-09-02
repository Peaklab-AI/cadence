import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { HistoryPanel } from "./HistoryPanel";
import { getReportSettings, listBilledPeriods, listTimeEntries, markPeriodBilled } from "../lib/tauriCommands";
import type { BilledPeriod, Client, Project, TimeEntry } from "../types";

vi.mock("../lib/tauriCommands", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/tauriCommands")>();
  return {
    ...actual,
    listTimeEntries: vi.fn(),
    listBilledPeriods: vi.fn(),
    getReportSettings: vi.fn(),
    markPeriodBilled: vi.fn(),
    unmarkPeriodBilled: vi.fn(),
  };
});

const mockedListTimeEntries = vi.mocked(listTimeEntries);
const mockedListBilledPeriods = vi.mocked(listBilledPeriods);
const mockedGetReportSettings = vi.mocked(getReportSettings);
const mockedMarkPeriodBilled = vi.mocked(markPeriodBilled);

const client: Client = { id: "client-1", name: "Acme Co", createdAt: "2026-01-01T00:00:00.000Z" };

// A weekly-interval project: billing stays whole-week (no day breakdown).
const weeklyProject: Project = {
  id: "project-weekly",
  clientId: client.id,
  name: "Retainer",
  createdAt: "2026-01-01T00:00:00.000Z",
  interval: "weekly",
  rate: 1000,
  currency: "USD",
};

// An hourly-interval project: billing splits by day within a week.
const hourlyProject: Project = {
  id: "project-hourly",
  clientId: client.id,
  name: "Website",
  createdAt: "2026-01-01T00:00:00.000Z",
  interval: "hourly",
  rate: 100,
  currency: "USD",
};

// Hourly project has two entries in the same week (2026-08-03 is a Monday),
// on different days — the exact "billed Monday, not today" scenario.
const entries: TimeEntry[] = [
  {
    id: "entry-weekly",
    clientId: client.id,
    projectId: weeklyProject.id,
    startedAt: "2026-08-03T09:00:00.000Z",
    endedAt: "2026-08-03T11:00:00.000Z",
    durationSeconds: 7200,
    note: null,
  },
  {
    id: "entry-monday",
    clientId: client.id,
    projectId: hourlyProject.id,
    startedAt: "2026-08-03T09:00:00.000Z",
    endedAt: "2026-08-03T11:00:00.000Z",
    durationSeconds: 7200,
    note: null,
  },
  {
    id: "entry-tuesday",
    clientId: client.id,
    projectId: hourlyProject.id,
    startedAt: "2026-08-04T09:00:00.000Z",
    endedAt: "2026-08-04T10:00:00.000Z",
    durationSeconds: 3600,
    note: null,
  },
];

beforeEach(() => {
  mockedListTimeEntries.mockReset().mockResolvedValue(entries);
  mockedListBilledPeriods.mockReset().mockResolvedValue([] as BilledPeriod[]);
  mockedGetReportSettings.mockReset().mockResolvedValue({ title: null, logoDataUrl: null });
  mockedMarkPeriodBilled.mockReset().mockResolvedValue({
    id: "billed-1",
    projectId: hourlyProject.id,
    periodStart: "2026-08-03",
    billedAt: "2026-08-15T00:00:00.000Z",
    invoiceId: null,
  } satisfies BilledPeriod);
});

afterEach(() => cleanup());

function renderPanel() {
  return render(
    <HistoryPanel
      clients={[client]}
      projects={[weeklyProject, hourlyProject]}
      onOpenLog={() => {}}
      showBilled={true}
      onShowBilledChange={() => {}}
      reportOpen={false}
    />,
  );
}

describe("HistoryPanel bulk mark billed", () => {
  it("defaults to all unbilled units selected (weeks and days), and marks only the checked ones", async () => {
    renderPanel();

    await waitFor(() => expect(screen.queryByText("Acme Co")).not.toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Mark billed" }));

    // 1 week (weekly project) + 2 days (hourly project's Monday and Tuesday).
    expect(screen.queryByText(/3 of 3 selected/)).not.toBeNull();

    // Expand the hourly project's week to reveal its two day checkboxes.
    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    const dayCheckboxes = screen.getAllByLabelText(/Include (Mon|Tue),/);
    expect(dayCheckboxes).toHaveLength(2);

    // Uncheck today (Tuesday) — only Monday's hour and the weekly period stay selected.
    const tuesdayCheckbox = screen.getByLabelText(/Include Tue,/);
    fireEvent.click(tuesdayCheckbox);
    expect(screen.queryByText(/2 of 3 selected/)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Mark 2 billed" }));

    await waitFor(() => expect(mockedMarkPeriodBilled).toHaveBeenCalledTimes(2));
    expect(mockedMarkPeriodBilled).toHaveBeenCalledWith(weeklyProject.id, "2026-08-03", null);
    expect(mockedMarkPeriodBilled).toHaveBeenCalledWith(hourlyProject.id, "2026-08-03", null);
    expect(mockedMarkPeriodBilled).not.toHaveBeenCalledWith(hourlyProject.id, "2026-08-04", null);
  });

  it("disables the confirm button once every unit is unchecked", async () => {
    renderPanel();

    await waitFor(() => expect(screen.queryByText("Acme Co")).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Mark billed" }));
    fireEvent.click(screen.getByRole("button", { name: "None" }));

    expect(screen.queryByText(/0 of 3 selected/)).not.toBeNull();
    const confirmButton = screen.getByRole("button", { name: "Mark 0 billed" }) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);
  });

  it("lets the week-level checkbox for an hourly project select/deselect all its days at once", async () => {
    renderPanel();

    await waitFor(() => expect(screen.queryByText("Acme Co")).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Mark billed" }));

    const weekCheckbox = screen.getByLabelText(/Include all unbilled days in/);
    expect((weekCheckbox as HTMLInputElement).checked).toBe(true);

    fireEvent.click(weekCheckbox);
    // Only the weekly-interval project's single week stays selected.
    expect(screen.queryByText(/1 of 3 selected/)).not.toBeNull();
  });
});
