# Desk Dashboard — Module Map

Static HTML/CSS/JS dashboard, hosted on GitHub Pages, displayed via Fully
Kiosk Browser on a repurposed Android phone. No build step, no backend
(currently) — everything runs client-side in the browser.

Share this file with any AI assistant working on the project so it
understands the shape of the system before making changes.

## File tree

```
desk-dashboard/
├── index.html          # page shell — all widget markup lives here
├── css/
│   └── style.css        # single stylesheet, e-ink-inspired dark theme
├── js/
│   ├── config.js         # CONFIG — single source of truth for settings
│   ├── clock.js           # ClockWidget — time/date, no network
│   ├── weather.js         # WeatherWidget — Open-Meteo API (primary + secondary city)
│   ├── calendar.js        # CalendarWidget — Google Calendar ICS feed → agenda list
│   ├── medication.js      # MedicationWidget — scheduled full-screen reminder + confirm
│   └── app.js              # App — boots all widgets, shared flicker effect, status row
└── README.md            # GitHub Pages + Fully Kiosk setup instructions
```

## Load order (matters)

`config.js` → `clock.js` → `weather.js` → `calendar.js` → `medication.js` → `app.js`

`app.js` must load last — it calls `.init()` on every other widget on
`DOMContentLoaded`. `config.js` must load first — every widget reads from
the global `CONFIG` object.

## Module contract

Every widget is a plain JS object (not a class) with this shape:

```js
const SomeWidget = {
  els: { /* cached DOM references */ },
  init() { /* cache DOM, do first fetch/render, set up interval */ },
  fetch() { /* optional — pull data from an API */ },
  render(data) { /* optional — write data into els */ },
};
```

`App.init()` in `app.js` is the only place that calls each widget's
`.init()`. To add a new widget: write it in this shape, add its markup to
`index.html`, add its styles to `style.css`, add a `<script>` tag, and add
one line to `App.init()`.

## Current modules

| Module | Purpose | Data source | Refresh |
|---|---|---|---|
| `ClockWidget` | Live time + date | `Date()`, local | 1s |
| `WeatherWidget` | Temp/conditions for `CONFIG.location` + `CONFIG.secondaryLocation` | Open-Meteo API (no key) | `CONFIG.refresh.weather` (10 min) |
| `CalendarWidget` | Upcoming agenda items | Google Calendar ICS feed via CORS proxy, custom parser | `CONFIG.refresh.calendar` (5 min) |
| `MedicationWidget` | Full-screen reminder at scheduled times, "Taken" confirm | `CONFIG.medications` (hardcoded array, per-day confirm state in `localStorage`) | checks every 1s |

## Shared utilities

- `App.flicker(el)` — brief screen-invert animation on a panel, used after
  any widget re-renders, to mimic e-ink ghosting. Call this from any new
  widget's render step if you want the same visual cue.
- `App.renderStatus()` — small "SYNCED HH:MM · LOCATION" line, bottom right.

## Known constraints / things to know before changing things

- **No backend yet.** All config (medications, location, calendar URL) is
  hardcoded in `js/config.js` and requires a git commit + push to change.
  This is a live pain point — see "Planned: Sheets-backed config" below.
- **No auth.** The site is public (GitHub Pages free tier requires a public
  repo). Anything in `config.js`, including the Google Calendar secret ICS
  URL, is visible to anyone who finds the repo.
- **`localStorage` is used** for per-day medication confirmation state.
  This is device-local — if the dashboard is opened on a different device
  or the browser cache is cleared, confirmation history is lost. This is
  also why "what did I take yesterday" currently isn't answerable — see
  below.
- **Deployment = GitHub Pages**, auto-publishes from the `main` branch root
  on every commit. Browser/kiosk-side caching has repeatedly caused
  "I changed the code but nothing changed on screen" confusion — always
  hard-refresh or clear cache after a push when testing.
- **Kiosk device**: old Redmi Note 8 Pro running Fully Kiosk Browser,
  always plugged in, screen always on.

## Planned: Sheets-backed config (not yet built)

Under discussion: moving `medications`, shopping list, and checklists out
of hardcoded `config.js` into a Google Sheet, with a Google Apps Script
web app as a small JSON API in between (read config + log confirmations
for history). This directly solves the "medication doses change after
each doctor visit" and "what did I take yesterday" problems. See chat
history / project notes for the current state of that design — it is not
implemented as of this file's writing.