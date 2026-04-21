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
    object_class: opts.objectClass ?? undefined,
    severity: opts.severity ?? undefined,
    limit: opts.limit ?? 200,
  });

export const fetchLogsSummary = (hours = 24) =>
  get("/logs/summary", { hours });

export function subscribeToEvents({ onSnapshot, onDetection, onError }) {
    const es = new EventSource(`${BASE}/events`);
  
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
