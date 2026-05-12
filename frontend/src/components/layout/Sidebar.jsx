import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_CONFIG } from '../../config';
import Logo from '../ui/Logo';
import {
  LayoutDashboard,
  Radio,
  Brain,
  Users,
  ClipboardList,
  Cpu,
  Bell,
  LogOut,
  GraduationCap,
  ShieldAlert,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isSidebarOpen, setSidebarOpen }) {
  const { canView } = useAuth();

  const mainMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', moduleKey: 'dashboard' },
    { name: 'Neural Stream', icon: Radio, path: '/neural-stream', moduleKey: 'live_monitoring' },
    { name: 'AI Scenarios', icon: Brain, path: '/scenarios', moduleKey: 'scenarios' },

    { name: 'Activity Vault', icon: ClipboardList, path: '/vault', moduleKey: 'vault' },
  ];

  const analyticsMenu = [
    { name: 'System Health', icon: Cpu, path: '/health', moduleKey: 'health' },
    { name: 'Crisis Alerts', icon: Bell, path: '/alerts', moduleKey: 'alerts' },
  ];

  const adminMenu = [
    { name: 'Admin Control', icon: ShieldAlert, path: '/admin', moduleKey: 'admin_hub' }
  ];

  const handleNavClick = () => {
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 768 && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const renderNavLinks = (items) => (
    <ul className="flex flex-col gap-1">
      {items
        .filter(item => canView(item.moduleKey))
        .map((item, index) => (
          <li key={index}>
            <NavLink
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg cursor-pointer transition-all duration-200 group backdrop-blur-sm
              ${isActive
                  ? 'bg-accent-soft/70 text-accent font-bold shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                  : 'text-text-dark font-semibold hover:bg-accent-soft/40 hover:text-accent'

                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-4.5 h-4.5 shrink-0 ${item.name === 'Admin Hub' ? 'text-danger' : ''}`} />
                  <span className={`text-[0.82rem] transition-all duration-300 ${!isSidebarOpen && 'md:hidden'} ${item.name === 'Admin Hub' ? 'text-danger font-black tracking-widest uppercase text-[9px]' : ''}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
    </ul>
  );

  return (
    <aside
      className={`${isSidebarOpen ? 'w-[260px] sm:w-[240px] translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'} 
      transition-all duration-300 ease-in-out fixed md:relative z-50 h-full bg-card border-r border-border flex flex-col pt-5 px-4 sm:px-5 pb-9 overflow-hidden
      ${isSidebarOpen ? 'shadow-2xl md:shadow-none' : ''}`}
    >
      {/* Mobile close button */}
      {isSidebarOpen && setSidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg text-text-gray hover:text-text-dark hover:bg-surface transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="mb-6 shrink-0 h-10">
        <Logo isSidebarOpen={isSidebarOpen} className="h-10 w-10" />
      </div>

      <nav className="flex-1 overflow-y-auto w-full scrollbar-none flex flex-col gap-6">
        <div>
          <div className={`text-[0.65rem] text-text-gray font-extrabold uppercase tracking-[1.5px] mb-2 px-2.5 ${!isSidebarOpen && 'md:hidden'}`}>
            Main Matrix
          </div>
          {renderNavLinks(mainMenu)}
        </div>

        <div>
          <div className={`text-[0.65rem] text-text-gray font-extrabold uppercase tracking-[1.5px] mb-2 px-2.5 ${!isSidebarOpen && 'md:hidden'}`}>
            Analytics Hub
          </div>
          {renderNavLinks(analyticsMenu)}
        </div>

        {canView('admin_hub') && (
          <div className="mt-4 border-t border-danger/10 pt-4">
            <div className={`text-[0.65rem] text-danger/80 font-black uppercase tracking-[2px] mb-2 px-2.5 flex items-center gap-2 ${!isSidebarOpen && 'md:hidden'}`}>
              <div className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse"></div>
              Restricted System
            </div>
            {renderNavLinks(adminMenu)}
          </div>
        )}
      </nav>
    </aside>
  );
}
