import React, { useState, useEffect, useMemo } from 'react';
import {
  Archive, Activity, Zap, ShieldCheck, AlertCircle, BarChart3, Layers, Radio
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { fetchLogs as apiFetchLogs } from '../services/alertService';

/* ═══════════════════════════════════════════════════════════════════════════════
   GLOBAL CSS (Preserved for animations)
   ═══════════════════════════════════════════════════════════════════════════════ */
const VAULT_PAGE_CSS = `
@keyframes vpPulse { 0%,100%{opacity:.55} 50%{opacity:1} }
@keyframes vpGlow { 0%,100%{box-shadow:0 0 12px rgba(14,165,233,.25)} 50%{box-shadow:0 0 24px rgba(14,165,233,.5)} }
@keyframes vpGradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes vpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes vp-stat-card { transition:all 0.3s cubic-bezier(.4,0,.2,1); }
.vp-stat-card:hover { transform:translateY(-4px); }
`;

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS (Preserved: StatusDonut, TimelineChart, HeatmapBlock)
   ═══════════════════════════════════════════════════════════════════════════════ */
const ZONES = ['ICU-Zone-A', 'Reception', 'Perimeter-B', 'Ward-C', 'Lab-1', 'Emergency-B', 'Hallway-3', 'Server-Room'];
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function StatusDonut({ stats, size = 140 }) {
  const { isDark } = useTheme();
  const data = [
    { key: 'completed', value: stats.completed, color: '#22c55e' },
    { key: 'in-progress', value: stats.inProgress, color: '#6366f1' },
    { key: 'pending', value: stats.pending, color: '#f59e0b' },
    { key: 'flagged', value: stats.flagged, color: '#ef4444' },
  ];
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - 20) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,.03)" strokeWidth={14} />
        {data.map(d => {
          const dash = (d.value / total) * circ;
          const el = <circle key={d.key} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth={14} strokeLinecap="round"
            strokeDasharray={`${Math.max(0, dash - 4)} ${circ}`}
            strokeDashoffset={-offset}
            style={{ transition: 'all 1s ease', filter: `drop-shadow(0 0 6px ${d.color}30)` }} />;
          offset += dash; return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1, fontFamily: 'JetBrains Mono,monospace' }}>{total}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 3 }}>Total</div>
      </div>
    </div>
  );
}

function TimelineChart() {
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const [data] = useState(() => HOURS.map(() => ({
    completed: randInt(5, 25), flagged: randInt(0, 5), inProgress: randInt(2, 12),
  })));
  const maxVal = Math.max(...data.map(d => d.completed + d.flagged + d.inProgress));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
        {data.map((d, i) => {
          const total = d.completed + d.flagged + d.inProgress;
          const h = (total / maxVal) * 100;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ width: '100%', height: `${h}%`, minHeight: 3, borderRadius: '3px 3px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: d.completed, background: '#22c55e' }} />
                <div style={{ flex: d.inProgress, background: '#6366f1' }} />
                <div style={{ flex: d.flagged, background: '#ef4444' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 7, color: '#94a3b8', fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>
            {i % 4 === 0 ? `${i.toString().padStart(2, '0')}` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatmapBlock() {
  const { isDark } = useTheme();
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [cells] = useState(() => DAYS.map(() => HOURS.map(() => randInt(0, 100))));
  const [tip, setTip] = useState(null);
  const intensity = v => {
    if (v > 80) return 'rgba(14,165,233,.85)'; if (v > 60) return 'rgba(14,165,233,.6)';
    if (v > 40) return 'rgba(14,165,233,.38)'; if (v > 20) return 'rgba(14,165,233,.18)';
    return 'rgba(14,165,233,.05)';
  };
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 1, marginBottom: 3, paddingLeft: 28 }}>
        {[0, 4, 8, 12, 16, 20].map(h => (
          <div key={h} style={{ flex: '1 1 0', fontSize: 8, color: '#94a3b8', fontWeight: 700, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
            {h.toString().padStart(2, '0')}h
          </div>
        ))}
      </div>
      {cells.map((row, di) => (
        <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
          <div style={{ width: 24, fontSize: 8, color: '#64748b', fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>{DAYS[di]}</div>
          {row.map((v, hi) => (
            <div key={hi} onMouseEnter={() => setTip({ d: di, h: hi, v })} onMouseLeave={() => setTip(null)}
              style={{
                flex: '1 1 0', height: 14, background: intensity(v), borderRadius: 2.5, cursor: 'crosshair',
                transition: 'all 0.15s', transform: tip?.d === di && tip?.h === hi ? 'scaleY(1.5)' : 'scaleY(1)',
                boxShadow: tip?.d === di && tip?.h === hi ? `0 0 10px ${intensity(v)}` : 'none',
              }} />
          ))}
        </div>
      ))}
      {tip && (
        <div style={{
          position: 'absolute', top: -34, left: '50%', transform: 'translateX(-50%)', background: isDark ? '#1e293b' : '#0f172a',
          color: '#f8fafc', padding: '5px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,.3)', zIndex: 10, fontFamily: 'JetBrains Mono,monospace',
          border: `1px solid ${isDark ? 'rgba(14,165,233,.4)' : 'rgba(14,165,233,.3)'}`,
        }}>
          {DAYS[tip.d]} {tip.h.toString().padStart(2, '0')}:00 — <span style={{ color: '#38bdf8' }}>{tip.v} events</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 700 }}>Less</span>
        {[.05, .18, .38, .6, .85].map((o, i) => (
          <div key={i} style={{ width: 12, height: 9, background: `rgba(14,165,233,${o})`, borderRadius: 2 }} />
        ))}
        <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 700 }}>More</span>
      </div>
    </div>
  );
}

export default function ActivityVault() {
  const [stats, setStats] = useState({
    total: 247, completed: 189, inProgress: 32, flagged: 8, pending: 18, avgConf: 92.4, avgTime: 2.1, highConf: 156
  });
  const { isDark } = useTheme();

  useEffect(() => {
    const s = document.createElement('style'); s.id = 'vp-css'; s.textContent = VAULT_PAGE_CSS; document.head.appendChild(s);
    return () => document.getElementById('vp-css')?.remove();
  }, []);

  const cardBg = isDark ? '#111827' : '#fff';
  const cardBorder = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>

      {/* ═══════════════ HERO HEADER WITH STATS ═══════════════ */}
      <div style={{
        borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 28,
        background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#0f172a 100%)',
        backgroundSize: '200% 200%', animation: 'vpGradient 10s ease infinite',
        padding: '32px 36px 28px',
      }}>
        <div style={{ position: 'absolute', top: -50, right: -20, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,.12),transparent 70%)', animation: 'vpFloat 5s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(14,165,233,.4)', animation: 'vpGlow 3s ease-in-out infinite', position: 'relative' }}>
                <Archive size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: -.5 }}>Activity Vault</h1>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
                  <Radio size={12} style={{ color: '#38bdf8', marginRight: 8 }} />
                  AI-Audited Historical Record Matrix • v4.2.1 • {stats.total.toLocaleString()} Records
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Total Audits', value: stats.total.toLocaleString(), color: '#38bdf8', Icon: Activity, sub: 'All time records' },
              { label: 'High Confidence', value: `${((stats.highConf / stats.total) * 100 || 0).toFixed(1)}%`, color: '#4ade80', Icon: ShieldCheck, sub: `${stats.highConf} ≥90%` },
              { label: 'Avg Process Time', value: `${stats.avgTime}s`, color: '#fbbf24', Icon: Zap, sub: 'Per frame analysis' },
              { label: 'Active Alerts', value: stats.flagged.toString(), color: '#f87171', Icon: AlertCircle, sub: 'Requires attention' },
            ].map(({ label, value, color, Icon, sub }, i) => (
              <div key={i} className="vp-stat-card" style={{
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 8, padding: '20px 22px', backdropFilter: 'blur(12px)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}18` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', lineHeight: 1, fontFamily: 'JetBrains Mono,monospace', marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ INSIGHTS ROW (Kept: Donut, Timeline, Heatmap) ═══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 16 }}>
        <div style={{ background: cardBg, borderRadius: 8, border: `1px solid ${cardBorder}`, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
          <StatusDonut stats={stats} size={120} />
        </div>
        <div style={{ background: cardBg, borderRadius: 8, border: `1px solid ${cardBorder}`, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isDark ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} style={{ color: '#0ea5e9' }} />Hourly Activity Timeline</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Events distribution over 24 hours</div>
            </div>
          </div>
          <TimelineChart />
        </div>
        <div style={{ background: cardBg, borderRadius: 8, border: `1px solid ${cardBorder}`, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isDark ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={14} style={{ color: '#8b5cf6' }} />Weekly Heatmap</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Event density per hour</div>
            </div>
          </div>
          <HeatmapBlock />
        </div>
      </div>

    </div>
  );
}

