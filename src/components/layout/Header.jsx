import React from 'react';
import { Menu, Search, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import { APP_CONFIG } from '../../config';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ isSidebarOpen, setSidebarOpen }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 shrink-0 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-8 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 rounded-lg text-text-gray hover:bg-surface transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-text-dark hidden sm:block truncate">
          {APP_CONFIG.PROJECT_NAME} 
          <span className="text-xs ml-2 px-2 py-1 rounded-md bg-accent-soft text-accent border border-accent/20 align-middle">
            PRO
          </span>
        </h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="relative hidden md:block w-64 group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-gray group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search cameras, events..." 
            className="w-full bg-surface border border-border focus:bg-card focus:border-accent focus:ring-4 focus:ring-accent/10 text-sm text-text-dark rounded-full pl-10 pr-4 py-2 outline-none transition-all duration-300"
          />
        </div>

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2 rounded-full text-text-gray hover:bg-surface transition-all duration-300 group"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div className="relative w-5 h-5">
            <Sun className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100 text-warning'}`} />
            <Moon className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${isDark ? 'opacity-100 rotate-0 scale-100 text-accent' : 'opacity-0 -rotate-90 scale-0'}`} />
          </div>
        </button>

        <button className="relative p-2 rounded-full text-text-gray hover:bg-surface transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-danger rounded-full border-2 border-card"></span>
        </button>
        <button className="flex items-center gap-1 p-1 pr-2 rounded-full border border-border hover:bg-surface transition-colors">
          <img src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff" alt="User" className="w-7 h-7 rounded-full" />
          <ChevronDown className="w-4 h-4 text-text-gray" />
        </button>
      </div>
    </header>
  );
}
