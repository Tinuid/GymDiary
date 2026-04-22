# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GymDiary is a mobile-first PWA for tracking gym training weights. Single-user, offline-first, no backend — all data lives in the browser's IndexedDB. UI language is German, unit is kg. Deploys to GitHub Pages under `/GymDiary/`.

## Commands

```bash
npm install             # install deps
npm run dev             # Vite dev server at http://localhost:5173/GymDiary/
npm run build           # tsc -b && vite build → dist/ (generates SW + manifest)
npm run preview         # serve the built output (needed to test the service worker)
npm run lint            # ESLint on .ts/.tsx
node scripts/gen-icons.cjs   # regenerate placeholder PWA icons in public/icons/
```

There is no test runner configured. `tsc -b` runs as part of `build` and is the de-facto type check.

## Architecture

**Flow from UI down to storage**: React component → `src/db/*` module → `getDb()` in `src/db/schema.ts` → IndexedDB via the `idb` package.

### Persistence layer (`src/db/`)

- `schema.ts` owns the singleton `getDb()`. It opens database `gymdiary` v1 with four object stores: `machines`, `sessions`, `sets`, `meta`. Schema changes require bumping `DB_VERSION` and extending the `upgrade` callback.
- `machines.ts`, `sessions.ts`, `sets.ts` are thin CRUD modules. They do **not** call each other; cross-store consistency (e.g. deleting a machine cascades its sessions and sets) is handled explicitly via `db.transaction([...], 'readwrite')` in `deleteMachine`.
- `sessions.ts::getOrCreateTodaysSession(machineId)` is the entry point whenever a set is recorded — there is always exactly one session per machine per calendar day (day-boundary computed via `startOfDay` at local time).
- `backup.ts` serializes the full DB to a versioned JSON payload (photos as data-URLs). `importBackup` supports `merge` vs `replace` modes in one transaction.

### Photos

Photos are stored as **Blobs** directly in IndexedDB (`photoBlob` + smaller `photoThumbBlob`). All resizing goes through `src/lib/image.ts::resizeToWebp` / `makeThumb`, which prefer `OffscreenCanvas` and fall back to a DOM `<canvas>`. Full image caps at 800 px edge, thumb at 240 px, both WebP. To display a Blob in a component, use the `useBlobUrl` hook (`src/components/useBlobUrl.ts`) — it creates and revokes object URLs for you.

### State

Zustand store in `src/store/useAppStore.ts` holds only the machine list (used by Gallery + Settings count). `refreshMachines()` must be called after any mutation that affects the list (`createMachine`, `updateMachine`, `deleteMachine`, `touchMachine`, `importBackup`). Per-machine detail state lives component-locally in `MachineDetail.tsx`.

### Routing

`HashRouter` (not BrowserRouter) in `src/main.tsx`. This is deliberate — it avoids 404s on GitHub Pages where arbitrary paths under `/GymDiary/` would otherwise 404 on refresh. Routes: `/`, `/geraet/neu`, `/geraet/:id`, `/geraet/:id/bearbeiten`, `/geraet/:id/progress`, `/settings`.

### MachineDetail load pattern

`MachineDetail.tsx` loads all four pieces of state (machine, today's session, today's sets, previous session + its sets) and commits them in **one** setState burst, guarded by a `loaded` flag. This prevents `SetInput` from mounting with stale defaults before `previousSession` is ready — `SetInput` uses `useState(initialProp)` and will not react to later prop changes. A `key={lastSet?.id ?? 'empty'}` on `<SetInput>` forces a remount after save/delete so the stepper picks up the newest values. Preserve this pattern when extending.

### PWA

`vite-plugin-pwa` generates `sw.js` and the manifest from `vite.config.ts`. Precache glob includes `js,css,html,webp,png,svg,woff2`. `base: '/GymDiary/'` is hard-coded — change it together with `start_url` and `scope` in the same file if the repo is renamed. The service worker is only active in `preview`/production builds, not in `dev`.

### Styling

CSS custom properties in `src/theme.css` (dark mode default). Component-local styles via CSS Modules (`Foo.module.css`). No UI framework — keep it that way; Recharts is the only heavy visual dep.

### Deployment

`.github/workflows/deploy.yml` uses `actions/deploy-pages` (not the legacy `gh-pages` branch). Requires **Pages source set to "GitHub Actions"** in repo settings. Triggered by push to `main`.

## Conventions

- Language everywhere user-facing: German. Dates via `date-fns` with the `de` locale (see `src/lib/format.ts`).
- IDs are UUIDv4 (`uuid` package), generated in the DB layer, never by the caller.
- Weight stepper uses 2.5 kg increments, reps use 1-step.
- Muscle groups are a fixed union in `src/types.ts::MuscleGroup` + `MUSCLE_GROUPS`. Add new ones there, not as free strings.
