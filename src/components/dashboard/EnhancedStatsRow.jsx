import React, { useState, useEffect, useRef } from 'react';
import { Target, Zap, Activity, Video } from 'lucide-react';

const STATS = [
  {
    label: 'Detection Precision',
    value: '91.4%',
    numeric: 91.4,
    unit: '%',
    icon: Target,
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    glow: 'rgba(14,165,233,0.45)',
    sparkle: '#38bdf8',
  },
  {
    label: 'Latency',
    value: '48ms',
    numeric: 48,
    unit: 'ms',
    icon: Zap,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    glow: 'rgba(245,158,11,0.45)',
    sparkle: '#fcd34d',
  },
  {
    label: 'Objects Tracked',
    value: '342',
    numeric: 342,
    unit: '',
    icon: Activity,
    gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    glow: 'rgba(34,197,94,0.45)',
    sparkle: '#4ade80',
  },
  {
    label: 'Active Feeds',
    value: '6/6',
    numeric: 6,
    unit: '/6',
    icon: Video,
    gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    glow: 'rgba(15,23,42,0.40)',
    sparkle: '#94a3b8',
  },
];

function useCountUp(target, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let startTime = null;
      const step = (ts) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);
  return count;
}

function StatCard({ stat, index }) {
  const count = useCountUp(stat.numeric, 1000, index * 200);
  const [hovered, setHovered] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        background: stat.gradient,
        boxShadow: hovered
          ? `0 24px 60px -10px ${stat.glow}, 0 0 0 1px rgba(255,255,255,0.15) inset`
          : `0 10px 30px -8px ${stat.glow}`,
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      className="relative p-6 rounded-[22px] text-white overflow-hidden"
    >
      {/* Shine overlay */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Floating sparkle dots */}
      {hovered && [0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 4, height: 4,
            borderRadius: '50%',
            background: stat.sparkle,
            top: `${20 + i * 25}%`,
            right: `${10 + i * 8}%`,
            animation: `float${i} 1.5s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Ripples */}
      {ripples.map(r => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x, top: r.y,
            width: 0, height: 0,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            transform: 'translate(-50%,-50%)',
            animation: 'rippleAnim 0.7s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      <style>{`
        @keyframes rippleAnim {
          to { width: 200px; height: 200px; opacity: 0; }
        }
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>

      <div className="relative z-10 flex items-center gap-4">
        <div
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            transform: hovered ? 'rotate(10deg) scale(1.1)' : 'rotate(0deg) scale(1)',
            transition: 'transform 0.4s ease',
          }}
          className="p-3 rounded-xl"
        >
          <stat.icon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[0.7rem] font-bold uppercase tracking-[1.5px] opacity-70 mb-0.5">
            {stat.label}
          </div>
          <div className="text-[1.8rem] font-black leading-none">
            {count}{stat.unit}
          </div>
        </div>
      </div>

      {/* Bottom progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
        <div
          style={{
            width: hovered ? '100%' : '30%',
            background: `linear-gradient(90deg, transparent, ${stat.sparkle})`,
            height: '100%',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function EnhancedStatsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
      {STATS.map((stat, i) => (
        <StatCard key={i} stat={stat} index={i} />
      ))}
    </div>
  );
}
