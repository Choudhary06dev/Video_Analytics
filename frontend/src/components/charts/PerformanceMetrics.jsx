import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine,
} from 'recharts';
import { BarChart2, Camera, TrendingUp, AlertCircle } from 'lucide-react';

const HOUR_LABELS = ['00:00','04:00','08:00','12:00','16:00','20:00','24:00'];
const BASE_DETECTIONS = [32, 18, 54, 72, 65, 42, 25];

const CAMERAS = [
  { name: 'CAM-1', base: 98, color: '#22c55e' },
  { name: 'CAM-2', base: 92, color: '#22c55e' },
  { name: 'CAM-3', base: 75, color: '#f59e0b' },
  { name: 'CAM-4', base: 95, color: '#22c55e' },
  { name: 'CAM-5', base: 88, color: '#0ea5e9' },
  { name: 'CAM-6', base: 91, color: '#22c55e' },
];

const CustomDetTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(14,165,233,0.3)',
      borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#0ea5e9', fontSize: 14, fontWeight: 900 }}>{payload[0].value} detections</p>
    </div>
  );
};

const CustomCamTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const color = val >= 90 ? '#22c55e' : val >= 80 ? '#0ea5e9' : '#f59e0b';
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: `1px solid ${color}50`,
      borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(12px)',
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ color, fontSize: 14, fontWeight: 900 }}>{val}% efficiency</p>
    </div>
  );
};

function getBarColor(val) {
  if (val > 90) return '#22c55e';
  if (val > 80) return '#0ea5e9';
  return '#f59e0b';
}

export default function PerformanceMetrics() {
  const [detData, setDetData] = useState(
    HOUR_LABELS.map((name, i) => ({ name, value: BASE_DETECTIONS[i] }))
  );
  const [camData, setCamData] = useState(
    CAMERAS.map(c => ({ name: c.name, value: c.base }))
  );
  const [activeBar, setActiveBar] = useState(null);
  const [viewMode, setViewMode] = useState('bar'); // 'bar' | 'line'

  // Simulate live camera fluctuation
  useEffect(() => {
    const iv = setInterval(() => {
      setCamData(CAMERAS.map(c => ({
        name: c.name,
        value: Math.min(100, Math.max(60, c.base + (Math.random() - 0.5) * 5)),
      })));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const totalDetections = detData.reduce((a, b) => a + b.value, 0);
  const avgCam = Math.round(camData.reduce((a, b) => a + b.value, 0) / camData.length);
  const offlineCount = camData.filter(c => c.value < 80).length;

  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-8">

      {/* ── Detection Count Chart ── */}
      <div
        className="flex flex-col h-[380px] p-6 transition-shadow hover:shadow-[0_12px_40px_-10px_rgba(14,165,233,0.14)] bg-card rounded-lg border border-border shadow-premium"
      >
        <div className="flex justify-between items-start mb-5 shrink-0">
          <div>
            <h3 className="text-[1.05rem] font-black text-text-dark flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-500" />
              Detection Count (24h)
            </h3>
            <p className="text-[0.7rem] text-text-gray font-semibold mt-0.5">
              Total: <span className="text-sky-500 font-black">{totalDetections}</span> events
            </p>
          </div>
          <div className="flex gap-1.5">
            {['bar','line'].map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  background: viewMode === m ? '#0ea5e9' : '#f8fafc',
                  color: viewMode === m ? '#fff' : '#94a3b8',
                  border: `1px solid ${viewMode === m ? '#0ea5e9' : '#e2e8f0'}`,
                }}
                className="text-[0.6rem] font-bold px-2.5 py-1 rounded-lg cursor-pointer capitalize transition-all duration-200"
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[280px] relative min-w-0">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            {viewMode === 'line' ? (
              <LineChart data={detData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomDetTooltip />} />
                <ReferenceLine y={60} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" label={{ value: 'Avg', fill: '#94a3b8', fontSize: 10 }} />
                <Line
                  type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5}
                  dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={detData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomDetTooltip />} cursor={{ fill: 'rgba(14,165,233,0.06)', radius: 8 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}
                  onMouseEnter={(_, i) => setActiveBar(i)}
                  onMouseLeave={() => setActiveBar(null)}
                >
                  {detData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={activeBar === i
                        ? 'url(#gradActive)'
                        : i === BASE_DETECTIONS.indexOf(Math.max(...BASE_DETECTIONS))
                          ? 'url(#gradPeak)'
                          : 'url(#gradNorm)'}
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="gradNorm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                  <linearGradient id="gradPeak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                  <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Camera Performance Chart ── */}
      <div
        className="flex flex-col h-[380px] p-6 transition-shadow hover:shadow-[0_12px_40px_-10px_rgba(34,197,94,0.14)] bg-card rounded-lg border border-border shadow-premium"
      >
        <div className="flex justify-between items-start mb-5 shrink-0">
          <div>
            <h3 className="text-[1.05rem] font-black text-text-dark flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-500" />
              Camera Performance
            </h3>
            <p className="text-[0.7rem] text-text-gray font-semibold mt-0.5">
              Avg: <span className="text-emerald-500 font-black">{avgCam}%</span>
              {offlineCount > 0
                ? <span className="ml-2 text-amber-500 font-black">{offlineCount} degraded</span>
                : <span className="ml-2 text-emerald-500 font-black">All optimal</span>
              }
            </p>
          </div>
          <div
            style={{
              background: offlineCount ? '#fffbeb' : '#f0fdf4',
              color: offlineCount ? '#d97706' : '#16a34a',
              border: `1px solid ${offlineCount ? '#fde68a' : '#bbf7d0'}`,
            }}
            className="flex items-center gap-1.5 text-[0.65rem] font-black px-2.5 py-1 rounded-full"
          >
            {offlineCount
              ? <AlertCircle className="w-3 h-3" />
              : <TrendingUp className="w-3 h-3" />
            }
            {offlineCount ? `${offlineCount} Warning` : 'All Online'}
          </div>
        </div>

        <div className="w-full h-[280px] relative min-w-0">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <BarChart data={camData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
              <Tooltip content={<CustomCamTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} />
              <ReferenceLine y={80} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}>
                {camData.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Camera status mini pills */}
        <div className="flex gap-1.5 mt-3 flex-wrap shrink-0">
          {camData.map((c, i) => (
            <div
              key={i}
              style={{
                background: c.value >= 90 ? 'rgba(34,197,94,0.09)' : c.value >= 80 ? 'rgba(14,165,233,0.09)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${c.value >= 90 ? 'rgba(34,197,94,0.2)' : c.value >= 80 ? 'rgba(14,165,233,0.2)' : 'rgba(245,158,11,0.2)'}`,
                color: c.value >= 90 ? '#16a34a' : c.value >= 80 ? '#0369a1' : '#b45309',
              }}
              className="flex items-center gap-1 text-[0.58rem] font-bold px-2 py-0.5 rounded-full"
            >
              <span style={{ width:5,height:5,borderRadius:'50%',background:'currentColor',display:'inline-block' }} />
              {c.name} {Math.round(c.value)}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
