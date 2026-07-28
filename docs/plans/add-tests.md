# Plan: Add tests for current logic

## Status
Done

## Context
Cadence had zero test infrastructure on either side — no vitest/jest config, no `#[cfg(test)]` outside `storage.rs`/`config.rs`, no `test` script. Paul asked for tests covering the existing logic (particularly the "retry after timeout" and "notes" features from the two commits before this work) and wanted Claude able to run the resulting test/lint/build commands without a permission prompt each time.

## Goal
Pure business logic on both the frontend (`src/lib/*`, the `TrackerContext` retry backoff) and backend (`commands.rs`/`models.rs`/`timer.rs` pure functions) has test coverage; `.claude/settings.json` auto-approves the commands needed to run tests, lint, and build.

## Decisions

| # | Decision point | Options considered | Chosen | Confirmed with Paul |
|---|-----------------|---------------------|--------|----------------------|
| 1 | Frontend test runner | Vitest vs Jest | Vitest — Vite-native, shares the existing Vite 7/ESM/React 19 pipeline. See [ADR-0001](../decisions/0001-frontend-test-runner.md) | 2026-07-28 |
| 2 | `timer.rs::tick` untestable as-is (takes `&AppHandle`, calls `Utc::now()` inline) | Extract pure `evaluate_tick` vs. skip testing timer.rs this pass | Extract `evaluate_tick(state, now, tick_count) -> TickAction`, behavior-preserving | 2026-07-28 |
| 3 | Scope of this pass | Pure logic only vs. also bootstrap React component tests | Pure logic only. Component tests + `tray.rs` clock-injection refactor deferred to follow-ups | 2026-07-28 |
| 4 | Vitest choice is a real framework/dependency decision | Log only in this plan vs. also write a standalone ADR | Also wrote [ADR-0001](../decisions/0001-frontend-test-runner.md) | 2026-07-28 |

## Approach
- Bootstrapped Vitest (`vitest`, `jsdom`, `@testing-library/react`) with a standalone `vitest.config.ts` and `pnpm test`/`pnpm test:watch` scripts.
- Wrote frontend unit tests for `src/lib/history.ts` (the richest pure logic — week bucketing, billing math, CSV export), `src/lib/time.ts`, `src/lib/currency.ts`, `src/lib/tauriCommands.ts` (the command-timeout wrapper), and `src/context/TrackerContext.tsx` (the `RETRY_DELAYS_MS` backoff sequencing).
- Extracted `evaluate_tick` out of `src-tauri/src/timer.rs::tick` — the actual "retry after timeout" state machine — into a pure function of `(TrackingState, now, tick_count) -> TickAction`, behavior-preserving, then added `#[cfg(test)]` coverage for every status transition.
- Added `#[cfg(test)]` coverage for `commands.rs::entry_duration_seconds`, `commands.rs::sanitize_filename`, `commands.rs::projects_by_usage`, and `models.rs::Interval::threshold_seconds`.
- Merged `.claude/settings.json` permissions for `pnpm test`/`lint`/`build` (both `pnpm x` and `pnpm run x` forms) and `cargo test` (run via `cd src-tauri && cargo test`).

## Task Checklist
- [x] `pnpm add -D vitest jsdom @testing-library/react`
- [x] Create `vitest.config.ts`
- [x] Add `test`/`test:watch` scripts to `package.json`
- [x] Write `src/lib/history.test.ts`
- [x] Write `src/lib/time.test.ts`
- [x] Write `src/lib/currency.test.ts`
- [x] Write `src/lib/tauriCommands.test.ts`
- [x] Write `src/context/TrackerContext.test.tsx`
- [x] Refactor `src-tauri/src/timer.rs` to extract `evaluate_tick`
- [x] Add `#[cfg(test)]` tests to `timer.rs`
- [x] Add `#[cfg(test)]` tests to `commands.rs` (3 functions)
- [x] Add `#[cfg(test)]` tests to `models.rs`
- [x] Merge permission diff into `.claude/settings.json`
- [x] Write `docs/decisions/0001-frontend-test-runner.md`
- [x] Write `docs/plans/add-tests.md`
- [x] Update `docs/decisions/README.md` and `docs/plans/README.md` index tables
- [x] Run `pnpm test`, `pnpm lint`, `pnpm build`, `cargo test`, `pnpm check:links`

## Follow-ups / Open Questions
- React component tests (screens in `src/components/`) — deferred, no component-test harness conventions established yet.
- `tray.rs::consume_recent_blur_hide` / `should_nag_leave_off` — same untestable-as-written problem `timer.rs` had; needs an injected-clock refactor. Lower priority since it's not the feature the last two commits touched.
- Replacing `storage.rs`/`config.rs`'s hand-rolled `std::env::temp_dir() + uuid` test dirs with the `tempfile` crate — cosmetic, not required for this pass.
- No CI workflow runs `pnpm test`/`pnpm build`/`cargo test` yet (`.github/workflows/` only has `docs.yml`) — wiring these into CI is a separate future decision.
- Coverage tooling (`@vitest/coverage-v8`) not included — revisit if coverage thresholds become a goal.
