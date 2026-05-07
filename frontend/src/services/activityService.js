import { get } from './api';

export const fetchActivityData = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/activity?${query}`);
};

export const fetchActivitySummary = (params = { hours: 24 }) => {
  const query = new URLSearchParams(params).toString();
  return get(`/activity/summary?${query}`);
};
