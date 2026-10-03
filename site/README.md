# Landing page source

The marketplace homepage at <https://cijagani.github.io/laravel-perf-audit-marketplace/>
is built from this Vite + React + TypeScript + Tailwind v4 + shadcn/ui + Motion project.

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

## Pages

Three static pages, one HTML entry each (listed in `vite.config.ts`):

| Page | Entry | Source |
|---|---|---|
| Home | `index.html` | `src/pages/home.tsx` |
| Sections | `sections.html` | `src/pages/sections.tsx` |
| Changelog | `changelog.html` | `src/pages/changelog.tsx` — renders the repo's `CHANGELOG.md` at build time |

## Edit content

All copy and data live in `src/content.ts`, including the section checklists
and the three files the hero animation audits. Shared chrome (nav, footer,
`MotionConfig reducedMotion="user"`) is `src/components/shell.tsx`; the hero
animation is `src/components/audit-run.tsx`.
