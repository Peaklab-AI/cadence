# Plan: Group History Panel by Client

## Status
Done

## Context
The History panel (`src/components/HistoryPanel.tsx`) used to list every project's tracked time as its own top-level card, ordered by whichever project was most recently logged. Paul invoices per client, and when a client has more than one project there was no single place to see "how much do I need to invoice this client right now," nor a way to settle an invoice without clicking "Mark billed" on every individual week across every project. This plan covers restructuring the panel to group by client, surfacing a per-client unbilled total, and moving the billing action to that total so one click settles everything an invoice covers.

## Goal
- The History panel's top-level grouping is by client, not by project.
- Each client shows its own unbilled total, broken out per currency.
- Clients are ordered by unbilled amount owed, highest first.
- "Mark billed" is a single action per client-currency total (one invoice ID covers every currently-unbilled period across that client's projects in that currency), not a per-period action.
- Individual periods stay visually compact and still show their billed status, with a per-period Unmark/edit for after-the-fact corrections.

## Decisions

| # | Decision point | Options considered | Chosen | Confirmed with Paul |
|---|-----------------|---------------------|--------|----------------------|
| 1 | Grouping depth within a client | (a) keep project as its own sub-section under the client, (b) flatten all periods from every project into one chronological list per client | (a) Keep project sub-groups — client header, then each project keeps its own mini-header and periods | 2026-08-26 |
| 2 | How to compute the per-client total | (a) sum unbilled $ amount per currency across the client's projects, (b) no combined total, just visual grouping | (a) Sum unbilled amount per currency; projects with no rate set contribute no figure | 2026-08-26 |
| 3 | Client ordering | (a) highest unbilled amount first, (b) most-recently-logged first, (c) alphabetical | (a) Highest amount owed first | 2026-08-26 |
| 4 | Where "Mark billed" lives and what one click marks | (a) one action per client-currency total, marking every currently-unbilled period across all of that client's projects in that currency under one invoice ID, (b) one action per project total | (a) Client total, per currency | 2026-08-26 |
| 5 | Undo granularity after a batch mark | (a) keep per-period Unmark/edit for individual corrections, (b) bulk-only undo of the whole batch | (a) Keep per-period Unmark | 2026-08-26 |

Implementation note (not a fork, just a mechanical choice): when a client has unbilled amounts in more than one currency, there's no single correct way to add them for sorting purposes. Ordering sums the raw numbers across currencies purely as an internal sort key (never displayed).

## Approach

**`src/lib/history.ts`**
- `ProjectHistory` gained `clientId`, populated from `project.clientId` in `summarizeAllHistory`.
- `groupHistoryByClient(groups, projects): ClientHistory[]` groups project histories by client, sums unbilled amounts per currency via the existing `summarizeUnbilledTotal`, and sorts clients by that sum (see decisions 2–3).

**`src/components/HistoryPanel.tsx`**
- Renders client → project → period. The client header shows one line per currency in `clientGroup.unbilledTotals`, each with its own "Mark billed" button.
- Clicking a currency's "Mark billed" opens one invoice-ID input for that client+currency (`editingClientCurrency` state). Saving (`handleMarkClientBilled`) collects every period across `clientGroup.projects` where `group.currency` matches and `!period.billed`, and calls the existing `markPeriodBilled` once per period with the same invoice ID (`Promise.all`), then refreshes.
- Per-period rows no longer show a "Mark billed" affordance — only a billed period shows its `Badge` (click to edit invoice ID or Unmark via the existing `editingKey`/`handleSaveBilled`/`handleUnmarkBilled`, unchanged). An unbilled period is now a plain read-only row.
- Period rows and project card padding were tightened (`p-2.5`→`p-2`, `py-2`→`py-1`, `text-sm`→`text-xs` for the period label/amount) so more of a client's history fits on screen at once, per Paul's request for "a full picture of the client."

## Task Checklist
- [x] Add `clientId` to `ProjectHistory`; implement `groupHistoryByClient`
- [x] Restructure `HistoryPanel.tsx` for client → project → period nesting with client-level totals
- [x] Move "Mark billed" to the client-per-currency total; batch-apply one invoice ID across that client's currently-unbilled periods in that currency
- [x] Keep per-period Unmark/edit for billed periods only; drop the per-period "Mark billed" control
- [x] Tighten period/project row spacing and type size for a denser view
- [x] Unit tests for `groupHistoryByClient` in `src/lib/history.test.ts`; manual render-based verification of both the grouping/ordering and the batch mark-billed flow (temporary tests, removed after confirming behavior)

## Follow-ups / Open Questions
- If mixed-currency-per-client roll-up (a single converted total) is ever wanted, that needs its own decision (exchange rate source) through this same process.
