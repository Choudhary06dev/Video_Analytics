import React, { useMemo, useState, useEffect } from 'react';
import { Map, RefreshCw, Download } from 'lucide-react';

const SECTORS = ['ICU-Zone', 'Reception', 'Emergency', 'Ward-A', 'Lab-1', 'Perimeter'];
const COLS = 16;

function generateData() {
  return SECTORS.map((_, i) =>
    Array.from({ length: COLS }, (__, j) => {
      const dist = Math.abs(j - 8);
      let val = Math.random() * 80 + (20 - dist * 2);
      if (i === 2 && j > 6 && j < 10) val = Math.random() * 20 + 80;
      return Math.min(100, Math.max(0, val));
    })
  );
}

function getColorStyle(val) {
  if (val < 20) return { bg: '#f1f5f9', glow: 'none' };
  if (val < 40) return { bg: '#bae6fd', glow: 'none' };
  if (val < 60) return { bg: '#38bdf8', glow: '0 0 6px rgba(56,189,248,0.4)' };
  if (val < 80) return { bg: '#f97316', glow: '0 0 8px rgba(249,115,22,0.5)' };
  return { bg: '#ef4444', glow: '0 0 12px rgba(239,68,68,0.7)' };
}

export default function FacilityHeatmap() {
  const [data, setData] = useState(() => generateData());
  const [tooltip, setTooltip] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => {
      setData(generateData());
      setLastRefresh(new Date());
    }, 4000);
    return () => clearInterval(iv);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setData(generateData());
      setLastRefresh(new Date());
      setRefreshing(false);
    }, 600);
  };

  const avgActivity = useMemo(() => {
    const all = data.flat();
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  }, [data]);

  return (
    <div
      className="h-full flex flex-col w-full p-6 transition-shadow duration-300 hover:shadow-[0_12px_40px_-10px_rgba(249,115,22,0.12)] bg-card rounded-[28px] border border-border shadow-premium"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-5 shrink-0 flex-wrap gap-3">
        <div>
          <h3 className="text-[1.05rem] font-black text-text-dark flex items-center gap-2">
            <Map className="w-4 h-4 text-orange-500" />
            Facility Heatmap
          </h3>
          <p className="text-[0.7rem] text-text-gray font-semibold mt-0.5">
            Activity density by sector · Avg: <span className="font-black text-orange-500">{avgActivity}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-1.5 text-[0.6rem] font-bold text-text-gray">
            <span>Low</span>
            {['#f1f5f9','#bae6fd','#38bdf8','#f97316','#ef4444'].map((c, i) => (
              <div key={i} style={{ background: c, width: 14, height: 14, borderRadius: 4, boxShadow: i > 2 ? `0 0 4px ${c}80` : 'none' }} />
            ))}
            <span>High</span>
          </div>
          <button
            onClick={() => setAutoRefresh(p => !p)}
            style={{
              background: autoRefresh ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
              color: autoRefresh ? '#22c55e' : '#94a3b8',
              border: `1px solid ${autoRefresh ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)'}`,
            }}
            className="text-[0.6rem] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all"
          >
            AUTO
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex-1 flex flex-col justify-center gap-2 relative">
        {SECTORS.map((sector, i) => (
          <div key={sector} className="flex items-center gap-2">
            <div className="w-[72px] text-[0.68rem] font-bold text-text-gray text-right shrink-0 truncate">
              {sector}
            </div>
            <div className="flex-1 flex gap-1">
              {data[i].map((val, j) => {
                const { bg, glow } = getColorStyle(val);
                const isHot = val >= 80;
                return (
                  <div
                    key={j}
                    onMouseEnter={() => setTooltip({ sector, j, val: Math.round(val) })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      flex: 1,
                      aspectRatio: '1/1',
                      background: bg,
                      borderRadius: 4,
                      boxShadow: glow,
                      transform: tooltip?.sector === sector && tooltip?.j === j ? 'scale(1.4)' : 'scale(1)',
                      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                      cursor: 'crosshair',
                      animationName: isHot ? 'heatPulse' : 'none',
                      animationDuration: '2s',
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite',
                      animationDelay: `${(i * COLS + j) % 6 * 0.3}s`,
                    }}
                    title={`${sector} — Zone ${j + 1}: ${Math.round(val)}% activity`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <style>{`
          @keyframes heatPulse {
            0%,100% { opacity:1; } 50% { opacity:0.7; }
          }
        `}</style>

        {/* Floating tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              top: -36,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15,23,42,0.95)',
              color: '#f8fafc',
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: 10,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              zIndex: 50,
            }}
          >
            {tooltip.sector} · Zone {tooltip.j + 1}: <span style={{ color: '#fb923c' }}>{tooltip.val}%</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="mt-4 p-3 flex justify-between items-center shrink-0 bg-surface rounded-[14px] border border-border"
      >
        <div className="text-[0.72rem] text-text-gray">
          <span className="font-black text-text-dark">Peak:</span> 2:00 PM – 4:00 PM
          <span className="ml-3 text-text-gray font-medium">
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <button
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '6px 14px',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
          }}
          className="transition-transform hover:scale-105 active:scale-95"
        >
          <Download className="w-3 h-3" /> Report
        </button>
      </div>
    </div>
  );
}
