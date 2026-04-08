import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AppLayout from './layouts/AppLayout';

// Pages
import Dashboard from './pages/Dashboard';
import NeuralStream from './pages/NeuralStream';
import AIScenarios from './pages/AIScenarios';
import StaffRoster from './pages/StaffRoster';
import ActivityVault from './pages/ActivityVault';
import SystemHealth from './pages/SystemHealth';
import AITraining from './pages/AITraining';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* App Layout wraps all pages */}
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
