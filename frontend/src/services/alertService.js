import { get, BASE } from './api';

export const fetchAlerts = (opts = {}) =>
  get("/alerts", {
    hours: opts.hours ?? 24,
    severity: opts.severity ?? undefined,
    limit: opts.limit ?? 100,
  });

export const fetchLogs = (opts = {}) =>
  get("/logs", {
    hours: opts.hours ?? 24,
    camera_id: opts.camera_id ?? opts.cameraId ?? undefined,
    object_class: opts.objectClass ?? undefined,
    severity: opts.severity ?? undefined,
    limit: opts.limit ?? 200,
    skip: opts.skip ?? 0,
  });

export const fetchLogsSummary = (hours = 24, camera_id = undefined) =>
  get("/logs/summary", { hours, camera_id });

export function subscribeToEvents({ onSnapshot, onDetection, onError }) {
    const token = encodeURIComponent(localStorage.getItem('token') || '');
    const es = new EventSource(`${BASE}/events?token=${token}`);
  
    es.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            onSnapshot?.(data);
            onDetection?.(data);
        } catch (err) {
            console.error("Error parsing EventSource data:", err);
        }
    };
  
    es.onerror = (err) => {
      onError?.(err);
    };
  
    return () => es.close();
}
