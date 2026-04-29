import { get, post } from './api';
export const fetchTrainingStats = () => get("/training/stats");
export const toggleTraining = () => post("/training/toggle", {});
export const resetWeights = () => post('/training/reset', {});
