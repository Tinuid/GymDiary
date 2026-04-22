# GymDiary

Mobile PWA zum Tracken deiner Gewichte im Fitnessstudio. Single-User, Daten bleiben lokal im Browser (IndexedDB). Offline-fähig, installierbar auf dem Homescreen.

## Features (MVP)

- Galerie mit Gerätefotos, Filter nach Muskelgruppe
- Satz-Erfassung mit großen Stepper-Buttons (2,5-kg-Schritten)
- Letzte Session direkt beim Öffnen eines Geräts sichtbar
- Progress-Graph (max. Gewicht pro Session) über 30 Tage / 6 Monate / alles
- JSON-Backup-Export und -Import
- Dark Mode, Deutsch, kg

## Entwicklung

```bash
npm install
npm run dev          # lokaler Dev-Server
npm run build        # Production-Build nach dist/
npm run preview      # Preview des Builds
```

Öffne den Dev-Server im Browser mit Mobile-Emulation (z. B. Chrome DevTools → iPhone 12).

## Deployment (GitHub Pages)

1. Repository auf GitHub anlegen (Name: `GymDiary`).
2. `git init`, Commit, Push nach `main`.
3. In den Repo-Settings unter **Pages** als **Source** „GitHub Actions" wählen.
4. Nach dem ersten Push läuft `.github/workflows/deploy.yml` automatisch.
5. Die App ist unter `https://<user>.github.io/GymDiary/` erreichbar und als PWA installierbar.

Wenn du das Repo anders nennst, passe `base` in `vite.config.ts` sowie `start_url`/`scope` im Manifest an.

## Icons

Die Platzhalter-Icons werden via `node scripts/gen-icons.cjs` erzeugt. Ersetze die PNGs in `public/icons/` durch eigene 192×192- und 512×512-Icons, wenn du ein Logo hast.

## Tech-Stack

React 18 + TypeScript + Vite · IndexedDB via `idb` · Zustand · Recharts · `vite-plugin-pwa` (Workbox) · CSS Modules · date-fns mit deutscher Locale.
