import React, { useEffect, useState, useCallback } from 'react';
import {
  Lock, AlertTriangle, Crosshair, Users, UserX, UserPlus, UserCheck,
  User, Phone, Flame, Car, Truck, Video, Baby, Ban, Building, Mountain,
  Activity, Package, ShieldAlert, RefreshCw, Filter,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const SCENARIOS = [
  { id: 1, name: 'Unauthorized Entry', icon: Lock, cat: 'security', image: 'https://images.unsplash.com/photo-1557597774-9d2739f85a76?auto=format&fit=crop&q=80&w=800' },
  { id: 2, name: 'Aggressive Behaviour', icon: AlertTriangle, cat: 'threat', image: 'https://images.unsplash.com/photo-1543269664-76bc3997d9ea?auto=format&fit=crop&q=80&w=400' },
  { id: 3, name: 'Weapon Detection', icon: Crosshair, cat: 'threat', image: 'https://images.unsplash.com/photo-1588612143093-57519968412e?auto=format&fit=crop&q=80&w=800' },
  { id: 4, name: 'Multiple Persons / Access', icon: Users, cat: 'security', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400' },
  { id: 5, name: 'Blacklisted Person', icon: UserX, cat: 'threat', image: 'https://images.unsplash.com/photo-1561069934-eee225952461?auto=format&fit=crop&q=80&w=400' },
  { id: 6, name: 'Crowd Overcrowding', icon: Users, cat: 'crowd', image: 'https://images.unsplash.com/photo-1496160655511-2f93bad7281f?auto=format&fit=crop&q=80&w=400' },
  { id: 7, name: 'Visitor Count Exceeded', icon: UserPlus, cat: 'crowd', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400' },
  { id: 8, name: 'Entry/Exit Tracking', icon: UserCheck, cat: 'access', image: 'https://images.unsplash.com/photo-1519494140268-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400' },
  { id: 9, name: 'Staff Absence at Post', icon: User, cat: 'access', image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=400' },
  { id: 10, name: 'Mobile Phone – Restricted', icon: Phone, cat: 'security', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400' },
  { id: 11, name: 'Fire / Smoke Detection', icon: Flame, cat: 'threat', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400' },
  { id: 12, name: 'Vehicle Observation', icon: Car, cat: 'access', image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=400' },
  { id: 13, name: 'Unauthorized Parking', icon: Truck, cat: 'access', image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=400' },
  { id: 14, name: 'Camera Recording Failure', icon: Video, cat: 'system', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400' },
  { id: 15, name: 'Motion Outside Routes', icon: Baby, cat: 'security', image: 'https://images.unsplash.com/photo-1537673156264-42ad05128080?auto=format&fit=crop&q=80&w=400' },
  { id: 16, name: 'Unauthorized Handling', icon: Ban, cat: 'threat', image: 'https://images.unsplash.com/photo-1526434426615-1abe81efcb0b?auto=format&fit=crop&q=80&w=400' },
  { id: 17, name: 'Object Left Unattended', icon: Package, cat: 'security', image: 'https://images.unsplash.com/photo-1577733966973-d680babb2da1?auto=format&fit=crop&q=80&w=400' },
  { id: 18, name: 'Movement – Closed Area', icon: Building, cat: 'security', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400' },
  { id: 19, name: 'Boundary Crossing', icon: Mountain, cat: 'threat', image: 'https://images.unsplash.com/photo-1510074377623-8cf13fb86c08?auto=format&fit=crop&q=80&w=400' },
  { id: 20, name: 'Grouped Activity', icon: Users, cat: 'crowd', image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=400' },
  { id: 21, name: 'Safety Violation', icon: ShieldAlert, cat: 'threat', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=400' },
];

const STATUS_CFG = {
  critical: {
    label: 'CRIT',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    glow: '0 0 16px rgba(239,68,68,0.4)',
    ring: '#ef4444',
  },
  warning: {
    label: 'WARN',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
    glow: '0 0 14px rgba(245,158,11,0.35)',
    ring: '#f59e0b',
  },
  normal: {
    label: 'OK',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.09)',
    border: 'rgba(34,197,94,0.2)',
    glow: 'none',
    ring: '#22c55e',
  },
};

const CAT_COLORS = {
  security: '#0ea5e9',
  threat: '#ef4444',
  crowd: '#f59e0b',
  access: '#22c55e',
  system: '#8b5cf6',
};

// Specific images are now part of the SCENARIOS array definition

function randStatus() {
  const r = Math.random();
  if (r > 0.9) return 'critical';
  if (r > 0.7) return 'warning';
  return 'normal';
}

function ScenarioCard({ s, onSelect }) {
  const cfg = STATUS_CFG[s.status];
  const catColor = CAT_COLORS[s.cat] || '#94a3b8';
  const [hovered, setHovered] = useState(false);
  const { isDark } = useTheme();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(s)}
      style={{
        background: isDark ? '#111827' : '#fff',
        borderRadius: 18,
        border: `1.5px solid ${hovered ? catColor + '50' : (isDark ? '#1e293b' : '#f1f5f9')}`,
        boxShadow: hovered
          ? `0 16px 40px -10px ${catColor}30, ${s.status === 'critical' ? cfg.glow : 'none'}`
          : s.status === 'critical'
            ? cfg.glow
            : '0 2px 10px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Image banner */}
      <div style={{ height: 80, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: `linear-gradient(to top, ${isDark ? '#111827' : '#fff'} 0%, transparent 60%)`,
        }} />
        <img
          src={s.image} alt={s.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: 0.55,
            transform: hovered ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.6s ease',
          }}
        />
        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 2,
          background: catColor + '22', border: `1px solid ${catColor}40`,
          color: catColor, fontSize: 9, fontWeight: 900,
          padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.8,
        }}>
          {s.cat}
        </div>
      </div>

      <div style={{ padding: '0 14px 14px', position: 'relative', zIndex: 2 }}>
        {/* Icon row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: -22, marginBottom: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: isDark ? '#111827' : '#fff',
            border: `2.5px solid ${cfg.ring}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${cfg.ring}40`,
            transition: 'transform 0.3s ease',
            transform: hovered ? 'rotate(10deg)' : 'rotate(0deg)',
          }}>
            <s.icon style={{ width: 20, height: 20, color: catColor }} />
          </div>
          {/* Status badge removed */}
        </div>

        {/* Name */}
        <div style={{
          fontSize: 12, fontWeight: 800, color: hovered ? catColor : (isDark ? '#f1f5f9' : '#1e293b'),
          marginBottom: 10, lineHeight: 1.3, minHeight: 32,
          transition: 'color 0.3s ease',
        }}>
          {s.name}
        </div>

        {/* Stats */}
        <div style={{
          background: isDark ? '#1e293b' : '#f8fafc', borderRadius: 10, padding: '8px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{s.count}</span>
            <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>today</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>
            <Activity style={{ width: 11, height: 11, color: cfg.color }} />
            Live
          </div>
        </div>
      </div>

      {/* Bottom color line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${catColor}80, ${catColor})`,
        transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform 0.4s ease',
        borderRadius: '0 0 18px 18px',
      }} />
    </div>
  );
}

const FILTERS = ['all', 'critical', 'warning', 'security', 'threat', 'crowd'];

export default function AIScenarioGrid() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const build = useCallback(() =>
    SCENARIOS.map((s) => ({
      ...s,
      status: randStatus(),
      count: Math.floor(Math.random() * 50),
    })),
    []
  );

  useEffect(() => { setData(build()); }, [build]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setData(build()); setRefreshing(false); }, 600);
  };

  const visible = data
    .filter(s => {
      if (filter === 'all') return true;
      if (filter === 'critical' || filter === 'warning') return s.status === filter;
      return s.cat === filter;
    })
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const criticalCount = data.filter(s => s.status === 'critical').length;

  return (
    <div
      className="bg-card rounded-[28px] border border-border shadow-premium p-7 mt-8"
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h3 className="text-[1.1rem] font-black text-text-dark flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-sky-500" />
            Video Analytics Scenarios
          </h3>
          <p className="text-[0.7rem] text-text-gray font-semibold mt-0.5">
            Monitoring <span className="text-sky-500 font-black">21</span> event categories
            {criticalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded-full text-[0.6rem] font-black animate-pulse">
                {criticalCount} CRITICAL
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search scenario…"
            style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '5px 12px', fontSize: 12, fontWeight: 600,
              color: '#475569', outline: 'none', width: 160,
            }}
          />
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-sky-50 text-sky-500 hover:bg-sky-500 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-black">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Monitoring {visible.length} / {data.length}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-text-gray self-center" />
        {FILTERS.map(f => {
          const active = filter === f;
          const count = f === 'all' ? data.length
            : f === 'critical' || f === 'warning' ? data.filter(s => s.status === f).length
              : data.filter(s => s.cat === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: active ? '#0ea5e9' : '#f8fafc',
                color: active ? '#fff' : '#64748b',
                border: `1px solid ${active ? '#0ea5e9' : '#e2e8f0'}`,
                fontWeight: active ? 800 : 600,
              }}
              className="text-[0.65rem] px-3 py-1 rounded-full cursor-pointer capitalize transition-all duration-200"
            >
              {f} <span style={{ opacity: 0.7 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map(s => (
          <ScenarioCard key={s.id} s={s} onSelect={setSelected} />
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeInBg 0.25s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 24, width: 380, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              animation: 'slideUpModal 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
              <img src={selected.image} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 16, color: '#fff' }}>
                <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Scenario #{selected.id}</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{selected.name}</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              {[
                { label: 'Status', value: STATUS_CFG[selected.status].label, color: STATUS_CFG[selected.status].color },
                { label: 'Category', value: selected.cat, color: CAT_COLORS[selected.cat] },
                { label: 'Events Today', value: selected.count, color: '#0ea5e9' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: row.color }}>{row.value}</span>
                </div>
              ))}
              <button
                onClick={() => setSelected(null)}
                style={{
                  marginTop: 16, width: '100%',
                  background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  padding: '10px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(14,165,233,0.35)',
                }}
                className="hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeInBg { from{opacity:0} to{opacity:1} }
            @keyframes slideUpModal { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
          `}</style>
        </div>
      )}
    </div>
  );
}
