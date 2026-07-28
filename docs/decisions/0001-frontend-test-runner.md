# ADR-0001: Use Vitest for frontend tests

## Status
Accepted

## Date
2026-07-28

## Context
Cadence's frontend (`src/`) had no test infrastructure at all — no test runner, no config, no test files. Adding tests for the existing pure logic (`src/lib/*`, the `TrackerContext` retry backoff) required picking a runner first. The frontend is Vite 7 + React 19 + TypeScript, built as an ESM package (`"type": "module"` in `package.json`).

## Decision
Use [Vitest](https://vitest.dev/) as the frontend test runner, with `jsdom` as the test environment and `@testing-library/react` for hook/component rendering.

## Alternatives Considered

### Jest
- Pros: More established, most tutorials/StackOverflow answers assume it.
- Cons: Not Vite-native — needs extra transform config (`ts-jest` or `babel-jest`) to handle the project's existing Vite/ESM pipeline, and historically has had friction with pure-ESM packages.
- Rejected because: it would duplicate a second build/transform pipeline alongside the Vite one already powering `dev`/`build`, for no benefit given this project's stack.

## Consequences
- Test config (`vitest.config.ts`) reuses the same `@vitejs/plugin-react` plugin as `vite.config.ts`, kept as a separate file rather than merged into it, since `vite.config.ts`'s Tauri-specific `server` block and async config factory (driven by `TAURI_DEV_HOST`) have no reason to be evaluated for test runs.
- `pnpm test` (`vitest run`) and `pnpm test:watch` (`vitest`) are the standard entry points going forward.
- Future frontend tests (including any eventual component tests) should default to Vitest + Testing Library rather than introducing a second runner.
