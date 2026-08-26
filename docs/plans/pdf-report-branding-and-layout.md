# Plan: PDF Report Branding & Layout Feedback

## Status
Done

## Context
Paul's first look at the PDF report feature ([pdf-report-for-date-range.md](pdf-report-for-date-range.md)) surfaced four pieces of feedback:
- The "Generate PDF Report" trigger (currently a `FileText` icon in its own row inside `HistoryPanel`) should sit at the top, to the left of the existing "Show billed" toggle in the history screen's header.
- He wants to configure a logo image for the report.
- He wants a footer line reading "Generated using cadence.peaklab.ai" on the report.
- The hardcoded "Cadence Time Log" header should become the configured logo plus a configurable title, defaulting to "Time report".

## Goal
- Clicking the report icon (now next to "Show billed") still opens the same date-range/filter panel as today, just triggered from its new location.
- A "Report branding" section in Settings lets Paul upload a logo image and set a custom report title; both persist across restarts.
- Every generated PDF shows the configured logo (if any) and title (default "Time report") at the top, and "Generated using cadence.peaklab.ai" centered in the footer of every page.

## Decisions

| # | Decision point | Options considered | Chosen | Confirmed with Paul |
|---|-----------------|---------------------|--------|----------------------|
| 1 | Where to configure logo/title | (a) Settings screen, alongside Data folder, (b) inline in the History panel's report options | (a) Settings screen | 2026-08-26 |

Implementation notes (not forks, mechanical choices):
- Logo is stored as a data URL (`data:image/png;base64,...`) directly in `AppData.settings` — read client-side via `FileReader` from a plain `<input type="file">`, no new Rust file-reading command needed, and it travels with the rest of the data if Paul ever switches data folders (consistent with ADR-0003's client-side-generation approach).
- `report_title` empty/unset falls back to "Time report" in the PDF layer, not persisted as the literal default string, so changing the fallback later doesn't require a data migration.
- Footer is added as a final pass over every page in `buildTimeLogPdf` (after all sections are drawn), rather than threaded through per-section drawing.

## Approach

**`src-tauri/src/models.rs`**
- Add `report_title: Option<String>` and `report_logo_data_url: Option<String>` to `Settings`, both `#[serde(default)]` so existing `cadence-data.json` files without them still parse. Derive `Default` for `Settings` and switch the handful of `Settings { active_entry_id: None }` literals (models.rs, commands.rs tests, storage.rs tests) to `Settings::default()`.

**`src-tauri/src/commands.rs`**
- Add a `ReportSettings { title: Option<String>, logo_data_url: Option<String> }` DTO plus `get_report_settings` / `set_report_settings` commands, following the `save_data` pattern used by `add_client` etc. `set_report_settings` trims/blanks-to-`None` an empty title.
- Register both in `src-tauri/src/lib.rs`'s `generate_handler!`.

**`src/types/index.ts`** / **`src/lib/tauriCommands.ts`**
- Add `ReportSettings` type and `getReportSettings()` / `setReportSettings(title, logoDataUrl)` wrappers.

**`src/components/SettingsScreen.tsx`**
- New "Report branding" section: a file input (`accept="image/*"`) that reads the chosen file via `FileReader.readAsDataURL` and calls `setReportSettings`, a thumbnail + "Remove" once a logo is set, and a text input for the title (placeholder "Time report").

**`src/lib/pdfReport.ts`**
- `buildTimeLogPdf` takes a new `branding: { title: string | null; logoDataUrl: string | null }` argument. Renders the logo image (if present, height-capped, left-aligned) and the title text (configured value or "Time report") in place of the current hardcoded "Cadence Time Log" line. After all sections are drawn, loops `doc.getNumberOfPages()` and stamps "Generated using cadence.peaklab.ai" centered at the bottom of each page.

**`src/components/HistoryPanel.tsx`**
- Removes its own `reportOpen` state and the icon button/row that toggled it; both become props (`reportOpen`, `onReportOpenChange`) supplied by `App.tsx`, mirroring the existing `showBilled`/`onShowBilledChange` pair.
- Loads report settings alongside entries/billed periods and passes them into `buildTimeLogPdf`.

**`src/App.tsx`**
- Lifts `reportOpen` state up (like `showBilled`) and renders the `FileText` toggle button immediately to the left of the `Switch` in the history screen's header row.

## Task Checklist
- [x] Add `report_title` / `report_logo_data_url` to `Settings` in `models.rs`; derive `Default`; update literal call sites
- [x] Add `get_report_settings` / `set_report_settings` commands; register in `lib.rs`
- [x] Add `ReportSettings` type + `tauriCommands.ts` wrappers
- [x] Add "Report branding" section (logo upload + title input) to `SettingsScreen.tsx`
- [x] Extend `buildTimeLogPdf` with logo/title header and cross-page footer
- [x] Move the report toggle button into `App.tsx`'s header, left of "Show billed"; lift `reportOpen` state
- [x] Wire `HistoryPanel` to load report settings and pass branding into `buildTimeLogPdf`
- [x] Update `docs/plans/README.md` index

## Verification
Done:
- `cargo check` / `cargo test` (24 passed) in `src-tauri`.
- `tsc --noEmit`, `eslint`, `vitest run` (53 passed) on the frontend.
- Caught during implementation (not testing): the first pass of the logo-scaling code read `img.width`/`img.height` synchronously right after setting `img.src` — image decoding is asynchronous even for data URLs in every browser engine, so that path would have silently skipped the logo. Fixed by making `buildTimeLogPdf` async and awaiting the image's `onload` before measuring it.

Not done (same limitation the original PDF-report plan hit — no native macOS UI driver available for this menu-bar/tray Tauri app in this environment, and the Chrome extension used for browser-level checks wasn't connected this session):
- Clicking through the running app: uploading a logo and setting a title in Settings, confirming the report icon now sits left of "Show billed" in the header, and generating a report to visually confirm the logo/title/footer render correctly. **Recommend Paul do one manual pass of this before relying on the feature.**
