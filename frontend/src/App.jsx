import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Layout
import AppLayout from './layouts/AppLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NeuralStream from './pages/NeuralStream';
import AIScenarios from './pages/AIScenarios';
import StaffRoster from './pages/StaffRoster';
import ActivityVault from './pages/ActivityVault';
import SystemHealth from './pages/SystemHealth';
import AITraining from './pages/AITraining';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import AdminHub from './pages/AdminHub';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Private Protected Routes */}
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

            {/* Admin Restricted Routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin-hub" element={<AdminHub />} />
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
