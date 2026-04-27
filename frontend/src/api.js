/**
 * Legacy facade for older components.
 *
 * New code should import from src/services/*, but keeping these exports wired to
 * the token-aware helper prevents older dashboard widgets from bypassing auth.
 */
import { BASE, EVENTS_URL, VIDEO_FEED_URL, get, post } from './services/api';

export { BASE, EVENTS_URL, VIDEO_FEED_URL };

export const fetchAdminAreas = () => get("/admin/areas");

export const fetchIntelligence = (cameraId = undefined) =>
  get("/intelligence", { camera_id: cameraId });

export const fetchLogs = (opts = {}) =>
  get("/logs", {
    hours: opts.hours ?? 24,
    camera_id: opts.camera_id ?? undefined,
    object_class: opts.objectClass ?? opts.object_class ?? undefined,
    severity: opts.severity ?? undefined,
    limit: opts.limit ?? 200,
    skip: opts.skip ?? 0,
  });

export const fetchLogsSummary = (hours = 24, camera_id = undefined) =>
  get("/logs/summary", { hours, camera_id });

export const fetchAlerts = (opts = {}) =>
  get("/alerts", {
    hours: opts.hours ?? 24,
    severity: opts.severity ?? undefined,
    limit: opts.limit ?? 100,
  });

export const fetchHealth = () => get("/health");

export function subscribeToEvents({ onSnapshot, onDetection, onError }) {
  const token = encodeURIComponent(localStorage.getItem('token') || '');
  const es = new EventSource(`${EVENTS_URL}?token=${token}`);

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onSnapshot?.(data);
      onDetection?.(data);
    } catch {
      onError?.(new Error("Invalid event payload"));
    }
  };

  es.addEventListener("snapshot", (e) => {
    try { onSnapshot?.(JSON.parse(e.data)); } catch {
      onError?.(new Error("Invalid snapshot payload"));
    }
  });

  es.addEventListener("detection", (e) => {
    try { onDetection?.(JSON.parse(e.data)); } catch {
      onError?.(new Error("Invalid detection payload"));
    }
  });

  es.onerror = (err) => {
    onError?.(err);
  };

  return () => es.close();
}

export async function login(email, password) {
  return post("/auth/login", { email, password });
}

export async function register(fullName, email, password) {
  return post("/auth/register", { full_name: fullName, email, password });
}
