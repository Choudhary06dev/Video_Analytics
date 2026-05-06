import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AlertNotificationContainer } from './components/ui/AlertNotification';

// Layout
const AppLayout = lazy(() => import('./layouts/AppLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

// Components
const ProtectedRoute = lazy(() => import('./components/ui/ProtectedRoute'));

// Pages - Auth
const LoginPage = lazy(() => import('./pages/auth/Login'));
const RegisterPage = lazy(() => import('./pages/auth/Signup'));

// Pages - Main
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NeuralStream = lazy(() => import('./pages/NeuralStream'));
const AIScenarios = lazy(() => import('./pages/AIScenarios'));

const ActivityVault = lazy(() => import('./pages/ActivityVault'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));

// Sub Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const RoleManagement = lazy(() => import('./pages/admin/RoleManagement'));
const ActionAudit = lazy(() => import('./pages/admin/ActionAudit'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const SurveillanceConfig = lazy(() => import('./pages/admin/SurveillanceConfig'));

const AreaManagement = lazy(() => import('./pages/admin/AreaManagement'));
const ScenarioOrchestration = lazy(() => import('./pages/admin/ScenarioOrchestration'));
const AIScenarioRegistry = lazy(() => import('./pages/admin/AIScenarioRegistry'));
const BlacklistManagement = lazy(() => import('./pages/admin/BlacklistManagement'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AlertNotificationContainer />
            <Suspense fallback={
              <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-surface">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-gray animate-pulse">Initializing Neural Interface...</p>
              </div>
            }>
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

                    <Route path="/vault" element={<ActivityVault />} />
                    <Route path="/health" element={<SystemHealth />} />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Dedicated Admin Panel (Laravel-style) */}
                <Route path="/admin" element={<ProtectedRoute requiredModule="admin_hub" />}>
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
                    <Route path="blacklist" element={<BlacklistManagement />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

