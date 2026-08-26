# Plan: PDF Time-Log Report for a Date Range

## Status
Done

## Context
Cadence can export a single project's single week as CSV (`ProjectLogScreen`), but there's no way to get a portable, itemized record covering an arbitrary date range — useful for handing a client a session-by-session log, or for Paul's own records, without opening the app. This plan adds a "Generate PDF Report" action to the History panel: pick a date range (and optionally narrow to one client/project), and get a PDF of every itemized time entry in that range, saved into the same folder as the tracking file (`cadence-data.json`) so all of Paul's Cadence data lives together.

## Goal
- From the History panel, Paul can pick a start/end date, optionally filter to one client or one project, and click "Generate PDF Report."
- The PDF lists every closed time entry in range (date, start/end time, duration, per-entry amount for hourly projects, billed status/invoice, notes), grouped under client/project headers for readability.
- The PDF is written directly into the tracking file's folder (`state.data_dir`, the same directory as `cadence-data.json`) — not the OS Downloads folder used by the existing CSV export — and the saved path is shown in the UI, mirroring the existing CSV export's "Saved to {path}" pattern.

## Decisions

| # | Decision point | Options considered | Chosen | Confirmed with Paul |
|---|-----------------|---------------------|--------|----------------------|
| 1 | Report content | (a) summary totals only, (b) itemized entries only, (c) both | (b) Itemized entries only | 2026-08-26 |
| 2 | Report scope | (a) always all clients/projects, (b) filterable by client/project | (b) Filterable by client and/or project, in addition to the date range | 2026-08-26 |
| 3 | Trigger location | (a) History panel, (b) new dedicated Reports screen | (a) History panel — new date-range/filter controls + button at the top | 2026-08-26 |
| 4 | PDF generation approach | (a) frontend JS library (jsPDF), (b) Rust backend PDF crate | (a) jsPDF (+ jspdf-autotable for the entry table), built in TS — consistent with how CSV content is already built in TS, no new Rust crate | 2026-08-26 — see [ADR-0003](../decisions/0003-pdf-report-generation.md) |

Implementation notes (not forks, mechanical choices):
- Since scope can span multiple clients/projects, entries are organized under client → project section headers purely for readability — no subtotal/summary figures are shown per section, matching the "itemized only" decision.
- In-progress (not-yet-ended) entries are excluded, matching `buildTimeLogCsv`'s existing convention.
- A given entry's billed status/invoice is looked up per its own week (`weekStartKey`) against `billedPeriods`, since a date range can span multiple weekly billing periods with different statuses.

## Approach

**`src-tauri/src/commands.rs`**
- Added `save_report_pdf(state: State<AppState>, filename: String, contents: Vec<u8>) -> Result<String, String>`, modeled on `save_text_file` but writing to `state.data_dir.lock_or_recover()` (the same path `storage::save` uses) instead of `download_dir()`, reusing `sanitize_filename`.
- Registered in `tauri::generate_handler![...]` in `src-tauri/src/lib.rs` alongside `commands::save_text_file`.

**`src/lib/tauriCommands.ts`**
- Added `saveReportPdf(filename: string, bytes: Uint8Array): Promise<string>` calling `call("save_report_pdf", { filename, contents: Array.from(bytes) })`, following the existing `saveTextFile` wrapper style.

**`src/lib/history.ts`**
- Added `buildReportRows(entries, projects, clients, billedPeriods, start, end, filter): ReportSection[]` (`ReportSection = { clientName, projectName, currency, rows: ReportRow[] }`), filtering to closed entries in `[start, end)`, optionally narrowed by `filter.clientId`/`filter.projectId`, grouped by client then project. Kept separate from `buildTimeLogCsv` (unchanged, still used by the per-project-per-week CSV flow).
- Unit tests in `src/lib/history.test.ts` cover date-range filtering, client/project filter, per-week billed lookup, exclusion of in-progress entries, and section ordering.

**`src/lib/pdfReport.ts`** (new file)
- `buildTimeLogPdf(sections, range): Uint8Array` — uses `jspdf` + `jspdf-autotable` to render a title (date range, generated timestamp), one table per client/project section, and returns bytes via `doc.output("arraybuffer")`.

**`src/components/HistoryPanel.tsx`**
- Added report controls above the client list: start/end date inputs (default: first day of current month → today), native "All clients"/"All projects" `<select>` filters (project options scoped to the selected client), and a "Generate PDF Report" button.
- On click: builds `ReportSection[]` via `buildReportRows`, bytes via `buildTimeLogPdf`, a filename (`"{scope} Report {start} to {end}.pdf"`), calls `saveReportPdf`, and shows the saved path/error the same way `ProjectLogScreen`'s CSV export does.

**`package.json`**
- Added `jspdf` and `jspdf-autotable` to `dependencies`.

**`docs/decisions/`**
- Added [ADR-0003](../decisions/0003-pdf-report-generation.md) documenting the jsPDF/jspdf-autotable choice.

## Task Checklist
- [x] Add `save_report_pdf` Tauri command (`commands.rs`) writing into `state.data_dir`; register in `lib.rs`
- [x] Add `saveReportPdf` wrapper in `tauriCommands.ts`
- [x] Add `jspdf` + `jspdf-autotable` dependencies; add ADR for this choice
- [x] Implement `buildReportRows` in `history.ts` + unit tests in `history.test.ts`
- [x] Implement `buildTimeLogPdf` in new `src/lib/pdfReport.ts`
- [x] Add date-range + client/project filter controls and "Generate PDF Report" button to `HistoryPanel.tsx`, wired to the above
- [x] Update `docs/plans/README.md` index; mark this plan Done

## Verification
Done:
- `cargo check` / `cargo test` (24 passed) in `src-tauri`.
- `tsc --noEmit`, `eslint`, and `vitest run` (53 passed, including new `buildReportRows` tests) on the frontend.
- Generated a real PDF via the actual `buildReportRows`/`buildTimeLogPdf` code with realistic multi-client, multi-week, mixed-billed-status sample data and visually inspected the output (correct grouping, currency formatting, invoice references, and note-escaping).

Not done (couldn't be automated in this environment — no native macOS UI driver available for a menu-bar/tray Tauri app):
- Clicking through the actual running app (`pnpm tauri dev`): generating a report from the real History panel UI, confirming the saved-path message, and confirming the file lands next to `cadence-data.json` via Settings → storage location. **Recommend Paul do one manual pass of this before relying on the feature.**
