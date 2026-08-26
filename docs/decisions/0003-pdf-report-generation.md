# ADR-0003: Generate PDF reports client-side with jsPDF

## Status
Accepted

## Date
2026-08-26

## Context
Cadence needed a way to export an itemized time log for an arbitrary date range as a PDF, saved next to the tracking data file (see `docs/plans/pdf-report-for-date-range.md`). No PDF-generation dependency existed anywhere in the project (frontend or `src-tauri`). The existing CSV export already builds its content entirely in TypeScript (`buildTimeLogCsv` in `src/lib/history.ts`) and hands a plain string to a thin Rust command (`save_text_file`) that just writes bytes to disk — Rust has no content-building logic in that flow at all.

## Decision
Generate the PDF entirely in the frontend using `jspdf` + `jspdf-autotable`, then pass the resulting bytes to a new Tauri command (`save_report_pdf`) that writes them into `state.data_dir` — the same directory `cadence-data.json` lives in.

## Alternatives Considered

### Rust backend PDF crate (e.g. `printpdf`)
- Pros: Keeps all data untouched by IPC serialization until write time; report logic lives alongside the rest of the persistence code.
- Cons: Adds a new, heavier Rust dependency; duplicates layout/formatting logic that's easiest to iterate on in TypeScript (where currency formatting, date helpers, and the row-building logic already live); a bigger departure from the established "TS builds content, Rust just writes bytes" pattern used by CSV export.
- Rejected because: no functional requirement favors server-side generation, and it would fragment report-formatting logic across two languages for no benefit.

## Consequences
- `jspdf` and `jspdf-autotable` are now frontend dependencies (`package.json`); their bytes are passed to Rust as a plain byte array over Tauri's IPC (`Array.from(bytes)`), acceptable given these reports are small, locally-generated documents rather than a high-throughput path.
- `save_report_pdf` (`src-tauri/src/commands.rs`) is a thin, content-agnostic byte writer, mirroring `save_text_file` — any future export format (e.g. a future spreadsheet export) can reuse the same command by simply generating different bytes on the frontend.
- Future PDF/report work should default to this same client-side-generation pattern rather than introducing a Rust PDF crate.
