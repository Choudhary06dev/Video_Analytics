import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, ChevronDown, Sun, Moon,
  LayoutDashboard, Radio, Brain, Users, ClipboardList,
  Cpu, GraduationCap, Settings, X, ArrowRight
} from 'lucide-react';
import { APP_CONFIG } from '../../config';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const SEARCH_INDEX = [
  // Pages
  { name: 'Command Hub', category: 'Pages', path: '/', icon: LayoutDashboard },
  { name: 'Neural Stream', category: 'Pages', path: '/neural-stream', icon: Radio },
  { name: 'AI Scenarios', category: 'Pages', path: '/scenarios', icon: Brain },

  { name: 'Activity Vault', category: 'Pages', path: '/vault', icon: ClipboardList },
  { name: 'System Health', category: 'Pages', path: '/health', icon: Cpu },
  { name: 'AI Training', category: 'Pages', path: '/training', icon: GraduationCap },
  { name: 'Crisis Alerts', category: 'Pages', path: '/alerts', icon: Bell },
  { name: 'Global Settings', category: 'Pages', path: '/settings', icon: Settings },

  // AI Scenarios (Top ones)
  { name: 'Unauthorized Entry', category: 'AI Models', path: '/scenarios', icon: Brain },
  { name: 'Weapon Detection', category: 'AI Models', path: '/scenarios', icon: Brain },
  { name: 'Fire / Smoke Detection', category: 'AI Models', path: '/scenarios', icon: Brain },
  { name: 'Crowd Density', category: 'AI Models', path: '/scenarios', icon: Brain },

  // Mock Technical Items
  { name: 'Main Gate Camera', category: 'Cameras', path: '/neural-stream', icon: Radio },
  { name: 'ICU Monitor 04', category: 'Cameras', path: '/neural-stream', icon: Radio },
  { name: 'Emergency Exit B', category: 'Cameras', path: '/neural-stream', icon: Radio },
];

export default function Header({ isSidebarOpen, setSidebarOpen }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = SEARCH_INDEX.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8);
      setResults(filtered);
      setShowResults(true);
      setActiveIndex(-1);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleKeyDown = (e) => {
    if (!showResults) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const handleSelect = (item) => {
    navigate(item.path);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <header className="h-16 shrink-0 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-8 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 rounded-lg text-text-gray hover:bg-surface transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-text-dark hidden sm:block truncate">
          {APP_CONFIG.PROJECT_NAME}
          <span className="text-xs ml-2 px-2 py-1 rounded-md bg-accent-soft text-accent border border-accent/20 align-middle font-bold">
            PRO
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Functional Search Bar */}
        <div className="relative hidden md:block w-72 group" ref={searchRef}>
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${showResults ? 'text-accent' : 'text-text-gray group-focus-within:text-accent'}`} />
            <input
              type="text"
              placeholder="Search cameras, events, pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
              className="w-full bg-surface border border-border focus:bg-card focus:border-accent focus:ring-4 focus:ring-accent/10 text-sm text-text-dark rounded-full pl-10 pr-10 py-2 outline-none transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray hover:text-text-dark p-1 rounded-full hover:bg-surface"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-premium overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2">
                {results.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {results.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left w-full
                          ${activeIndex === index ? 'bg-accent-soft text-accent' : 'hover:bg-surface text-text-gray'}`}
                      >
                        <div className={`p-2 rounded-lg ${activeIndex === index ? 'bg-accent text-white shadow-sm' : 'bg-surface text-text-gray'}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className={`text-sm font-bold truncate ${activeIndex === index ? 'text-accent' : 'text-text-dark'}`}>
                            {item.name}
                          </div>
                          <div className="text-[0.65rem] font-black uppercase tracking-wider opacity-60">
                            {item.category}
                          </div>
                        </div>
                        {activeIndex === index && (
                          <ArrowRight className="w-3.5 h-3.5 text-accent animate-in slide-in-from-left-2" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="inline-flex p-3 rounded-full bg-surface mb-3">
                      <Search className="w-6 h-6 text-text-gray" />
                    </div>
                    <div className="text-sm font-bold text-text-dark mb-1">No matching results</div>
                    <div className="text-xs text-text-gray">Try searching for "Alerts" or "Cameras"</div>
                  </div>
                )}
              </div>
              <div className="bg-surface/50 border-t border-border p-2 px-4 flex justify-between items-center text-[0.6rem] text-text-gray font-bold uppercase tracking-widest">
                <span>Select with Enter</span>
                <div className="flex gap-2">
                  <span className="px-1.5 py-0.5 rounded border border-border bg-card">↑↓</span>
                  <span className="px-1.5 py-0.5 rounded border border-border bg-card">ESC</span>
                </div>
              </div>
            </div>
          )}
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
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-danger rounded-full border-2 border-card shadow-sm"></span>
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center gap-2 p-1 pr-3 rounded-full border transition-all ${showProfileMenu ? 'bg-accent-soft border-accent/20' : 'border-border hover:bg-surface'}`}
          >
            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=06b6d4&color=fff&bold=true`} alt="User" className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white/5" />
            <div className="hidden lg:flex flex-col items-start -space-y-1">
              <span className="text-[11px] font-black text-text-dark uppercase tracking-tight">{user?.name || 'Operator'}</span>
              <span className="text-[9px] font-bold text-text-gray uppercase tracking-widest opacity-60">
                {user?.role ? user.role.replace('_', ' ') : 'Standard'} Access
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-text-gray transition-transform duration-300 ${showProfileMenu ? 'rotate-180 text-accent' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-premium overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-border bg-surface/30">
                <div className="text-xs font-black text-text-dark uppercase tracking-wider mb-0.5">{user?.name}</div>
                <div className="text-[10px] text-text-gray font-medium truncate">{user?.email}</div>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface text-text-gray transition-all">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-bold">Profile Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-danger/5 text-danger transition-all group"
                >
                  <div className="p-1.5 rounded-lg bg-danger/10 group-hover:bg-danger group-hover:text-white transition-all">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Terminate Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
