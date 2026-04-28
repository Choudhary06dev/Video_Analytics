import { get, post, put, del } from './api';

// Admin Areas
export const fetchAdminAreas = (skip = 0, limit = 20) => get("/admin/areas", { skip, limit });
export const createArea = (areaData) => post("/admin/areas", areaData);
export const updateArea = (areaId, areaData) => put(`/admin/areas/${areaId}`, areaData);
export const deleteArea = (areaId) => del(`/admin/areas/${areaId}`);

// Admin Cameras
export const fetchAdminCameras = (skip = 0, limit = 20) => get("/admin/cameras", { skip, limit });
export const createCamera = (cameraData) => post("/admin/cameras", cameraData);
export const updateCamera = (cameraId, cameraData) => put(`/admin/cameras/${cameraId}`, cameraData);
export const deleteCamera = (cameraId) => del(`/admin/cameras/${cameraId}`);

// Intelligence & Feeds
export const fetchCameraScenarios = (cameraId) => get(`/admin/cameras/${cameraId}/scenarios`);
export const syncCameraScenarios = (cameraId, scenarioIds) =>
    put(`/admin/cameras/${cameraId}/scenarios`, { enabled_scenario_ids: scenarioIds });


// AI Scenarios (Dynamic Module)
export const fetchScenarios = () => get("/admin/scenarios");
export const createScenario = (data) => post("/admin/scenarios", data);
export const updateScenario = (id, data) => put(`/admin/scenarios/${id}`, data);
export const deleteScenario = (id) => del(`/admin/scenarios/${id}`);

// Neural Stream read-only filters
export const fetchLiveAreas = () => get("/live/areas");
export const fetchLiveCameras = () => get("/live/cameras");
export const fetchLiveScenarios = () => get("/live/scenarios");

export const getStreamUrl = (cameraId) => {
    // Note: In production we'd use a stable config for BASE
    return `http://localhost:8000/video_feed/${cameraId}`;
};
