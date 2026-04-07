import React, { useState } from 'react';

// Import Admin Specific CSS
import './admin.css';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Dashboard Components
import KPICards from './components/dashboard/KPICards';
import CameraGrid from './components/dashboard/CameraGrid';
import AnalyticsChart from './components/dashboard/AnalyticsChart';

export default function AdminDashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar Overlay (Mobile) */}
      {!isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-800/20 z-40" 
          onClick={() => setSidebarOpen(true)} 
        />
      )}

      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <Header 
          isSidebarOpen={isSidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />

        {/* Scrollable Main Content Wrapper */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 flex flex-col">
          <main className="flex-1 p-4 sm:p-8">
            
            {/* KPI Cards Section */}
            <KPICards />

            {/* Bottom Grid: Cameras & Charts */}
            <div className="grid lg:grid-cols-3 gap-8">
              <CameraGrid />
              <div className="lg:col-span-1 min-h-[350px]">
                <AnalyticsChart />
              </div>
            </div>

          </main>
          
          {/* Global Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
