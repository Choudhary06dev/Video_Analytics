import React, { useState, useEffect, useRef } from 'react';
import { Video, Package, AlertCircle, Target, Zap, Cloud, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const frame = useRef(null);
  useEffect(() => {
    const numericTarget = parseFloat(target);
    if (isNaN(numericTarget)) { setCount(target); return; }
    let start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numericTarget));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return count;
}

const CARD_CONFIG = [
  {
    label: 'Active Feeds',
    rawValue: 6,
    total: '/6',
    icon: Video,
    accent: '#0ea5e9',
    glow: 'rgba(14,165,233,0.25)',
    trend: '+1 Recent',
    trendUp: true,
    unit: '',
  },
  {
    label: 'Objects Logged',
    rawValue: 342,
    icon: Package,
    accent: '#8b5cf6',
    glow: 'rgba(139,92,246,0.25)',
    trend: '+12% vs last hr',
    trendUp: true,
    unit: '',
  },
  {
    label: 'High Threats',
    rawValue: 2,
    icon: AlertCircle,
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.25)',
    trend: '-1 Resolved',
    trendUp: false,
    unit: '',
  },
  {
    label: 'Avg Precision',
    rawValue: 91,
    icon: Target,
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.25)',
    trend: '+0.4% Improvement',
    trendUp: true,
    unit: '%',
  },
  {
    label: 'Latency',
    rawValue: 48,
    icon: Zap,
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    trend: '-2ms Optimization',
    trendUp: true,
    unit: 'ms',
  },
  {
    label: 'Cloud Sync',
    rawValue: 99,
    icon: Cloud,
    accent: '#0ea5e9',
    glow: 'rgba(14,165,233,0.25)',
    trend: '99.9% Uptime',
    trendUp: true,
    unit: '%',
  },
];

function KPICard({ stat, index }) {
  const count = useCountUp(stat.rawValue, 1000 + index * 150);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 400);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        background: hovered
          ? `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)`
          : 'rgba(255,255,255,0.95)',
        borderColor: hovered ? stat.accent : 'rgba(226,232,240,0.8)',
        boxShadow: hovered
          ? `0 20px 60px -10px ${stat.glow}, 0 0 0 1px ${stat.accent}22`
          : '0 4px 20px -2px rgba(0,0,0,0.05)',
        transform: clicked ? 'scale(0.97)' : hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer',
      }}
      className="relative rounded-[22px] p-5 border overflow-hidden select-none backdrop-blur-sm"
    >
      {/* Animated corner glow */}
      <div
        style={{
          background: `radial-gradient(circle at top right, ${stat.accent}20 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Pulsing ring on hover */}
      {hovered && (
        <div
          style={{ borderColor: stat.accent, animationDuration: '1.2s' }}
          className="absolute -inset-px rounded-[22px] border-2 opacity-30 animate-ping pointer-events-none"
        />
      )}

      <div className="relative z-10 flex flex-col gap-3">
        {/* Top row: icon + trend */}
        <div className="flex justify-between items-start">
          <div
            style={{
              background: hovered ? stat.accent : `${stat.accent}18`,
              boxShadow: hovered ? `0 8px 20px -4px ${stat.glow}` : 'none',
              transition: 'all 0.35s ease',
            }}
            className="p-2.5 rounded-xl"
          >
            <stat.icon
              className="w-5 h-5 transition-all duration-300"
              style={{ color: hovered ? '#fff' : stat.accent }}
            />
          </div>
          <div
            className={`flex items-center gap-1 text-[0.6rem] font-bold px-2.5 py-1 rounded-full border transition-all duration-300 ${
              stat.trendUp
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-red-50 text-red-500 border-red-100'
            }`}
          >
            {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {stat.trend.split(' ')[0]}
          </div>
        </div>

        {/* Value */}
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-[2rem] font-black tracking-tight leading-none transition-colors duration-300"
              style={{ color: stat.accent }}
            >
              {count}{stat.unit}
            </span>
            {stat.total && (
              <span className="text-[0.9rem] font-bold text-slate-300">{stat.total}</span>
            )}
          </div>
          <div className="text-[0.7rem] text-slate-500 font-bold uppercase tracking-widest mt-1">
            {stat.label}
          </div>
        </div>

        {/* Bottom separator + trend text */}
        <div className="pt-2 border-t border-slate-100 text-[0.62rem] text-slate-400 font-medium flex items-center gap-1.5">
          <RefreshCw className="w-2.5 h-2.5 opacity-50" />
          {stat.trend}
        </div>
      </div>

      {/* Bottom progress bar */}
      <div
        className="absolute bottom-0 left-0 h-[3px] rounded-b-full transition-all duration-700"
        style={{
          width: hovered ? '100%' : '0%',
          background: `linear-gradient(90deg, ${stat.accent}80, ${stat.accent})`,
        }}
      />
    </div>
  );
}

export default function KPICards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {CARD_CONFIG.map((stat, i) => (
        <KPICard key={i} stat={stat} index={i} />
      ))}
    </div>
  );
}
