import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

// Import CSS


// Layout Components
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-bg text-text-dark font-sans overflow-hidden">
      
      {/* Sidebar Overlay (Mobile) */}
      {!isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-text-dark/20 z-40" 
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
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-bg flex flex-col">
          <main className="flex-1 p-4 sm:p-8">
            
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
