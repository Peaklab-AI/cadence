# Plans

This folder holds implementation plans for features and significant changes, one file per feature: `docs/plans/<feature-slug>.md`.

A plan is not just a task list — it's a record that design forks were surfaced to Paul individually and confirmed *before* implementation, not decided unilaterally. That's the point of the "Decisions" section in [`template.md`](template.md): each real fork in the design (not every trivial choice) gets stated, Paul's answer gets recorded next to it, dated.

## Process

1. Copy [`template.md`](template.md) to `<feature-slug>.md`.
2. Fill in Context/Goal before design forks come up.
3. As each meaningful fork is hit, ask Paul directly (don't bundle several into one big "does this look right?"), then log the outcome in the Decisions table immediately — don't reconstruct it from memory afterward.
4. Once the plan is confirmed, implementation proceeds against the checklist.
5. If reality diverges from the plan mid-implementation (a decision turns out wrong, scope changes), update the plan and note it — don't let the doc go stale.

## Relationship to [`docs/decisions/`](../decisions/README.md)

- A plan's Decisions section is local, feature-scoped, and can include small implementation choices.
- If a decision made inside a plan is itself a significant, hard-to-reverse architectural choice (a new dependency, a data model, a pattern other features will follow), it also gets promoted to its own ADR in `docs/decisions/`, and the plan links to it instead of restating it.

## Index

| Feature | Status | Date |
|---------|--------|------|
| [Add tests for current logic](add-tests.md) | Done | 2026-07-28 |
| [Group History panel by client](history-client-grouping.md) | Done | 2026-08-26 |
| [Landing page — full agency-style composition](landing-page-agency-composition.md) | Done | 2026-08-26 |
| [PDF time-log report for a date range](pdf-report-for-date-range.md) | Done | 2026-08-26 |
| [PDF report branding & layout feedback](pdf-report-branding-and-layout.md) | Done | 2026-08-26 |
