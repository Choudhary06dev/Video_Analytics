import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { canView } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  if (!canView('admin_hub')) {
    return <Navigate to="/" replace />;
  }

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
    <div className="h-screen bg-bg text-text-dark font-sans overflow-hidden selection:bg-accent/30 flex">
      
      {/* Sidebar Overlay (Mobile) - shown when sidebar IS open on mobile */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Admin Sidebar */}
      <AdminSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        
        {/* Synchronized Header */}
        <Header 
          isSidebarOpen={isSidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-bg flex flex-col">
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>

          {/* Synchronized Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
