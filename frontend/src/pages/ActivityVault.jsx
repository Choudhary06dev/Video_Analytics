import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Archive, Activity, Zap, ShieldCheck, AlertCircle, Clock, Eye, TrendingUp,
  TrendingDown, ChevronRight, ChevronLeft, ChevronDown, ArrowRight, Cpu,
  Camera, CheckCircle2, XCircle, Loader2, Download, Sparkles, BarChart3,
  Layers, Search, SlidersHorizontal, Play, Pause, Radio, Wifi, Shield,
  Target, Gauge, RefreshCw, Calendar, MapPin, User, FileText, X, Hash,
  ArrowUpDown, MoreHorizontal, ExternalLink, Copy, Maximize2, Filter
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { fetchLogs as apiFetchLogs } from '../services/alertService';

/* ═══════════════════════════════════════════════════════════════════════════════
   GLOBAL CSS
   ═══════════════════════════════════════════════════════════════════════════════ */
const VAULT_PAGE_CSS = `
@keyframes vpPulse { 0%,100%{opacity:.55} 50%{opacity:1} }
@keyframes vpGlow { 0%,100%{box-shadow:0 0 12px rgba(14,165,233,.25)} 50%{box-shadow:0 0 24px rgba(14,165,233,.5)} }
@keyframes vpSlideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
@keyframes vpSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes vpShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes vpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes vpRipple { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.8);opacity:0} }
@keyframes vpGradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes vpExpand { from{opacity:0;max-height:0} to{opacity:1;max-height:400px} }
@keyframes vpCountUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes vpScanline { from{left:-30%} to{left:130%} }
.vp-row { transition:all 0.2s ease; }
.vp-row:hover { background:linear-gradient(90deg,rgba(14,165,233,.035),rgba(139,92,246,.02),transparent) !important; }
.vp-row:hover .vp-id { color:#0ea5e9 !important; }
.vp-row:hover .vp-chevron { color:#0ea5e9 !important; transform:translateX(2px); }
.vp-row:hover .vp-avatar { transform:scale(1.08); box-shadow:0 4px 16px var(--av-color,rgba(0,0,0,.2)); }
.vp-scrollbar::-webkit-scrollbar { width:5px; }
.vp-scrollbar::-webkit-scrollbar-track { background:transparent; }
.vp-scrollbar::-webkit-scrollbar-thumb { background:rgba(14,165,233,.15); border-radius:99px; }
.vp-scrollbar::-webkit-scrollbar-thumb:hover { background:rgba(14,165,233,.35); }
.vp-stat-card { transition:all 0.3s cubic-bezier(.4,0,.2,1); }
.vp-stat-card:hover { transform:translateY(-4px); }
.vp-tab { transition:all 0.2s ease; position:relative; }
.vp-tab::after { content:''; position:absolute; bottom:-1px; left:50%; width:0; height:2px; background:currentColor; transition:all 0.2s; transform:translateX(-50%); border-radius:99px; }
.vp-tab[data-active="true"]::after { width:60%; }
`;

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
const ZONES = ['ICU-Zone-A', 'Reception', 'Perimeter-B', 'Ward-C', 'Lab-1', 'Emergency-B', 'Hallway-3', 'Server-Room', 'Research-Lab', 'Loading-Bay'];
const TASK_TYPES = [
  { name: 'Deep Clean', category: 'cleaning', icon: '🧹', priority: 'medium' },
  { name: 'Patrol Check', category: 'patrol', icon: '🛡️', priority: 'high' },
  { name: 'Equipment Scan', category: 'monitor', icon: '📡', priority: 'low' },
  { name: 'Mask Verify', category: 'compliance', icon: '😷', priority: 'high' },
  { name: 'Entry Log', category: 'access', icon: '🚪', priority: 'medium' },
  { name: 'Crowd Audit', category: 'monitor', icon: '👥', priority: 'high' },
  { name: 'Thermal Check', category: 'monitor', icon: '🌡️', priority: 'medium' },
  { name: 'Sanitization', category: 'cleaning', icon: '✨', priority: 'low' },
  { name: 'ID Verification', category: 'access', icon: '🪪', priority: 'high' },
  { name: 'Zone Sweep', category: 'patrol', icon: '🔍', priority: 'medium' },
];
const WORKERS = [
  { name: 'Ahmed Hassan', role: 'Security Lead', avatar: 'AH', color: '#8b5cf6', dept: 'Security' },
  { name: 'Fatima Bibi', role: 'AI Operator', avatar: 'FB', color: '#0ea5e9', dept: 'Operations' },
  { name: 'Muhammad Bilal', role: 'Facility Mgr', avatar: 'MB', color: '#22c55e', dept: 'Facilities' },
  { name: 'Zainab Ali', role: 'Health Tech', avatar: 'ZA', color: '#f59e0b', dept: 'Health' },
  { name: 'Usman Sheikh', role: 'Guard', avatar: 'US', color: '#ef4444', dept: 'Security' },
  { name: 'Aisha Malik', role: 'Supervisor', avatar: 'AM', color: '#ec4899', dept: 'Management' },
  { name: 'Hamza Riaz', role: 'Analyst', avatar: 'HR', color: '#14b8a6', dept: 'Analytics' },
  { name: 'Sarah Khan', role: 'Compliance', avatar: 'SK', color: '#a855f7', dept: 'Legal' },
];
const STATUS_META = {
  completed: { label: 'Completed', color: '#22c55e', bg: 'rgba(34,197,94,.07)', icon: CheckCircle2 },
  'in-progress': { label: 'In Progress', color: '#6366f1', bg: 'rgba(99,102,241,.07)', icon: Loader2 },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,.07)', icon: Clock },
  flagged: { label: 'Flagged', color: '#ef4444', bg: 'rgba(239,68,68,.07)', icon: XCircle },
};
const CATEGORY_COLOR = {
  cleaning: '#22c55e', patrol: '#0ea5e9', monitor: '#8b5cf6', compliance: '#f59e0b', access: '#ec4899',
};
const PRIORITY_META = {
  high: { color: '#ef4444', label: 'High' },
  medium: { color: '#f59e0b', label: 'Med' },
  low: { color: '#22c55e', label: 'Low' },
};

function rand(a, b) { return Math.random() * (b - a) + a; }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

function makeActivity(i) {
  const worker = WORKERS[randInt(0, WORKERS.length - 1)];
  const task = TASK_TYPES[randInt(0, TASK_TYPES.length - 1)];
  const zone = ZONES[randInt(0, ZONES.length - 1)];
  const sts = ['completed', 'completed', 'completed', 'completed', 'in-progress', 'in-progress', 'in-progress', 'pending', 'pending', 'flagged'];
  const status = sts[randInt(0, sts.length - 1)];
  const conf = status === 'completed' ? rand(88, 99.9) : status === 'in-progress' ? rand(70, 92) : status === 'flagged' ? rand(25, 65) : rand(50, 78);
  const ago = randInt(1, 180);
  const duration = rand(2, 45).toFixed(0);
  return {
    id: `AV-${(1000 + i).toString().padStart(4, '0')}`,
    worker, task, zone, status, priority: task.priority,
    camId: `CAM-${randInt(1, 32).toString().padStart(2, '0')}`,
    frames: randInt(80, 960),
    procTime: rand(0.8, 9.5).toFixed(1),
    confidence: parseFloat(conf.toFixed(1)),
    timeAgo: ago < 60 ? `${ago}m ago` : ago < 120 ? `${Math.floor(ago / 60)}h ${ago % 60}m ago` : `${Math.floor(ago / 60)}h ago`,
    timestamp: new Date(Date.now() - ago * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date(Date.now() - ago * 60000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    sparkline: Array.from({ length: 12 }, () => randInt(20, 100)),
    threat: status === 'flagged' ? randInt(55, 95) : randInt(2, 30),
    duration: `${duration}min`,
    notes: status === 'flagged' ? 'Anomaly detected — review required' : 'Standard operation — no issues',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function Sparkline({ data, color, width = 80, height = 30 }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const sy = v => height - ((v - min) / range) * height;
  const line = data.map((v, i) => `${(i / (data.length - 1)) * width},${sy(v)}`).join(' ');
  const area = `0,${height} ${line} ${width},${height}`;
  const uid = `sp${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${uid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={width} cy={sy(data[data.length - 1])} r={2.5} fill={color} />
      <circle cx={width} cy={sy(data[data.length - 1])} r={5} fill={color} opacity={0.12}>
        <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ConfidenceRing({ value, size = 44 }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, progress = (value / 100) * c;
  const color = value >= 88 ? '#22c55e' : value >= 70 ? '#6366f1' : value >= 50 ? '#f59e0b' : '#ef4444';
  const uid = `cr${Math.random().toString(36).slice(2, 7)}`;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={color} stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,.04)" strokeWidth={3.5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${uid})`} strokeWidth={3.5}
          strokeDasharray={`${progress} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 900, color, fontFamily: 'JetBrains Mono,monospace' }}>{Math.round(value)}</span>
    </div>
  );
}

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
          border: `1px solid ${isDark ? 'rgba(14,165,233,.4)' : 'rgba(14,165,233,.3)'}`
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

function TimelineChart() {
  const { isDark } = useTheme();
  const [data] = useState(() => Array.from({ length: 24 }, (_, i) => ({
    hour: i, completed: randInt(5, 25), flagged: randInt(0, 5), inProgress: randInt(2, 12),
  })));
  const maxVal = Math.max(...data.map(d => d.completed + d.flagged + d.inProgress));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
        {data.map((d, i) => {
          const total = d.completed + d.flagged + d.inProgress;
          const h = (total / maxVal) * 100;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }} title={`${i.toString().padStart(2, '0')}:00 — ${total} events`}>
              <div style={{ width: '100%', height: `${h}%`, minHeight: 3, borderRadius: '3px 3px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'crosshair' }}>
                <div style={{ flex: d.completed, background: '#22c55e', transition: 'all 0.5s' }} />
                <div style={{ flex: d.inProgress, background: '#6366f1', transition: 'all 0.5s' }} />
                <div style={{ flex: d.flagged, background: '#ef4444', transition: 'all 0.5s' }} />
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

function ActivityRow({ act, idx, onSelect, isSelected }) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sm = STATUS_META[act.status];
  const catColor = CATEGORY_COLOR[act.task.category] || '#64748b';
  const StatusIcon = sm.icon;
  const pri = PRIORITY_META[act.priority];
  const { isDark } = useTheme();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), Math.min(idx * 30, 300));
    return () => clearTimeout(t);
  }, [idx]);

  return (
    <div style={{
      opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(-6px)',
      transition: `opacity 0.35s ease ${Math.min(idx * 0.03, 0.3)}s, transform 0.35s ease ${Math.min(idx * 0.03, 0.3)}s`,
    }}>
      <div className="vp-row" style={{
        display: 'flex', alignItems: 'center', padding: '14px 28px', gap: 16,
        borderBottom: '1px solid rgba(0,0,0,.04)', cursor: 'pointer', position: 'relative',
      }} onClick={() => setExpanded(e => !e)}>

        {/* Selection checkbox area */}
        <div style={{ flexShrink: 0, width: 18 }}>
          <div onClick={e => { e.stopPropagation(); onSelect(act.id); }} style={{
            width: 18, height: 18, borderRadius: 6, cursor: 'pointer',
            border: `2px solid ${isSelected ? '#0ea5e9' : '#d1d5db'}`,
            background: isSelected ? '#0ea5e9' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            {isSelected && <CheckCircle2 size={11} color="#fff" />}
          </div>
        </div>

        {/* Expand */}
        <div className="vp-chevron" style={{ color: expanded ? '#0ea5e9' : '#cbd5e1', transition: 'all 0.2s', transform: expanded ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>

        {/* ID */}
        <div style={{ width: 90, flexShrink: 0 }}>
          <div className="vp-id" style={{ fontSize: 12, fontWeight: 800, color: expanded ? '#0ea5e9' : '#475569', fontFamily: 'JetBrains Mono,monospace', transition: 'all 0.2s' }}>
            #{act.id}
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>{act.date}</div>
        </div>

        {/* Worker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 170, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <div className="vp-avatar" style={{
              '--av-color': `${act.worker.color}40`,
              width: 36, height: 36, borderRadius: 11,
              background: `linear-gradient(135deg,${act.worker.color},${act.worker.color}BB)`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900, flexShrink: 0, transition: 'all 0.25s',
              boxShadow: `0 3px 12px ${act.worker.color}30`,
            }}>{act.worker.avatar}</div>
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: `2px solid ${isDark ? '#111827' : '#fff'}` }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b', lineHeight: 1.2 }}>{act.worker.name}</div>
            <div style={{ fontSize: 9, color: isDark ? '#94a3b8' : '#94a3b8', fontWeight: 600, marginTop: 1 }}>{act.worker.role} · {act.worker.dept}</div>
          </div>
        </div>

        {/* Task */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 0', minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `${catColor}0C`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, border: `1px solid ${catColor}15` }}>
            {act.task.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.task.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: catColor, background: `${catColor}0C`, padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: .8, border: `1px solid ${catColor}12`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: catColor }} />{act.task.category}
              </span>
              <span style={{ fontSize: 8, fontWeight: 800, color: pri.color, background: `${pri.color}0C`, padding: '2px 6px', borderRadius: 99, border: `1px solid ${pri.color}12` }}>
                {pri.label}
              </span>
            </div>
          </div>
        </div>

        {/* Zone */}
        <div style={{ width: 120, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{act.zone}</span>
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 2, fontFamily: 'JetBrains Mono,monospace', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Camera size={8} />{act.camId}
          </div>
        </div>

        {/* AI Score + sparkline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 140, flexShrink: 0 }}>
          <ConfidenceRing value={act.confidence} size={42} />
          <Sparkline data={act.sparkline} color={catColor} width={70} height={26} />
        </div>

        {/* Status */}
        <div style={{ width: 115, flexShrink: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: sm.bg, color: sm.color,
            padding: '5px 12px', borderRadius: 10,
            fontSize: 10, fontWeight: 800, letterSpacing: .5, textTransform: 'uppercase',
            border: `1px solid ${sm.color}12`,
          }}>
            <StatusIcon size={11} style={{ animation: act.status === 'in-progress' ? 'vpSpin 1.5s linear infinite' : 'none' }} />
            {sm.label}
          </div>
        </div>

        {/* Duration */}
        <div style={{ width: 60, flexShrink: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', fontFamily: 'JetBrains Mono,monospace' }}>{act.duration}</div>
          <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>Duration</div>
        </div>

        {/* Time */}
        <div style={{ width: 70, flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{act.timeAgo}</div>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, fontFamily: 'JetBrains Mono,monospace' }}>{act.timestamp}</div>
        </div>

        {/* Actions */}
        <div style={{ width: 30, flexShrink: 0, textAlign: 'right' }}>
          <button onClick={e => { e.stopPropagation(); }} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0ea5e9'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          background: 'linear-gradient(135deg,rgba(14,165,233,.025),rgba(139,92,246,.02),rgba(236,72,153,.01))',
          borderBottom: '1px solid rgba(14,165,233,.08)', padding: '18px 28px 18px 68px',
          animation: 'vpSlideIn 0.25s ease-out',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Frames', value: act.frames.toLocaleString(), icon: <Eye size={13} />, color: '#8b5cf6', sub: 'Analyzed' },
              { label: 'Latency', value: `${act.procTime}s`, icon: <Zap size={13} />, color: '#f59e0b', sub: 'Process time' },
              { label: 'Confidence', value: `${act.confidence}%`, icon: <Cpu size={13} />, color: act.confidence >= 88 ? '#22c55e' : '#6366f1', sub: act.confidence >= 88 ? 'Excellent' : 'Review' },
              { label: 'Threat', value: `${act.threat}%`, icon: <Shield size={13} />, color: act.threat > 50 ? '#ef4444' : '#22c55e', sub: act.threat > 50 ? 'Elevated' : 'Normal' },
              { label: 'Camera', value: act.camId, icon: <Camera size={13} />, color: '#0ea5e9', sub: act.zone },
              { label: 'Duration', value: act.duration, icon: <Clock size={13} />, color: '#ec4899', sub: 'Task time' },
            ].map((d, i) => (
              <div key={i} style={{
                background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.9)', borderRadius: 8, padding: '12px 14px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.05)'}`, display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.2s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${d.color}12`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${d.color}0C`, color: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${d.color}15` }}>{d.icon}</div>
                <div>
                  <div style={{ fontSize: 8, color: isDark ? '#94a3b8' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{d.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: isDark ? '#f1f5f9' : '#1e293b', lineHeight: 1.2, fontFamily: 'JetBrains Mono,monospace' }}>{d.value}</div>
                  <div style={{ fontSize: 8, color: d.color, fontWeight: 700, marginTop: 1 }}>{d.sub}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Notes row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'}` }}>
            <FileText size={13} style={{ color: '#64748b', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, flex: 1 }}>{act.notes}</span>
            <button style={{ fontSize: 10, fontWeight: 700, color: '#0ea5e9', background: 'rgba(14,165,233,.06)', border: '1px solid rgba(14,165,233,.12)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,165,233,.06)'}>
              <ExternalLink size={10} /> View Full Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
const TABS = ['All', 'Completed', 'In Progress', 'Flagged', 'Pending'];
const TAB_STATUS = { All: null, Completed: 'completed', 'In Progress': 'in-progress', Flagged: 'flagged', Pending: 'pending' };
const TAB_COLORS = { All: '#0ea5e9', Completed: '#22c55e', 'In Progress': '#6366f1', Flagged: '#ef4444', Pending: '#f59e0b' };

export default function ActivityVault() {
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortKey, setSortKey] = useState('time');
  const [sortDir, setSortDir] = useState('desc');
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const counterRef = useRef(200);
  const ITEMS_PER_PAGE = 15;
  const { isDark } = useTheme();
  const cardBg = isDark ? '#111827' : '#fff';
  const cardBorder = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const surfaceBg = isDark ? '#1e293b' : '#f8fafc';
  const surfaceBg2 = isDark ? '#0f172a' : '#fafbfc';

  // Helper to map backend events to frontend UI format
  const formatBackendEvent = (event) => {
    const ago = Math.floor((Date.now() - new Date(event.timestamp)) / 60000);
    const worker = WORKERS[Math.floor(Math.random() * WORKERS.length)]; // AI event, mock worker
    
    return {
      id: `AV-${event.id.toString().padStart(4, '0')}`,
      worker,
      task: { 
        icon: '🤖', 
        name: event.scenario_key.replace(/_/g, ' ').toUpperCase(), 
        category: 'monitor' 
      },
      zone: 'Zone-Alpha', // Mock zone
      status: event.is_alert ? 'flagged' : 'completed',
      priority: event.severity.toLowerCase(),
      camId: `CAM-${event.camera_id}`,
      frames: 420,
      procTime: "1.2",
      confidence: event.confidence * 100,
      timeAgo: ago < 60 ? `${ago}m ago` : `${Math.floor(ago / 60)}h ago`,
      timestamp: new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(event.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      sparkline: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100)),
      threat: event.severity === 'Critical' ? 85 : 20,
      duration: "0min",
      notes: `AI detected ${event.object_class} with ${Math.round(event.confidence * 100)}% confidence.`
    };
  };

  // Inject CSS
  useEffect(() => {
    if (document.getElementById('vp-css')) return;
    const s = document.createElement('style'); s.id = 'vp-css'; s.textContent = VAULT_PAGE_CSS;
    document.head.appendChild(s);
    return () => { document.getElementById('vp-css')?.remove(); };
  }, []);

  // Fetch real logs from backend
  const loadLogs = useCallback(async () => {
    try {
      const data = await apiFetchLogs({ hours: 24 });
      if (Array.isArray(data)) {
        setActivities(data.map(event => formatBackendEvent(event)));
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadLogs();
    setTimeout(() => setLoaded(true), 200);
  }, [loadLogs]);

  // Live updates
  useEffect(() => {
    if (!liveEnabled) return;
    const iv = setInterval(loadLogs, 5000);
    return () => clearInterval(iv);
  }, [liveEnabled, loadLogs]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size > 0) { setSelectedIds(new Set()); }
    else { setSelectedIds(new Set(activities.map(a => a.id))); }
  }, [activities, selectedIds]);

  const filtered = useMemo(() => {
    let list = activities;
    const s = TAB_STATUS[activeTab];
    if (s) list = list.filter(a => a.status === s);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.id.toLowerCase().includes(q) || a.worker.name.toLowerCase().includes(q) || a.task.name.toLowerCase().includes(q) || a.zone.toLowerCase().includes(q) || a.task.category.toLowerCase().includes(q));
    }
    return list;
  }, [activities, activeTab, searchQuery]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: activities.length,
    completed: activities.filter(a => a.status === 'completed').length,
    inProgress: activities.filter(a => a.status === 'in-progress').length,
    flagged: activities.filter(a => a.status === 'flagged').length,
    pending: activities.filter(a => a.status === 'pending').length,
    avgConf: activities.length ? (activities.reduce((s, a) => s + a.confidence, 0) / activities.length).toFixed(1) : '0',
    avgTime: activities.length ? (activities.reduce((s, a) => s + parseFloat(a.procTime), 0) / activities.length).toFixed(1) : '0',
    highConf: activities.filter(a => a.confidence >= 90).length,
  }), [activities]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 40, maxWidth: 1600, margin: '0 auto' }}>

      {/* ═══════════════ HERO HEADER ═══════════════ */}
      <div style={{
        borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 28,
        background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#0f172a 100%)',
        backgroundSize: '200% 200%', animation: 'vpGradient 10s ease infinite',
        padding: '32px 36px 28px',
      }}>
        {/* Decorative */}
        <div style={{ position: 'absolute', top: -50, right: -20, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,.12),transparent 70%)', animation: 'vpFloat 5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '25%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.08),transparent 70%)', animation: 'vpFloat 7s ease-in-out infinite 1.5s' }} />
        <div style={{ position: 'absolute', top: '40%', right: '15%', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.06),transparent 70%)', animation: 'vpFloat 6s ease-in-out infinite 3s' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(14,165,233,.4)', animation: 'vpGlow 3s ease-in-out infinite', position: 'relative' }}>
                <Archive size={24} color="#fff" />
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, border: '2px solid rgba(14,165,233,.2)', animation: 'vpRipple 3s ease-out infinite' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: -.5 }}>Activity Vault</h1>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={12} style={{ color: '#38bdf8' }} />
                  AI-Audited Historical Record Matrix
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#475569' }} />
                  <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'JetBrains Mono,monospace', fontSize: 11 }}>v4.2.1</span>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#475569' }} />
                  <span style={{ color: '#64748b' }}>{activities.length.toLocaleString()} Records</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setLiveEnabled(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${liveEnabled ? 'rgba(34,197,94,.35)' : 'rgba(255,255,255,.1)'}`,
                background: liveEnabled ? 'rgba(34,197,94,.1)' : 'rgba(255,255,255,.04)',
                color: liveEnabled ? '#4ade80' : '#64748b', fontSize: 12, fontWeight: 800, transition: 'all 0.2s',
              }}>
                {liveEnabled ? <Play size={12} /> : <Pause size={12} />}
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: liveEnabled ? '#22c55e' : '#64748b', boxShadow: liveEnabled ? '0 0 10px rgba(34,197,94,.6)' : 'none', animation: liveEnabled ? 'vpPulse 1.5s ease-in-out infinite' : 'none' }} />
                {liveEnabled ? 'LIVE FEED' : 'PAUSED'}
              </button>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, cursor: 'pointer',
                border: '1.5px solid rgba(14,165,233,.3)', background: 'linear-gradient(135deg,rgba(14,165,233,.15),rgba(139,92,246,.1))',
                color: '#38bdf8', fontSize: 12, fontWeight: 800, transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(14,165,233,.25),rgba(139,92,246,.15))'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(14,165,233,.15),rgba(139,92,246,.1))'}>
                <Download size={13} />Export Report
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Total Audits', value: stats.total.toLocaleString(), color: '#38bdf8', Icon: Activity, trend: '+12.4%', trendUp: true, sub: 'All time records' },
              { label: 'High Confidence', value: `${((stats.highConf / stats.total) * 100 || 0).toFixed(1)}%`, color: '#4ade80', Icon: ShieldCheck, trend: '+2.1%', trendUp: true, sub: `${stats.highConf} activities ≥90%` },
              { label: 'Avg Process Time', value: `${stats.avgTime}s`, color: '#fbbf24', Icon: Zap, trend: '-0.3s', trendUp: false, sub: 'Per frame analysis' },
              { label: 'Active Alerts', value: stats.flagged.toString(), color: '#f87171', Icon: AlertCircle, trend: stats.flagged > 5 ? '+3' : '−1', trendUp: stats.flagged > 5, sub: 'Requires attention' },
            ].map(({ label, value, color, Icon, trend, trendUp, sub }) => (
              <div key={label} className="vp-stat-card" style={{
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 8, padding: '20px 22px', backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden',
              }}>
                {/* Mini scan line */}
                <div style={{ position: 'absolute', top: 0, height: 1, width: '30%', background: `linear-gradient(90deg,transparent,${color}60,transparent)`, animation: 'vpScanline 4s ease-in-out infinite', animationDelay: `${Math.random() * 2}s` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}18` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: trendUp ? '#4ade80' : '#38bdf8', background: trendUp ? 'rgba(34,197,94,.12)' : 'rgba(56,189,248,.12)', padding: '3px 8px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3, border: `1px solid ${trendUp ? 'rgba(34,197,94,.2)' : 'rgba(56,189,248,.2)'}` }}>
                    {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{trend}
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

      {/* ═══════════════ INSIGHTS ROW ═══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Donut */}
        <div style={{ background: cardBg, borderRadius: 8, border: `1px solid ${cardBorder}`, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
          <StatusDonut stats={stats} size={120} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 12, width: '100%' }}>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, color: textSecondary }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: v.color, flexShrink: 0 }} />{v.label}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline chart */}
        <div style={{ background: cardBg, borderRadius: 8, border: `1px solid ${cardBorder}`, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} style={{ color: '#0ea5e9' }} />Hourly Activity Timeline</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Events distribution over 24 hours</div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#0ea5e9', background: 'rgba(14,165,233,.06)', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(14,165,233,.12)', fontFamily: 'JetBrains Mono,monospace' }}>TODAY</div>
          </div>
          <TimelineChart />
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            {[{ label: 'Completed', color: '#22c55e' }, { label: 'In Progress', color: '#6366f1' }, { label: 'Flagged', color: '#ef4444' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, color: '#64748b' }}>
                <div style={{ width: 8, height: 4, borderRadius: 2, background: l.color }} />{l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ background: cardBg, borderRadius: 8, border: `1px solid ${cardBorder}`, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={14} style={{ color: '#8b5cf6' }} />Weekly Heatmap</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Event density per hour</div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#8b5cf6', background: 'rgba(139,92,246,.06)', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(139,92,246,.12)', fontFamily: 'JetBrains Mono,monospace' }}>7 DAYS</div>
          </div>
          <HeatmapBlock />
        </div>
      </div>

      {/* ═══════════════ TABLE CARD ═══════════════ */}
      <div style={{ background: cardBg, borderRadius: 8, border: `1px solid ${cardBorder}`, boxShadow: '0 4px 30px rgba(0,0,0,.05)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 500 }}>
            {/* Search */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text" placeholder="Search by ID, worker, task, zone..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 12, fontSize: 13, fontWeight: 600, outline: 'none', color: textPrimary, background: surfaceBg, transition: 'all 0.2s', fontFamily: 'Outfit,sans-serif' }}
                onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                onBlur={e => e.target.style.borderColor = isDark ? '#334155' : '#e2e8f0'}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: cardBg, color: textSecondary, fontSize: 12, fontWeight: 700, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.color = '#0ea5e9'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0'; e.currentTarget.style.color = textSecondary; }}>
              <SlidersHorizontal size={13} />Advanced Filter
            </button>
          </div>

          {/* bulk actions */}
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'vpSlideIn 0.2s ease' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{selectedIds.size} selected</span>
              <button style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9', background: 'rgba(14,165,233,.06)', border: '1px solid rgba(14,165,233,.12)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Mark Complete</button>
              <button style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.12)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Flag</button>
              <button onClick={() => setSelectedIds(new Set())} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            Showing <span style={{ fontWeight: 800, color: '#1e293b', fontFamily: 'JetBrains Mono,monospace' }}>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of <span style={{ fontWeight: 800, color: '#1e293b', fontFamily: 'JetBrains Mono,monospace' }}>{filtered.length}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 28px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'}`, background: surfaceBg2 }}>
          {TABS.map(tab => {
            const active = tab === activeTab;
            const s = TAB_STATUS[tab];
            const cnt = s ? activities.filter(a => a.status === s).length : activities.length;
            const color = TAB_COLORS[tab];
            return (
              <button key={tab} className="vp-tab" data-active={active} onClick={() => setActiveTab(tab)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', cursor: 'pointer',
                border: 'none', background: 'transparent', color: active ? color : '#64748b',
                fontSize: 13, fontWeight: active ? 800 : 600, transition: 'all 0.2s',
              }}>
                {tab}
                <span style={{ background: active ? color : (isDark ? '#334155' : '#e2e8f0'), color: active ? '#fff' : (isDark ? '#94a3b8' : '#94a3b8'), borderRadius: 99, padding: '1px 8px', fontSize: 10, fontWeight: 800, minWidth: 20, textAlign: 'center', boxShadow: active ? `0 2px 8px ${color}30` : 'none', transition: 'all 0.2s' }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* Table header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 28px', background: isDark ? 'linear-gradient(90deg,#1e293b,#111827)' : 'linear-gradient(90deg,#f8fafc,#f1f5f9)', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'}` }}>
          <div style={{ width: 18, flexShrink: 0 }}>
            <div onClick={selectAll} style={{ width: 18, height: 18, borderRadius: 6, cursor: 'pointer', border: `2px solid ${selectedIds.size > 0 ? '#0ea5e9' : '#d1d5db'}`, background: selectedIds.size > 0 ? '#0ea5e9' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {selectedIds.size > 0 && <CheckCircle2 size={11} color="#fff" />}
            </div>
          </div>
          <div style={{ width: 14 }} />
          {[
            { label: 'ID', width: 90 }, { label: 'Worker', width: 170 }, { label: 'Task', flex: 1 },
            { label: 'Location', width: 120 }, { label: 'AI Score', width: 140 }, { label: 'Status', width: 115 },
            { label: 'Duration', width: 60, align: 'center' }, { label: 'Time', width: 70, align: 'right' }, { label: '', width: 30 },
          ].map((col, i) => (
            <div key={i} style={{ width: col.width, flex: col.flex, flexShrink: col.flex ? undefined : 0, fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.3, textAlign: col.align || 'left', fontFamily: 'JetBrains Mono,monospace' }}>{col.label}</div>
          ))}
        </div>

        {/* Rows */}
        <div className="vp-scrollbar" style={{ maxHeight: 680, overflowY: 'auto' }}>
          {paginated.length === 0 ? (
            <div style={{ padding: '60px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>No records found</div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6 }}>Try adjusting your search or filter criteria</div>
            </div>
          ) : (
            paginated.map((act, i) => (
              <ActivityRow key={act.id} act={act} idx={i} onSelect={toggleSelect} isSelected={selectedIds.has(act.id)} />
            ))
          )}
        </div>

        {/* Pagination */}
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: surfaceBg2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600 }}>Page</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: textPrimary, fontFamily: 'JetBrains Mono,monospace' }}>{currentPage}</span>
            <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600 }}>of {totalPages}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? .35 : 1, transition: 'all 0.2s', color: textSecondary }}
              onMouseEnter={e => { if (currentPage > 1) { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.color = '#0ea5e9'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0'; e.currentTarget.style.color = textSecondary; }}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page;
              if (totalPages <= 7) page = i + 1;
              else if (currentPage <= 4) page = i + 1;
              else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
              else page = currentPage - 3 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)} style={{
                  width: 36, height: 36, borderRadius: 10, fontSize: 12, fontWeight: page === currentPage ? 800 : 600,
                  border: page === currentPage ? 'none' : '1.5px solid transparent',
                  background: page === currentPage ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : 'transparent',
                  color: page === currentPage ? '#fff' : '#64748b', cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: page === currentPage ? '0 4px 12px rgba(14,165,233,.3)' : 'none',
                  fontFamily: 'JetBrains Mono,monospace',
                }}
                  onMouseEnter={e => { if (page !== currentPage) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : '#f1f5f9'; }}
                  onMouseLeave={e => { if (page !== currentPage) e.currentTarget.style.background = 'transparent'; }}>
                  {page}
                </button>
              );
            })}
            {totalPages > 7 && currentPage < totalPages - 3 && (
              <>
                <span style={{ padding: '0 4px', color: '#94a3b8', fontWeight: 700 }}>...</span>
                <button onClick={() => setCurrentPage(totalPages)} style={{ width: 36, height: 36, borderRadius: 10, fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace' }}>{totalPages}</button>
              </>
            )}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'default' : 'pointer', opacity: currentPage === totalPages ? .35 : 1, transition: 'all 0.2s', color: textSecondary }}
              onMouseEnter={e => { if (currentPage < totalPages) { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.color = '#0ea5e9'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0'; e.currentTarget.style.color = textSecondary; }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ FOOTER STATUS ═══════════════ */}
      <div style={{
        marginTop: 16, borderRadius: 8, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg,#0f172a,#1e293b)',
        padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(14,165,233,.3),transparent)', backgroundSize: '200% 100%', animation: 'vpShimmer 4s linear infinite' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,.7)', animation: 'vpPulse 1.5s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1.5px solid rgba(34,197,94,.25)', animation: 'vpRipple 2.5s linear infinite' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
            Neural Audit Engine <span style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono,monospace', fontWeight: 800 }}>v4.2.1</span> — Processing <span style={{ color: '#f8fafc', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>{activities.length}</span> records
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: 3, height: 10 + i * 3, borderRadius: 99, background: `rgba(14,165,233,${.15 + i * .18})`, animationName: 'vpPulse', animationDuration: '1s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: `${i * .12}s` }} />
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', background: 'rgba(34,197,94,.1)', padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(34,197,94,.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wifi size={11} />All Systems Operational
          </div>
        </div>
      </div>
    </div>
  );
}
