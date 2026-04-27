import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { canView } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  if (!canView('admin_hub')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen bg-bg text-text-dark font-sans overflow-hidden selection:bg-accent/30 flex">
      
      {/* Sidebar Overlay (Mobile) */}
      {!isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" 
          onClick={() => setSidebarOpen(true)} 
        />
      )}

      {/* Admin Sidebar */}
      <AdminSidebar isSidebarOpen={isSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Synchronized Header */}
        <Header 
          isSidebarOpen={isSidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-bg flex flex-col">
          <main className="flex-1 p-4 sm:p-8">
            <Outlet />
          </main>

          {/* Synchronized Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
