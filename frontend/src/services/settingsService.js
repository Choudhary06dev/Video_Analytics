import { get, post } from './api';

/**
 * Fetches system-wide configurations from the backend.
 */
export const fetchSystemSettings = () => get("/settings");

/**
 * Updates system-wide configurations in the backend.
 * @param {Object} settings - The new settings object.
 */
export const updateSystemSettings = (settings) => post("/settings", settings);
