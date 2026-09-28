// Tiny file-backed "database".
//
// This app is small enough that a single JSON file is a perfectly good
// datastore, and it means the backend runs anywhere Node runs with zero
// native dependencies (no sqlite/postgres driver to compile or install).
// Swap this module out for a real database later without touching any
// of the route handlers in server.js — they only call these functions.
const fs = require("fs");
const path = require("path");
const freshState = require("./defaultState");

const DB_FILE = path.join(__dirname, "data", "db.json");

function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(freshState(), null, 2));
  }
}

function readState() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Corrupt file — reset rather than crash the server.
    const fresh = freshState();
    writeState(fresh);
    return fresh;
  }
}

function writeState(state) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  return state;
}

function resetState() {
  return writeState(freshState());
}

module.exports = { readState, writeState, resetState };
