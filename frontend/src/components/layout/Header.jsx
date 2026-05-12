import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, ChevronDown, Sun, Moon, Shield,
  LayoutDashboard, Radio, Brain, Users, ClipboardList,
  Cpu, GraduationCap, Settings, X, ArrowRight
} from 'lucide-react';
import { APP_CONFIG } from '../../config';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const STATIC_PAGES = [
  { name: 'Dashboard', category: 'Pages', path: '/', icon: LayoutDashboard },
  { name: 'Neural Stream', category: 'Pages', path: '/neural-stream', icon: Radio },
  { name: 'AI Scenarios', category: 'Pages', path: '/scenarios', icon: Brain },
  { name: 'Activity Vault', category: 'Pages', path: '/vault', icon: ClipboardList },
  { name: 'System Health', category: 'Pages', path: '/health', icon: Cpu },
  { name: 'AI Training', category: 'Pages', path: '/training', icon: GraduationCap },
  { name: 'Crisis Alerts', category: 'Pages', path: '/alerts', icon: Bell },
  { name: 'Global Settings', category: 'Pages', path: '/settings', icon: Settings },
];

export default function Header({ isSidebarOpen, setSidebarOpen }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchIndex, setSearchIndex] = useState(STATIC_PAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const notificationRef = useRef(null);

  // Fetch dynamic data for search index
  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        const cameraService = await import('../../services/cameraService');
        const [cameras, scenarios] = await Promise.all([
          cameraService.fetchLiveCameras().catch(() => []),
          cameraService.fetchLiveScenarios().catch(() => [])
        ]);

        const cameraItems = (Array.isArray(cameras) ? cameras : []).map(cam => ({
          name: cam.name,
          category: 'Cameras',
          path: `/neural-stream?camera_id=${cam.id}`,
          icon: Radio
        }));

        const scenarioItems = (Array.isArray(scenarios) ? scenarios : []).map(s => ({
          name: s.name,
          category: 'AI Scenarios',
          path: `/scenarios?scenario_id=${s.id}`,
          icon: Brain
        }));

        setSearchIndex([...STATIC_PAGES, ...cameraItems, ...scenarioItems]);
      } catch (err) {
        console.error("Critical: Failed to build dynamic search index", err);
      }
    };

    loadDynamicData();
  }, []);

  // Fetch recent notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const alertService = await import('../../services/alertService');
        const alerts = await alertService.fetchAlerts({ hours: 24, limit: 5 });
        if (Array.isArray(alerts)) {
          setNotifications(alerts.slice(0, 5));
          setUnreadCount(alerts.filter(a => !a.is_read).length);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length > 0) {
      const filtered = searchIndex.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const categoryMatch = item.category.toLowerCase().includes(query);
        // Handle singular/plural common cases like "camera" matching "Cameras"
        const typeMatch = (query === 'camera' && item.category === 'Cameras') ||
          (query === 'scenario' && item.category === 'AI Scenarios');

        return nameMatch || categoryMatch || typeMatch;
      }).slice(0, 10);

      setResults(filtered);
      setShowResults(true);
      setActiveIndex(-1);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [searchQuery, searchIndex]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setShowMobileSearch(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
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
      setShowMobileSearch(false);
    }
  };

  const handleSelect = (item) => {
    navigate(item.path);
    setSearchQuery('');
    setShowResults(false);
    setShowMobileSearch(false);
  };

  return (
    <>
      <header className="h-14 sm:h-16 shrink-0 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-3 sm:px-4 md:px-8 z-30 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-1 rounded-lg text-text-gray hover:bg-surface transition-colors focus:outline-none shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-xl font-semibold text-text-dark hidden sm:block truncate">
            {APP_CONFIG.PROJECT_NAME}
            <span className="text-xs ml-2 px-2 py-1 rounded-md bg-accent-soft text-accent border border-accent/20 align-middle font-bold hidden md:inline">
              PRO
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
          {/* Desktop Search Bar */}
          <div className="relative hidden md:block w-56 lg:w-72 group" ref={searchRef}>
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

          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden p-2 rounded-full text-text-gray hover:bg-surface transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

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

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setUnreadCount(0); // Clear badge on open
              }}
              className={`relative p-2 rounded-full text-text-gray hover:bg-surface transition-colors ${showNotifications ? 'bg-accent-soft text-accent' : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-card shadow-sm animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-premium overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-border bg-surface/30 flex justify-between items-center">
                  <div className="text-xs font-black text-text-dark uppercase tracking-[0.1em]">Recent Intelligence</div>
                  <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">Live</span>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((alert, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          navigate(`/alerts?alert_id=${alert.id}`);
                          setShowNotifications(false);
                        }}
                        className="w-full p-4 border-b border-border/50 hover:bg-surface transition-all text-left flex gap-3 group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/50 shadow-inner group-hover:scale-110 transition-transform ${alert.severity === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
                          <Brain className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${alert.severity === 'Critical' ? 'text-danger' : 'text-accent'}`}>{alert.severity}</span>
                            <span className="text-[8px] font-bold text-text-gray">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[11px] font-bold text-text-dark leading-tight line-clamp-2">{alert.message || alert.scenario_key}</p>
                          <p className="text-[9px] font-medium text-text-gray/60 mt-1 uppercase">Camera {alert.camera_id} • {alert.area_name || 'Global'}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6 text-text-gray/30" />
                      </div>
                      <p className="text-xs font-bold text-text-gray italic">No active threats detected</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    navigate('/alerts');
                    setShowNotifications(false);
                  }}
                  className="w-full p-3 text-[10px] font-black text-accent uppercase tracking-widest hover:bg-accent hover:text-white transition-all bg-accent/5 flex items-center justify-center gap-2"
                >
                  View Activity Vault <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-1.5 sm:gap-2 p-1 sm:pr-3 rounded-full border transition-all ${showProfileMenu ? 'bg-accent-soft border-accent/20' : 'border-border hover:bg-surface'}`}
            >
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=06b6d4&color=fff&bold=true`} alt="User" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm ring-2 ring-white/5" />
              <div className="hidden lg:flex flex-col items-start -space-y-1">
                <span className="text-[11px] font-black text-text-dark uppercase tracking-tight">{user?.name || 'Operator'}</span>
                <span className="text-[9px] font-bold text-text-gray uppercase tracking-widest opacity-60">
                  {user?.role ? user.role.replace('_', ' ') : 'Standard'} Access
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-text-gray transition-transform duration-300 hidden sm:block ${showProfileMenu ? 'rotate-180 text-accent' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-premium overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-border bg-surface/30">
                  <div className="text-xs font-black text-text-dark uppercase tracking-wider mb-0.5">{user?.name}</div>
                  <div className="text-[10px] text-text-gray font-medium truncate">{user?.email}</div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface text-text-gray transition-all"
                  >
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

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-0 z-[70] bg-bg/95 backdrop-blur-md flex flex-col" ref={mobileSearchRef}>
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <button
              onClick={() => { setShowMobileSearch(false); setSearchQuery(''); }}
              className="p-2 rounded-lg text-text-gray hover:bg-surface"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
              <input
                type="text"
                placeholder="Search cameras, events, pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full bg-surface border border-border focus:border-accent text-sm text-text-dark rounded-full pl-10 pr-10 py-3 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {results.length > 0 ? (
              <div className="flex flex-col gap-1">
                {results.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(item)}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-card text-left w-full transition-all border border-transparent hover:border-border"
                  >
                    <div className="p-2.5 rounded-lg bg-surface text-text-gray">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-text-dark truncate">{item.name}</div>
                      <div className="text-[0.65rem] font-black uppercase tracking-wider text-text-gray opacity-60">{item.category}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-gray/40" />
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="py-16 text-center">
                <Search className="w-8 h-8 text-text-gray/30 mx-auto mb-3" />
                <div className="text-sm font-bold text-text-dark">No results found</div>
                <div className="text-xs text-text-gray mt-1">Try different keywords</div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <Search className="w-8 h-8 text-text-gray/20 mx-auto mb-3" />
                <div className="text-xs text-text-gray font-bold uppercase tracking-widest">Start typing to search</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
