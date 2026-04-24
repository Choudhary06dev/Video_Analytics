import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Layout
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

// Components
import ProtectedRoute from './components/ui/ProtectedRoute';

// Pages - Auth
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Signup';

// Pages - Main
import Dashboard from './pages/Dashboard';
import NeuralStream from './pages/NeuralStream';
import AIScenarios from './pages/AIScenarios';
import StaffRoster from './pages/StaffRoster';
import ActivityVault from './pages/ActivityVault';
import SystemHealth from './pages/SystemHealth';
import AITraining from './pages/AITraining';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

// Sub Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import ActionAudit from './pages/admin/ActionAudit';
import SystemSettings from './pages/admin/SystemSettings';
import SurveillanceConfig from './pages/admin/SurveillanceConfig';

import AreaManagement from './pages/admin/AreaManagement';
import ScenarioOrchestration from './pages/admin/ScenarioOrchestration';
import AIScenarioRegistry from './pages/admin/AIScenarioRegistry';



function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Private Protected Routes (Operator/User Side) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/neural-stream" element={<NeuralStream />} />
                <Route path="/scenarios" element={<AIScenarios />} />
                <Route path="/roster" element={<StaffRoster />} />
                <Route path="/vault" element={<ActivityVault />} />
                <Route path="/health" element={<SystemHealth />} />
                <Route path="/training" element={<AITraining />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Dedicated Admin Panel (Laravel-style) */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="roles" element={<RoleManagement />} />
                <Route path="areas" element={<AreaManagement />} />
                <Route path="audit" element={<ActionAudit />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="surveillance" element={<SurveillanceConfig />} />
                <Route path="scenarios" element={<ScenarioOrchestration />} />
                <Route path="scenario-registry" element={<AIScenarioRegistry />} />


              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
