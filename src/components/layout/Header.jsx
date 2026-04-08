import React from 'react';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { APP_CONFIG } from '../../config';

export default function Header({ isSidebarOpen, setSidebarOpen }) {
  return (
    <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 hidden sm:block truncate">
          {APP_CONFIG.PROJECT_NAME} 
          <span className="text-xs ml-2 px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 align-middle">
            PRO
          </span>
        </h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="relative hidden md:block w-64 group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search cameras, events..." 
            className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 text-sm rounded-full pl-10 pr-4 py-2 outline-none transition-all duration-300"
          />
        </div>
        <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="flex items-center gap-1 p-1 pr-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors">
          <img src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff" alt="User" className="w-7 h-7 rounded-full" />
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
