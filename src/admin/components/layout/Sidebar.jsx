import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Activity, 
  ShieldAlert, 
  Settings, 
  User, 
  Camera 
} from 'lucide-react';

export default function Sidebar({ isSidebarOpen }) {
  return (
    <aside 
      className={`${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'} 
      transition-all duration-300 ease-in-out fixed md:relative z-50 h-full bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
    >
      <div className="h-16 flex items-center justify-center border-b border-slate-100 px-4 shrink-0">
        <div className={`flex items-center gap-3 text-indigo-700 font-bold transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100 md:scale-0'}`}>
          <Camera className="w-7 h-7" />
          <span className="text-lg tracking-tight truncate">Vision AI</span>
        </div>
        {!isSidebarOpen && <Camera className="hidden md:block w-7 h-7 text-indigo-700 absolute" />}
      </div>
      
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {[
          { name: 'Dashboard', icon: LayoutDashboard, active: true },
          { name: 'Live Feeds', icon: Video },
          { name: 'AI Scenarios', icon: Activity },
          { name: 'Alerts', icon: ShieldAlert },
          { name: 'Settings', icon: Settings },
        ].map((item, index) => (
          <a
            key={index}
            href="#"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
              ${item.active 
                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}
          >
            <item.icon className={`w-5 h-5 ${item.active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
            <span className={`whitespace-nowrap transition-all duration-300 ${!isSidebarOpen && 'md:hidden'}`}>
              {item.name}
            </span>
          </a>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className={`flex items-center gap-3 ${!isSidebarOpen && 'md:justify-center'}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center text-white shrink-0 shadow-md">
            <User className="w-5 h-5" />
          </div>
          <div className={`transition-all duration-300 ${!isSidebarOpen && 'md:hidden'}`}>
            <p className="text-sm font-semibold text-slate-800">Admin User</p>
            <p className="text-xs text-slate-500">System Operator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
