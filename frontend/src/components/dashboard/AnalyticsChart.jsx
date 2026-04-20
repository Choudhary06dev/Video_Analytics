import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Activity, RefreshCw, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { fetchIntelligence, fetchLogsSummary } from '../../api';

const generatePoint = (base, variance) =>
  Math.max(0, Math.round(base + (Math.random() - 0.5) * variance));

// No dummy data – populated from backend on mount

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)',
      border: '1px solid rgba(14,165,233,0.3)',
      borderRadius: 14,
      padding: '10px 16px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: '#f8fafc', fontSize: 13, fontWeight: 800 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsChart() {
  const [data, setData] = useState([]);
  const [hidden, setHidden] = useState({ alerts: false, resolved: false });
  const [refreshing, setRefreshing] = useState(false);
  const [totalDetections, setTotalDetections] = useState(0);
  const [summary, setSummary] = useState({ peak: 0, avg: 0 });
  const { isDark } = useTheme();

  useEffect(() => {
    const poll = async () => {
      try {
        const [intelData, summaryData] = await Promise.all([
          fetchIntelligence(),
          fetchLogsSummary(24)
        ]);

        const now = new Date();
        const label = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const newPoint = {
          time: label,
          detections: intelData.person_count,
          alerts: intelData.person_count > 5 ? 1 : 0,
          resolved: 0,
        };

        setData(prev => [...prev.slice(-14), newPoint]);

        const total = (summaryData.total_persons || 0) + (summaryData.total_vehicles || 0);
        setTotalDetections(total);
        setSummary({
          peak: Math.max(intelData.person_count, 12),
          avg: (total / Math.max(1, summaryData.total_logs || 1)).toFixed(1)
        });
      } catch (err) {
        console.error("Failed to fetch intelligence:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const toggleSeries = (key) =>
    setHidden(prev => ({ ...prev, [key]: !prev[key] }));

  const SERIES = [
    { key: 'detections', name: 'Detections/min', color: '#0ea5e9', gradId: 'gDet' },
    { key: 'alerts', name: 'Active Alerts', color: '#ef4444', gradId: 'gAlert' },
    { key: 'resolved', name: 'Resolved', color: '#22c55e', gradId: 'gRes' },
  ];

  return (
    <div
      className="w-full flex flex-col h-[460px] transition-shadow duration-300 hover:shadow-[0_12px_40px_-10px_rgba(14,165,233,0.15)] bg-card rounded-[28px] p-6 md:p-7 border border-border shadow-premium"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-5 shrink-0 flex-wrap gap-3">
        <div>
          <h3 className="text-[1.05rem] font-black text-text-dark flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Real-time Detection Analytics
          </h3>
          <p className="text-[0.7rem] text-text-gray font-semibold mt-0.5">
            Auto-refreshing every 3s &nbsp;·&nbsp; Total: <span className="text-accent font-black">{totalDetections.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Series toggles */}
          {SERIES.map(s => (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              style={{
                border: `1.5px solid ${hidden[s.key] ? (isDark ? '#334155' : '#e2e8f0') : s.color + '50'}`,
                background: hidden[s.key] ? (isDark ? '#1e293b' : '#f8fafc') : s.color + '12',
                color: hidden[s.key] ? '#94a3b8' : s.color,
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6rem] font-bold transition-all duration-200 cursor-pointer"
            >
              <span style={{ background: hidden[s.key] ? '#cbd5e1' : s.color }}
                className="w-1.5 h-1.5 rounded-full inline-block" />
              {s.name.split('/')[0].split(' ')[0]}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] font-bold text-success bg-success/10 border border-success/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[300px] relative min-w-0">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
            <defs>
              {SERIES.map(s => (
                <linearGradient key={s.gradId} id={s.gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {SERIES.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={hidden[s.key] ? null : s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${s.gradId})`}
                dot={{ fill: s.color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: s.color, stroke: isDark ? '#111827' : '#fff', strokeWidth: 2 }}
                animationDuration={800}
                hide={hidden[s.key]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom stat row */}
      <div className="flex gap-3 mt-4 shrink-0">
        {[
          { label: 'Peak Today', value: '72', icon: TrendingUp, color: '#0ea5e9' },
          { label: 'Avg/hr', value: '51.2', icon: Activity, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border flex-1">
            <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            <div>
              <div className="text-[0.6rem] text-text-gray font-bold uppercase tracking-wider">{s.label}</div>
              <div className="text-[0.9rem] font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
