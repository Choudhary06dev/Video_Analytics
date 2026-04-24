import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_CONFIG } from '../../config';
import {
  LayoutDashboard,
  Radio,
  Brain,
  Users,
  ClipboardList,
  Cpu,
  Bell,
  LogOut,
  BrainCircuit,
  GraduationCap,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isSidebarOpen }) {
  const { role, canView } = useAuth();
  
  const mainMenu = [
    { name: 'Command Hub', icon: LayoutDashboard, path: '/', moduleKey: 'dashboard' },
    { name: 'Neural Stream', icon: Radio, path: '/neural-stream', moduleKey: 'live_monitoring' },
    { name: 'AI Scenarios', icon: Brain, path: '/scenarios', moduleKey: 'scenarios' },
    { name: 'Staff Roster', icon: Users, path: '/roster', moduleKey: 'roster' },
    { name: 'Activity Vault', icon: ClipboardList, path: '/vault', moduleKey: 'vault' },
  ];

  const analyticsMenu = [
    { name: 'System Health', icon: Cpu, path: '/health', moduleKey: 'health' },
    { name: 'AI Training', icon: GraduationCap, path: '/training' },
    { name: 'Crisis Alerts', icon: Bell, path: '/alerts', moduleKey: 'alerts' },
  ];

  const adminMenu = [
    { name: 'Admin Control', icon: ShieldAlert, path: '/admin', reqRole: 'admin_level', moduleKey: 'admin_hub' }
  ];

  const renderNavLinks = (items) => (
    <ul className="flex flex-col gap-1">
      {items
        .filter(item => !item.reqRole || (item.reqRole === 'admin_level' && (role === 'super_admin' || role === 'admin')))
        .filter(item => canView(item.moduleKey))
        .map((item, index) => (
        <li key={index}>
          <NavLink
            to={item.path}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group backdrop-blur-sm
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
      className={`${isSidebarOpen ? 'w-[240px] translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'} 
      transition-all duration-200 ease-in-out fixed md:relative z-50 h-full bg-card border-r border-border flex flex-col pt-5 px-5 pb-9 overflow-hidden`}
    >
      <div className="flex items-center gap-3 font-extrabold text-accent mb-6 shrink-0 h-10">
        <BrainCircuit className="w-9 h-9 shrink-0" />
        <span className={`transition-all duration-200 leading-tight text-[1.1rem] ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100 md:scale-0'}`}>
          {APP_CONFIG.PROJECT_NAME.replace(/^Video\s+/i, '')}
        </span>
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

        {(role === 'super_admin' || role === 'admin') && (
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
