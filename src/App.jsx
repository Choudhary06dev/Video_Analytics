import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AppLayout from './layouts/AppLayout';

// Pages
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* App Layout wraps all pages */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          {/* Future pages go here */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
