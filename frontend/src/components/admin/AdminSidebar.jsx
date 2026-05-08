import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users as UsersIcon,
  ShieldCheck,
  History,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronDown,
  BrainCircuit,
  Map,
  Video,
  Zap,
  Activity,
  UserX as UserXIcon,
  X
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import Logo from '../ui/Logo';

export default function AdminSidebar({ isSidebarOpen, setSidebarOpen }) {
  const { user, canView } = useAuth();
  const { clusterSync } = useSystem();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState('management');

  const toggleMenu = (menuId) => {
    setOpenMenu(prev => prev === menuId ? null : menuId);
  };

  const handleNavClick = () => {
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 768 && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const adminMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', moduleKey: 'admin_dashboard' },
    {
      id: 'management',
      name: 'User Management',
      icon: UsersIcon,
      subItems: [
        { name: 'Users', icon: Activity, path: '/admin/users', moduleKey: 'users' },
        { name: 'Roles', icon: ShieldCheck, path: '/admin/roles', moduleKey: 'roles' },
      ]
    },
    {
      id: 'surveillance',
      name: 'Infrastructure',
      icon: Video,
      subItems: [
        { name: 'Cameras', icon: Video, path: '/admin/surveillance', moduleKey: 'cameras' },
        { name: 'Areas', icon: Map, path: '/admin/areas', moduleKey: 'areas' },
      ]
    },
    {
      id: 'ai',
      name: 'Intelligence',
      icon: BrainCircuit,
      subItems: [
        { name: 'AI Scenarios', icon: Zap, path: '/admin/scenario-registry', moduleKey: 'intelligence_registry' },
        { name: 'Scenario Control', icon: BrainCircuit, path: '/admin/scenarios', moduleKey: 'scenario_orchestration' },
        { name: 'Blacklist Registry', icon: UserXIcon, path: '/admin/blacklist', moduleKey: 'intelligence_registry' },
      ]
    },
    {
      id: 'analytics',
      name: 'Audit & Analysis',
      icon: History,
      subItems: [
        { name: 'Audit Protocols', icon: History, path: '/admin/audit', moduleKey: 'audit' },
      ]
    },
    { name: 'Settings', icon: SettingsIcon, path: '/admin/settings', moduleKey: 'settings' },
  ];

  const handleExitAdmin = () => {
    navigate('/');
  };

  const renderNavLinks = (items) => (
    <ul className="flex flex-col gap-1">
      {items.map((item, index) => {
        if (item.subItems) {
          const hasVisibleSubItem = item.subItems.some(sub => canView(sub.moduleKey));
          if (!hasVisibleSubItem) return null;

          const isOpen = openMenu === item.id;

          const isActiveParent = item.subItems.some(sub => location.pathname === sub.path);

          return (
            <li key={index} className="space-y-1">
              <button
                onClick={() => toggleMenu(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group
                            ${isActiveParent || isOpen ? 'bg-accent/5 text-text-dark font-bold' : 'text-text-dark font-semibold hover:bg-accent/5 hover:text-accent'}`}
              >


                <div className="flex items-center gap-3">
                  <item.icon className={`w-4.5 h-4.5 transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className={`text-[0.82rem] font-semibold transition-all duration-300 ${!isSidebarOpen && 'md:hidden'}`}>
                    {item.name}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${!isSidebarOpen && 'md:hidden'} ${isOpen ? 'rotate-180' : ''}`} />

              </button>

              {isOpen && isSidebarOpen && (
                <ul className="ml-4 pl-4 border-l-2 border-accent/10 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  {item.subItems.filter(sub => canView(sub.moduleKey)).map((sub, sIdx) => (
                    <li key={sIdx}>
                      <NavLink
                        to={sub.path}
                        onClick={handleNavClick}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg transition-all duration-200 group
                                            ${isActive
                            ? 'text-accent font-bold'
                            : 'text-text-dark font-semibold hover:text-accent'
                          }`
                        }
                      >

                        <sub.icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                        <span className="text-[0.78rem] tracking-tight">{sub.name}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        }

        if (!canView(item.moduleKey)) return null;

        return (
          <li key={index}>
            <NavLink
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 group backdrop-blur-sm
                  ${isActive
                  ? 'bg-accent-soft/70 text-accent font-bold shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-accent/20'
                  : 'text-text-dark font-semibold hover:bg-accent-soft/40 hover:text-accent border border-transparent'
                }`
              }

            >
              <item.icon className="w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className={`text-[0.82rem] font-semibold transition-all duration-300 ${!isSidebarOpen && 'md:hidden'}`}>
                {item.name}
              </span>
            </NavLink>

          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`${isSidebarOpen ? 'w-[260px] translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'} 
      transition-all duration-300 ease-in-out fixed md:relative z-50 h-full bg-card border-r border-border flex flex-col pt-4 px-4 pb-9 overflow-hidden shadow-premium
      ${isSidebarOpen ? 'shadow-2xl md:shadow-premium' : ''}`}
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

      {/* Admin Branding */}
      <div className="mb-2 shrink-0 h-12 px-2">
        <Logo isSidebarOpen={isSidebarOpen} className="h-12 w-12" />
      </div>

      {/* Divider Line */}
      <div className={`mx-2 mb-4 border-t border-border/50 ${!isSidebarOpen && 'opacity-0'}`}></div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto w-full scrollbar-none flex flex-col gap-6">
        <div>
          {renderNavLinks(adminMenu)}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="mt-6 flex flex-col gap-4 pt-6 border-t border-border/50">
        <button
          onClick={handleExitAdmin}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className={`text-[0.75rem] font-black uppercase tracking-widest ${!isSidebarOpen && 'md:hidden'}`}>
            Exit Control
          </span>
        </button>

        <div className={`p-3 bg-surface rounded-xl border border-border flex flex-col gap-3 ${!isSidebarOpen && 'md:px-2'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=06b6d4&color=fff&bold=true`}
                alt="User"
                className="w-9 h-9 rounded-xl shadow-sm ring-2 ring-white/5"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-surface"></div>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${!isSidebarOpen && 'h-0 opacity-0'}`}>
              <p className="text-[11px] font-black text-text-dark truncate leading-tight">{user?.name || 'Administrator'}</p>
              <p className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none mt-1.5">{user?.role?.replace('_', ' ') || 'ROOT'}</p>
            </div>
          </div>
          
          {/* Cluster Status Badge */}
          <div className={`pt-2 border-t border-border/50 flex items-center gap-2 ${!isSidebarOpen && 'hidden'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${clusterSync ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
            <span className="text-[8px] font-black text-text-gray uppercase tracking-[0.2em]">
              {clusterSync ? 'Cluster Synced' : 'Local Node Mode'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
