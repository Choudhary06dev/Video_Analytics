import { get } from './api';

/**
 * Fetches real-time system health statistics from the backend.
 * @returns {Promise<Object>} Health metrics, camera stats, and compliance data.
 */
export const fetchHealthStats = () => get("/health/stats");
