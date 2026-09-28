const express = require("express");
const cors = require("cors");
const path = require("path");
const { readState, writeState, resetState } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---- API ----------------------------------------------------------------

// Whole app state at once — the frontend loads this on startup.
app.get("/api/state", (req, res) => {
  res.json(readState());
});

// Farm profile
app.get("/api/farm", (req, res) => {
  res.json(readState().farm);
});

app.put("/api/farm", (req, res) => {
  const state = readState();
  state.farm = { ...state.farm, ...req.body };
  writeState(state);
  res.json(state.farm);
});

// Cattle registry
app.get("/api/cattle", (req, res) => {
  res.json(readState().cattle);
});

app.get("/api/cattle/:id", (req, res) => {
  const id = Number(req.params.id);
  const cow = readState().cattle.find((c) => c.id === id);
  if (!cow) return res.status(404).json({ error: "Cow not found" });
  res.json(cow);
});

// Toggle one item of a cow's forecast action-protocol checklist
app.post("/api/cattle/:id/protocol", (req, res) => {
  const id = Number(req.params.id);
  const { index } = req.body;
  if (typeof index !== "number") {
    return res.status(400).json({ error: "Body must include a numeric 'index'" });
  }
  const state = readState();
  const cow = state.cattle.find((c) => c.id === id);
  if (!cow) return res.status(404).json({ error: "Cow not found" });
  cow.done = cow.done || [];
  cow.done[index] = !cow.done[index];
  writeState(state);
  res.json(cow);
});

// Mark a cow's health risk resolved / back to normal
app.post("/api/cattle/:id/resolve", (req, res) => {
  const id = Number(req.params.id);
  const state = readState();
  const cow = state.cattle.find((c) => c.id === id);
  if (!cow) return res.status(404).json({ error: "Cow not found" });
  cow.risk = "ok";
  cow.issue = null;
  cow.tags = [];
  cow.onset = null;
  cow.done = [];
  writeState(state);
  res.json(cow);
});

// Gateway / sensor nodes (ESP32 nodes, CCTV feeds, etc.)
app.get("/api/gateways", (req, res) => {
  res.json(readState().gateways);
});

// Offline-storage + treatment counters shown in Settings
app.get("/api/stats", (req, res) => {
  res.json(readState().stats);
});

// Log a milking event for a cow
app.post("/api/milking", (req, res) => {
  const { cowId, yield: milkYield } = req.body;
  const state = readState();
  const cow = state.cattle.find((c) => c.id === Number(cowId));
  if (cowId !== undefined && !cow) {
    return res.status(404).json({ error: "Cow not found" });
  }
  state.stats.milking += 1;
  writeState(state);
  res.status(201).json({ stats: state.stats, cowId: cowId ?? null, yield: milkYield ?? null });
});

// Trigger an emergency vet alert (for a specific cow, or the farm generally)
app.post("/api/vet-alert", (req, res) => {
  const { name } = req.body || {};
  const state = readState();
  state.stats.treatments += 1;
  writeState(state);
  res.status(201).json({ stats: state.stats, name: name || null });
});

// Cloud sync simulation — records the last-synced timestamp
app.post("/api/sync", (req, res) => {
  const state = readState();
  state.lastSync = Date.now();
  writeState(state);
  res.json({ lastSync: state.lastSync });
});

// Language preference
app.put("/api/settings/lang", (req, res) => {
  const { lang } = req.body;
  if (!["en", "hi", "mr"].includes(lang)) {
    return res.status(400).json({ error: "lang must be one of en, hi, mr" });
  }
  const state = readState();
  state.lang = lang;
  writeState(state);
  res.json({ lang: state.lang });
});

// Danger zone — wipe everything back to a fresh demo farm
app.delete("/api/account", (req, res) => {
  const fresh = resetState();
  res.json(fresh);
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ---- Static frontend ------------------------------------------------------
// Serves the SPA so the whole app runs from a single origin/port
// (no CORS juggling needed when you open it in a browser).
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`EKAKSH backend + app running at http://localhost:${PORT}`);
});
