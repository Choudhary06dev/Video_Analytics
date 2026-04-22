import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  ShieldCheck, 
  History, 
  Settings as SettingsIcon,
  ChevronLeft,
  Terminal,
  BrainCircuit,
  Map,
  Video
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../config';

export default function AdminSidebar({ isSidebarOpen }) {
  const { user, canView } = useAuth();
  const navigate = useNavigate();

  const adminMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', moduleKey: 'dashboard' },
    { name: 'Users', icon: UsersIcon, path: '/admin/users', moduleKey: 'roster' },
    { name: 'Roles', icon: ShieldCheck, path: '/admin/roles', moduleKey: 'admin_hub' },
    { name: 'Areas', icon: Map, path: '/admin/areas', moduleKey: 'admin_hub' },
    { name: 'Cameras', icon: Video, path: '/admin/surveillance', moduleKey: 'admin_hub' },
    { name: 'Audit Logs', icon: History, path: '/admin/audit', moduleKey: 'admin_hub' },
    { name: 'Settings', icon: SettingsIcon, path: '/admin/settings', moduleKey: 'settings' },
  ];

  const handleExitAdmin = () => {
    navigate('/');
  };

  const renderNavLinks = (items) => (
    <ul className="flex flex-col gap-1">
      {items.filter(item => canView(item.moduleKey)).map((item, index) => (
        <li key={index}>
          <NavLink
            to={item.path}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group backdrop-blur-sm
              ${isActive
                ? 'bg-accent-soft/70 text-accent font-bold shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-accent/20'
                : 'text-text-gray font-semibold hover:bg-accent-soft/40 hover:text-accent border border-transparent'
              }`
            }
          >
            <item.icon className="w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className={`text-[0.82rem] transition-all duration-300 ${!isSidebarOpen && 'md:hidden'}`}>
              {item.name}
            </span>
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`${isSidebarOpen ? 'w-[240px] translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'} 
      transition-all duration-200 ease-in-out fixed md:relative z-50 h-full bg-card border-r border-border flex flex-col pt-5 px-5 pb-9 overflow-hidden shadow-[10px_0_40px_rgba(0,0,0,0.4)]`}
    >
      {/* Admin Branding */}
      <div className="flex items-center gap-3 font-extrabold text-accent mb-6 shrink-0 h-10">
        <div className="relative">
            <BrainCircuit className="w-9 h-9 shrink-0" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full border-2 border-card flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
            </div>
        </div>
        <div className={`transition-all duration-200 flex flex-col ${!isSidebarOpen && 'opacity-0 scale-0'}`}>
          <span className="text-[1rem] font-black italic uppercase tracking-tighter text-text-dark leading-tight">
            Matrix <span className="text-accent underline decoration-accent/30 underline-offset-4">Admin</span>
          </span>
          <span className="text-[8px] font-black text-accent/60 uppercase tracking-[0.2em] leading-none">Security Root</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto w-full scrollbar-none flex flex-col gap-6">
        <div>
          <div className={`text-[0.65rem] text-text-gray font-extrabold uppercase tracking-[1.5px] mb-2 px-2.5 ${!isSidebarOpen && 'md:hidden'}`}>
            Admin Controls
          </div>
          {renderNavLinks(adminMenu)}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-border/50">
        <button 
          onClick={handleExitAdmin}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className={`text-[0.75rem] font-black uppercase tracking-widest ${!isSidebarOpen && 'md:hidden'}`}>
            Exit Control
          </span>
        </button>

        <div className={`p-3 bg-surface rounded-lg border border-border flex items-center gap-3 ${!isSidebarOpen && 'md:px-2 flex-col'}`}>
            <div className="relative">
                <img 
                    src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=06b6d4&color=fff&bold=true`} 
                    alt="User" 
                    className="w-8 h-8 rounded-lg shadow-sm ring-2 ring-white/5" 
                />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface"></div>
            </div>
            <div className={`overflow-hidden transition-all duration-200 ${!isSidebarOpen && 'h-0 opacity-0'}`}>
                <p className="text-[11px] font-black text-text-dark truncate leading-tight">{user?.name || 'Administrator'}</p>
                <p className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none mt-1">{user?.role?.replace('_', ' ') || 'ROOT'}</p>
            </div>
        </div>
      </div>
    </aside>
  );
}
