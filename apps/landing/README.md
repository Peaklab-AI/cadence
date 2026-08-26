# Cadence landing page

The marketing site at [cadence.peaklab.ai](https://cadence.peaklab.ai). A Vite + React + TypeScript app built on `@peaklab/ui`.

## Prerequisites

This package depends on `@peaklab/ui` via a `link:` dependency, so a sibling checkout of `peaklab-ui` must exist alongside `cadence`:

```
work/
├── cadence/
└── peaklab-ui/
```

## Develop

From the repo root:

```sh
pnpm install
pnpm dev:landing
```

This starts the Vite dev server (default `http://localhost:5173`, or the next free port).

Alternatively, from this directory:

```sh
pnpm install
pnpm dev
```

## Other commands

Run from this directory, or via the root's `pnpm --filter @cadence/landing <script>`:

```
pnpm build       # type-checks and builds the static site to dist/
pnpm preview     # serves the production build locally
pnpm typecheck   # tsc --noEmit
```

## Structure

```
index.html   Entry HTML — SEO/OG/JSON-LD meta tags live in <head>, untouched by the React app
src/         React app: App.tsx, main.tsx, components/
public/      Static assets served as-is: install.sh, robots.txt, sitemap.xml, downloads/
```

## Releasing

The Cadence app's `scripts/release.sh` (run from the repo root) drops built `.app` bundles into `public/downloads/` — the URL `install.sh` downloads from. The next deploy of this site picks those up.
