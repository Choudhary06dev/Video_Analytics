import { get } from './api';

export const fetchActivityData = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/activity?${query}`);
};

export const fetchActivitySummary = (hours = 24) => {
  return get(`/activity/summary?hours=${hours}`);
};
