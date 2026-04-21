import { get, post, put, del } from './api';

// Admin Areas
export const fetchAdminAreas = () => get("/admin/areas");
export const createArea = (areaData) => post("/admin/areas", areaData);
export const updateArea = (areaId, areaData) => put(`/admin/areas/${areaId}`, areaData);
export const deleteArea = (areaId) => del(`/admin/areas/${areaId}`);

// Admin Cameras
export const fetchAdminCameras = () => get("/admin/cameras");
export const createCamera = (cameraData) => post("/admin/cameras", cameraData);
export const updateCamera = (cameraId, cameraData) => put(`/admin/cameras/${cameraId}`, cameraData);
export const deleteCamera = (cameraId) => del(`/admin/cameras/${cameraId}`);

// Intelligence & Feeds
export const fetchIntelligence = (cameraId) => get("/intelligence", { camera_id: cameraId });
export const toggleScenario = (cameraId, scenarioId, isEnabled) => 
    post(`/admin/cameras/${cameraId}/scenarios`, { scenario_id: scenarioId, is_enabled: isEnabled });

export const getStreamUrl = (cameraId) => {
    const { BASE } = require('./api');
    return `${BASE}/video_feed/${cameraId}`;
};
