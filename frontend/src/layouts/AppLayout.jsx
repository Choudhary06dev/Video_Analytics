import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// Layout Components
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  // Auto-close sidebar on mobile, auto-open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-bg text-text-dark font-sans overflow-hidden">
      
      {/* Sidebar Overlay (Mobile) - shown when sidebar IS open on mobile */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        
        {/* Top Header */}
        <Header 
          isSidebarOpen={isSidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />

        {/* Scrollable Main Content Wrapper */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-bg flex flex-col">
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
            
            {/* The current route's page will render here */}
            <Outlet />

          </main>
          
          {/* Global Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
