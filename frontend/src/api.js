/**
 * api.js — Centralized API service for Video Analytics frontend
 *
 * All backend calls go through here.  Components just import what they need.
 */

const BASE = "http://localhost:8000";

// ─── helpers ───────────────────────────────────────────────────────────────

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

// ─── intelligence (live camera stats) ──────────────────────────────────────

export const fetchIntelligence = () => get("/intelligence");

// ─── logs ──────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {number}  [opts.hours=24]
 * @param {string}  [opts.objectClass]
 * @param {string}  [opts.severity]   "critical" | "warning" | "info"
 * @param {number}  [opts.limit=200]
 */
export const fetchLogs = (opts = {}) =>
  get("/logs", {
    hours:        opts.hours        ?? 24,
    object_class: opts.objectClass  ?? undefined,
    severity:     opts.severity     ?? undefined,
    limit:        opts.limit        ?? 200,
  });

export const fetchLogsSummary = (hours = 24) =>
  get("/logs/summary", { hours });

// ─── alerts ────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {number} [opts.hours=24]
 * @param {string} [opts.severity]
 * @param {number} [opts.limit=100]
 */
export const fetchAlerts = (opts = {}) =>
  get("/alerts", {
    hours:    opts.hours    ?? 24,
    severity: opts.severity ?? undefined,
    limit:    opts.limit    ?? 100,
  });

// ─── health ────────────────────────────────────────────────────────────────

export const fetchHealth = () => get("/health");

// ─── Server-Sent Events (real-time push) ───────────────────────────────────

/**
 * Subscribe to real-time detection events from the backend.
 *
 * @param {object} handlers
 * @param {function} handlers.onSnapshot  - called with initial state
 * @param {function} handlers.onDetection - called on each new detection batch
 * @param {function} [handlers.onError]   - called on connection error
 * @returns {function} cleanup — call this to close the connection
 *
 * Usage:
 *   const stop = subscribeToEvents({
 *     onSnapshot: (data) => setState(data),
 *     onDetection: (data) => appendLogs(data),
 *   });
 *   // later:
 *   stop();
 */
export function subscribeToEvents({ onSnapshot, onDetection, onError }) {
  const es = new EventSource(`${BASE}/events`);

  es.addEventListener("snapshot", (e) => {
    try { onSnapshot?.(JSON.parse(e.data)); } catch {}
  });

  es.addEventListener("detection", (e) => {
    try { onDetection?.(JSON.parse(e.data)); } catch {}
  });

  es.onerror = (err) => {
    onError?.(err);
  };

  return () => es.close();
}

// ─── auth ──────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Login failed");
  }
  return res.json();
}

export async function register(fullName, email, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: fullName, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Registration failed");
  }
  return res.json();
}
