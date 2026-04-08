import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, Cpu } from 'lucide-react';

const BASE_METRICS = [
  { label: 'PERSON', base: 94.2, color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', track: 'rgba(14,165,233,0.08)' },
  { label: 'VEHICLE', base: 96.8, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', track: 'rgba(34,197,94,0.08)' },
  { label: 'OBJECT', base: 89.4, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', track: 'rgba(245,158,11,0.08)' },
  { label: 'FACE', base: 91.7, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', track: 'rgba(139,92,246,0.08)' },
];

function MetricBar({ metric, loaded }) {
  const [hovered, setHovered] = useState(false);
  const [value, setValue] = useState(metric.base);

  useEffect(() => {
    const iv = setInterval(() => {
      setValue(metric.base + (Math.random() - 0.5) * 1.5);
    }, 2500);
    return () => clearInterval(iv);
  }, [metric.base]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? metric.bg : 'transparent',
        borderRadius: 14,
        padding: hovered ? '10px 12px' : '4px 6px',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: metric.color, boxShadow: `0 0 6px ${metric.color}` }} />
          <span className="text-[0.75rem] font-bold text-slate-500 tracking-widest">{metric.label}</span>
        </div>
        <span className="text-[0.95rem] font-black transition-all duration-500" style={{ color: metric.color }}>
          {value.toFixed(1)}%
        </span>
      </div>
      {/* Track */}
      <div style={{ height: 6, background: metric.track, borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: loaded ? `${value}%` : '0%',
            background: `linear-gradient(90deg, ${metric.color}80, ${metric.color})`,
            borderRadius: 99,
            transition: 'width 1.6s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: `0 0 8px ${metric.color}60`,
          }}
        />
      </div>
    </div>
  );
}

export default function ConfidencePanel() {
  const [loaded, setLoaded] = useState(false);
  const [avgVal, setAvgVal] = useState(92.8);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 120);
    const iv = setInterval(() => setAvgVal(v => parseFloat((92.8 + (Math.random() - 0.5) * 1.2).toFixed(1))), 2800);
    return () => clearInterval(iv);
  }, []);

  /* Radial gauge arc */
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const filled = (avgVal / 100) * circ * 0.75;

  return (
    <div
      style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 28, padding: '24px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 30px -8px rgba(0,0,0,0.07)' }}
      className="w-full transition-shadow duration-300 hover:shadow-[0_12px_40px_-10px_rgba(139,92,246,0.15)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[1.05rem] font-black text-slate-800 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-violet-500" />
          Detection Confidence
        </h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-[0.65rem] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-1.5 mb-5">
        {BASE_METRICS.map((m, i) => (
          <MetricBar key={i} metric={m} loaded={loaded} />
        ))}
      </div>

      {/* Avg gauge card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(14,165,233,0.06) 100%)',
          border: '1px solid rgba(139,92,246,0.12)',
          borderRadius: 18,
          padding: '16px 20px',
        }}
      >
        <div className="flex items-center gap-4">
          {/* SVG Radial */}
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
            <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="7" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" transform="rotate(135 45 45)" />
            <circle
              cx="45" cy="45" r={radius} fill="none"
              stroke="url(#gaugeGrad)" strokeWidth="7"
              strokeDasharray={`${filled} ${circ - filled}`}
              strokeLinecap="round"
              transform="rotate(135 45 45)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            <text x="45" y="48" textAnchor="middle" fill="#8b5cf6" fontSize="14" fontWeight="900" fontFamily="Outfit, sans-serif">
              {avgVal}%
            </text>
          </svg>

          <div className="flex flex-col gap-1">
            <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Avg Confidence</span>
            <div className="text-[1.9rem] font-black text-violet-600 leading-none">{avgVal}%</div>
            <div className="flex items-center gap-1 text-[0.7rem] font-bold text-emerald-500 mt-1">
              <TrendingUp className="w-3 h-3" />
              ↑ 2.1% from yesterday
            </div>
            <div className="flex items-center gap-1 text-[0.6rem] text-slate-400 font-semibold mt-0.5">
              <Activity className="w-3 h-3" />
              Updates every 2.5s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
