# Plan: Day-Level Billing Within a Week

## Status
Done

## Context
Billing is currently tracked at `(project, week)` granularity — a `BilledPeriod` record is an all-or-nothing flag for a whole calendar week. Paul asked for the History panel's bulk "Mark billed" flow (see [`history-client-grouping.md`](history-client-grouping.md)) to let him open a week and select day-by-day, e.g. "I billed Monday but not today." That's not representable today: the smallest billable unit is the week itself.

## Goal
- For **hourly** and **daily**-interval projects, a week in the History panel can be expanded to show its individual days, each independently markable/unmarkable as billed (its own `BilledPeriod`-equivalent record, own invoice ID).
- The bulk "Mark billed" client editor supports selecting/deselecting individual days within a week, not just whole weeks.
- **Weekly**-interval projects are unaffected — their rate is defined per week, so billing stays whole-week-only (no expand, no day split).
- Existing week-level `BilledPeriod` records are left as-is; no migration.

## Decisions

| # | Decision point | Options considered | Chosen | Confirmed with Paul |
|---|-----------------|---------------------|--------|----------------------|
| 1 | Finer billing unit | (a) per day, (b) per individual time entry/session | (a) Per day | 2026-09-02 |
| 2 | Weekly-interval projects | (a) whole-week-only, unaffected, (b) also allow day/entry splitting | (a) Whole-week-only, unaffected | 2026-09-02 |
| 3 | Existing week-level `BilledPeriod` records for hourly/daily projects | (a) migrate on load into per-day records, (b) leave as-is (untouched, effectively orphaned under the new day-keyed lookup) | (b) Leave as-is | 2026-09-02 |

Implementation note (not a fork): the Rust backend never interprets `period_start` — it's an opaque string key (see `models.rs` doc comment on `BilledPeriod`). A day key (`YYYY-MM-DD` for that specific day) and a week key (`YYYY-MM-DD` for that week's Monday) are both valid opaque strings in the same shape, so no backend/schema change is needed — this is a frontend-only change to what key gets sent to the existing `mark_period_billed`/`unmark_period_billed` commands.

## Approach

**`src/lib/history.ts`**
- Add `billedPeriodKeyFor(project, date)`: returns `weekStartKey(date)` for weekly-interval projects, `isoDateKey(date)` (day key) otherwise. Single source of truth for which key a project's billing lives under.
- Add `ProjectDayHistory` (day, dayKey, display, billedQuantity, amount, billed, invoiceId) and give `ProjectPeriodHistory` a `days: ProjectDayHistory[] | null` — populated for hourly/daily-interval periods (one entry per day touched, mirroring the existing per-period display logic but at day grain), `null` for weekly-interval periods.
- `summarizeAllHistory`: for hourly/daily projects, further bucket each period's entries by day and look up each day's billed status via `billedPeriodKeyFor`. The period's own `billed`/`invoiceId` become derived: fully billed only when every day is billed; `invoiceId` shown only when every billed day shares the same one. Weekly-interval periods unchanged.
- `summarizeUnbilledTotal`: for periods with `days`, sum unbilled quantity across unbilled days instead of an all-or-nothing period check.
- `hideBilledPeriods`: also filters each period's `days` down to unbilled ones.
- `buildTimeLogCsv`: signature changes from `(entries, project, billed, invoiceId)` to `(entries, project, billedPeriods)` — looks up each row's billed/invoiceId individually via `billedPeriodKeyFor`, since a CSV for one week can now span days with different billed status.
- `buildReportRows`: switch its per-entry billed lookup from a hardcoded `weekStartKey` to `billedPeriodKeyFor`.

**`src/components/HistoryPanel.tsx`**
- Selection keys (`selectedPeriods`, bulk editor) become `${projectId}::${dayKey}` for hourly/daily projects, `${projectId}::${periodStartKey}` (unchanged) for weekly.
- Week rows for hourly/daily projects get: a chevron to expand/collapse its day list, and a checkbox reflecting the aggregate selection state of its days (checked/unchecked/indeterminate) that toggles all of them at once — so the existing "select all, mark billed" flow keeps working without expanding, while expanding lets Paul deselect just today's slot.
- Expanded day rows reuse the existing single-item edit/unmark pattern (badge → invoice input → Save/Unmark), generalized to take `(projectId, periodStartKey)` directly so week rows (weekly-interval) and day rows (hourly/daily) share the same handlers.
- Partially-billed weeks show a muted "N of M days billed" label instead of the green Badge; clicking it expands rather than opening an edit form, since there's no single record to edit anymore.
- Selection-count copy drops the "weeks" unit ("N of M selected") since a client's bulk mark can now mix week- and day-granularity items across its projects.

**`src/components/ProjectLogScreen.tsx`**
- Correctness fix only, not a redesign: its single top-of-screen "Billed" badge was computed from one week-level lookup, which will no longer reflect reality for hourly/daily projects once new marks are day-keyed. Badge stays as-is for weekly-interval projects; for hourly/daily projects each entry row gets its own small billed indicator via `billedPeriodKeyFor`, and the CSV export call is updated to the new `buildTimeLogCsv` signature.

**Rust / `src-tauri`**: no changes.

## Task Checklist
- [x] `billedPeriodKeyFor` + `ProjectDayHistory`/`days` in `history.ts`, with updated `summarizeAllHistory`, `summarizeUnbilledTotal`, `hideBilledPeriods`
- [x] Update `buildTimeLogCsv` and `buildReportRows` to per-day lookup via `billedPeriodKeyFor`
- [x] `history.test.ts`: cover day-level billing, partial-week unbilled totals, hiding, and the new CSV/report signatures
- [x] `HistoryPanel.tsx`: expandable week rows, day-level checkboxes/selection, generalized edit/unmark handlers, updated bulk-mark copy
- [x] `HistoryPanel.test.tsx`: rewrite for day-level default-select-all + expand-to-deselect-one-day (the literal "billed Monday, not today" case)
- [x] `ProjectLogScreen.tsx`: per-day billed indicator for hourly/daily projects, updated CSV export call
- [x] `npm test` and `npm run typecheck` (or equivalent) pass

## Follow-ups / Open Questions
- If entry/session-level (finer than a day) billing is ever wanted, that's its own decision through this same process — day-level was chosen as sufficient for now.
