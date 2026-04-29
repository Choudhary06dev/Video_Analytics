import { get, post } from './api';

export const fetchTrainingStats = () => get("/training/stats");
export const toggleTraining = () => post("/training/toggle", {});
export const resetWeights = async () => {
    const response = await post('/training/reset');
    return response.data;
};
