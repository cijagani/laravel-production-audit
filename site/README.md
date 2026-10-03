# Landing page source

The marketplace homepage at <https://cijagani.github.io/laravel-perf-audit-marketplace/>
is built from this Vite + React + TypeScript + Tailwind v4 + shadcn/ui project.

## Develop

```bash
cd site
npm install
npm run dev
```

## Build

```bash
npm run build
```

This compiles into the repo's `../docs/` folder (configured in `vite.config.ts`),
which GitHub Pages serves from `main` / `/docs`. The `base` is set to
`/laravel-perf-audit-marketplace/` so asset URLs resolve under the project-pages path —
**change `base` in `vite.config.ts` if you publish under a different repo name.**

`docs/SAMPLE_REPORT.md` is shipped via `public/` so it survives the build.

## Edit content

All copy and data live in `src/content.ts`. Page composition is in `src/App.tsx`;
the two custom pieces are `src/components/report-panel.tsx` (the hero artifact)
and `src/components/command-block.tsx` (copy-to-clipboard). Design tokens — the
severity palette and fonts — are in `src/index.css`.
