import { get, post, put, del, patch } from './api';

export const fetchAdminUsers = () => get("/admin/users/");

export const createUser = (userData) => post("/admin/users", userData);

export const updateUser = (userId, userData) => put(`/admin/users/${userId}`, userData);

export const deleteUser = (userId) => del(`/admin/users/${userId}`);

export const updateUserStatus = (userId, isActive) => patch(`/admin/users/${userId}/status`, { is_active: isActive });

export const fetchAuditLogs = (limit = 50) => get("/admin/users/audit-logs", { limit });

export const fetchRoles = () => get("/admin/roles");
export const createRole = (roleData) => post("/admin/roles", roleData);
export const updateRole = (roleId, roleData) => put(`/admin/roles/${roleId}`, roleData);
export const fetchModules = () => get("/admin/roles/modules");
export const updateRolePermissions = (roleId, permissions) => put(`/admin/roles/${roleId}/permissions`, permissions);
