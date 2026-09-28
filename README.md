# EKAKSH — Precision Cattle Care

A precision cattle-monitoring dashboard: a real Node/Express **backend**
with a small JSON-file database, plus the original single-page **frontend**,
now wired to talk to it over a REST API instead of just simulating
everything in `localStorage`.

```
ekaksh/
├── backend/            Express API server (also serves the frontend)
│   ├── server.js         Route handlers
│   ├── db.js             Tiny JSON-file "database" (data/db.json, created on first run)
│   ├── defaultState.js   Seed data for a fresh farm
│   └── package.json
└── frontend/
    └── index.html        The dashboard UI (HTML+CSS+JS in one file)
```

## Run it

You need [Node.js](https://nodejs.org) 18+ installed.

```bash
cd backend
npm install
npm start
```

Then open **http://localhost:3000** in your browser. The backend serves the
frontend itself, so there's only one URL and no CORS setup needed.

The server listens on port `3000` by default; set `PORT=xxxx` to change it.

## What's real now vs. before

The original version stored everything in the browser's `localStorage` and
never talked to a server — closing the tab on another device meant starting
over. Now:

- **Farm profile, cattle registry, gateway nodes, milking logs, vet-alert
  counts, forecast checklists, language setting, and sync timestamp** are
  all persisted server-side in `backend/data/db.json` (created automatically
  on first run) and served through a REST API (see below).
- The frontend fetches this state on load and calls the API for every
  action (logging a milking, resolving a risk, ticking a protocol checklist
  item, changing language, syncing, deleting the account).
- **Offline fallback is kept**: if you open `frontend/index.html` directly
  as a file, or the backend isn't running, the app detects that and falls
  back to the old bundled-defaults + `localStorage` behavior so it still
  works standalone — you'll just see a small "Offline" toast.

## API reference

All endpoints are under `/api` and return JSON.

| Method | Path                        | Description                                    |
|--------|-----------------------------|-------------------------------------------------|
| GET    | `/api/state`                | Full app state (farm, cattle, gateways, stats)   |
| GET    | `/api/farm`                 | Farm profile                                     |
| PUT    | `/api/farm`                 | Update farm profile                              |
| GET    | `/api/cattle`               | All cattle records                               |
| GET    | `/api/cattle/:id`           | One cow's record                                 |
| POST   | `/api/cattle/:id/protocol`  | Toggle a forecast checklist item (`{index}`)     |
| POST   | `/api/cattle/:id/resolve`   | Mark a cow's risk resolved / healthy             |
| GET    | `/api/gateways`             | Sensor / gateway node statuses                   |
| GET    | `/api/stats`                | Milking log & treatment counters                 |
| POST   | `/api/milking`              | Log a milking (`{cowId, yield}`)                 |
| POST   | `/api/vet-alert`            | Trigger a vet alert (`{name}` optional)          |
| POST   | `/api/sync`                 | Simulate a cloud sync, updates `lastSync`        |
| PUT    | `/api/settings/lang`        | Set language (`{lang: "en"|"hi"|"mr"}`)          |
| DELETE | `/api/account`              | Wipe all data back to the seed demo farm         |
| GET    | `/api/health`               | Basic health check                               |

## Customize

Starting cattle records, gateway nodes, and default farm info are in
`backend/defaultState.js`. Edit that file, then delete
`backend/data/db.json` (or call `DELETE /api/account`) to re-seed.

## Notes / next steps

This is a small JSON-file datastore, deliberately kept dependency-free so it
runs anywhere Node runs. For a production deployment you'd want to swap
`backend/db.js` for a real database (Postgres/SQLite/etc.) — the route
handlers in `server.js` only call `readState()` / `writeState()`, so that's
a self-contained change. There's also no authentication yet; every request
reads/writes the one shared farm's data, which is fine for a single-farm
demo but would need per-user accounts and auth for multiple farms.
