import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Archive, Activity, Zap, ShieldCheck, AlertCircle, Clock,
  Eye, TrendingUp, ChevronRight, ArrowRight, Cpu, Camera,
  CheckCircle2, XCircle, Loader2, Download, Sparkles,
  BarChart3, Layers, Search, SlidersHorizontal, Play, Pause,
  Radio, Wifi, Shield, Target, Gauge, Bell, RefreshCw,
  Filter, ChevronDown, Maximize2, MoreHorizontal, ArrowUpRight,
  TrendingDown, Users, Lock, Unlock, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════════════
   CSS KEYFRAMES & STYLES
   ═══════════════════════════════════════════════════════════════════════════════ */
const VAULT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');

@keyframes vaultPulse    { 0%,100%{opacity:.5} 50%{opacity:1} }
@keyframes vaultGlow     { 0%,100%{box-shadow:0 0 12px rgba(6,182,212,.25),0 0 30px rgba(6,182,212,.08)} 50%{box-shadow:0 0 24px rgba(6,182,212,.45),0 0 60px rgba(6,182,212,.15)} }
@keyframes vaultSlideIn  { from{opacity:0;transform:translateY(-10px) scale(.99)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes vaultFadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes vaultSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes vaultShimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
@keyframes vaultFloat    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes vaultRipple   { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.8);opacity:0} }
@keyframes vaultScan     { 0%{top:0%} 100%{top:100%} }
@keyframes vaultBeam     { 0%{opacity:0;transform:scaleX(0) translateX(-50%)} 50%{opacity:1} 100%{opacity:0;transform:scaleX(1) translateX(50%)} }
@keyframes vaultCountup  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes vaultDot      { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
@keyframes vaultBorderPulse { 0%,100%{border-color:rgba(6,182,212,.12)} 50%{border-color:rgba(6,182,212,.3)} }
@keyframes vaultOrb      { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-15px) scale(1.05)} 66%{transform:translate(-10px,10px) scale(.95)} 100%{transform:translate(0,0) scale(1)} }
@keyframes vaultLineMove { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes vaultFlash    { 0%,100%{opacity:0} 10%,90%{opacity:1} }
@keyframes vaultGlitch   { 0%,100%{clip-path:inset(0)} 20%{clip-path:inset(10% 0 80% 0)} 40%{clip-path:inset(60% 0 10% 0)} 60%{clip-path:inset(30% 0 50% 0)} 80%{clip-path:inset(80% 0 5% 0)} }

.vault-card {
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1), border-color 0.25s;
}
.vault-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(0,0,0,.1), 0 0 0 1px rgba(6,182,212,.15);
}
.vault-row {
  transition: all 0.2s cubic-bezier(.4,0,.2,1);
  position: relative;
}
.vault-row::after {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,transparent,rgba(6,182,212,.04),transparent);
  opacity:0;
  transition:opacity 0.2s;
  pointer-events:none;
}
.vault-row:hover::after { opacity:1; }
.vault-row:hover .vault-id { color:#06b6d4 !important; }
.vault-row:hover .vault-chevron { color:#06b6d4 !important; transform:translateX(3px); }

.vault-tab-btn {
  position:relative;
  overflow:hidden;
  transition:all 0.2s cubic-bezier(.4,0,.2,1);
}
.vault-tab-btn::before {
  content:'';
  position:absolute;
  bottom:0;left:50%;
  width:0;height:2px;
  background:currentColor;
  transition:all 0.3s cubic-bezier(.4,0,.2,1);
  transform:translateX(-50%);
  border-radius:99px;
}
.vault-tab-btn.active::before { width:60%; }

.vault-scrollbar::-webkit-scrollbar { width:4px; height:4px; }
.vault-scrollbar::-webkit-scrollbar-track { background:transparent; }
.vault-scrollbar::-webkit-scrollbar-thumb { background:rgba(6,182,212,.2); border-radius:99px; }
.vault-scrollbar::-webkit-scrollbar-thumb:hover { background:rgba(6,182,212,.45); }

.vault-input::placeholder { color:rgba(100,116,139,.5); }
.vault-input:focus { outline:none; }

.vault-stat-card {
  cursor:pointer;
  position:relative;
  overflow:hidden;
}
.vault-stat-card::before {
  content:'';
  position:absolute;
  top:0;left:-100%;
  width:60%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent);
  transition:left 0.5s;
}
.vault-stat-card:hover::before { left:150%; }

.vault-notification-dot {
  animation: vaultPulse 1.4s ease-in-out infinite;
}
`;

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
const ZONES = ['ICU-Zone-A','Reception','Perimeter-B','Ward-C','Lab-1','Emergency-B','Hallway-3','Server-Room'];
const TASK_TYPES = [
  { name:'Deep Clean',     category:'cleaning',   icon:'🧹', risk: 'low' },
  { name:'Patrol Check',   category:'patrol',     icon:'🛡️', risk: 'medium' },
  { name:'Equipment Scan', category:'monitor',    icon:'📡', risk: 'low' },
  { name:'Mask Verify',    category:'compliance', icon:'😷', risk: 'medium' },
  { name:'Entry Log',      category:'access',     icon:'🚪', risk: 'high' },
  { name:'Crowd Audit',    category:'monitor',    icon:'👥', risk: 'medium' },
  { name:'Thermal Check',  category:'monitor',    icon:'🌡️', risk: 'low' },
  { name:'Sanitization',   category:'cleaning',   icon:'✨', risk: 'low' },
];
const WORKERS = [
  { name:'Maria Santos', role:'Security Lead', avatar:'MS', color:'#8b5cf6', status:'active' },
  { name:'John Rivera',  role:'AI Operator',   avatar:'JR', color:'#06b6d4', status:'active' },
  { name:'Tom Wilson',   role:'Facility Mgr',  avatar:'TW', color:'#10b981', status:'busy' },
  { name:'Lisa Chen',    role:'Health Tech',   avatar:'LC', color:'#f59e0b', status:'active' },
  { name:'Robert Fox',   role:'Guard',         avatar:'RF', color:'#ef4444', status:'away' },
  { name:'Sarah Miller', role:'Supervisor',    avatar:'SM', color:'#ec4899', status:'active' },
];
const STATUS_META = {
  completed:     { label:'Completed',   color:'#10b981', bg:'rgba(16,185,129,.1)',  glow:'rgba(16,185,129,.3)',  border:'rgba(16,185,129,.2)', icon:CheckCircle2 },
  'in-progress': { label:'In Progress', color:'#6366f1', bg:'rgba(99,102,241,.1)',  glow:'rgba(99,102,241,.3)',  border:'rgba(99,102,241,.2)', icon:Loader2 },
  pending:       { label:'Pending',     color:'#f59e0b', bg:'rgba(245,158,11,.1)',  glow:'rgba(245,158,11,.3)',  border:'rgba(245,158,11,.2)', icon:Clock },
  flagged:       { label:'Flagged',     color:'#ef4444', bg:'rgba(239,68,68,.1)',   glow:'rgba(239,68,68,.3)',   border:'rgba(239,68,68,.2)',  icon:AlertTriangle },
};
const CATEGORY_COLOR = {
  cleaning:'#10b981', patrol:'#06b6d4', monitor:'#8b5cf6', compliance:'#f59e0b', access:'#ec4899',
};
const CATEGORY_ICONS = {
  cleaning: Sparkles, patrol: Shield, monitor: Gauge, compliance: Target, access: Lock,
};

function rand(a,b){ return Math.random()*(b-a)+a; }
function randInt(a,b){ return Math.floor(rand(a,b+1)); }

let globalCounter = 3000;
function makeActivity(i) {
  const worker  = WORKERS[randInt(0,WORKERS.length-1)];
  const task    = TASK_TYPES[randInt(0,TASK_TYPES.length-1)];
  const zone    = ZONES[randInt(0,ZONES.length-1)];
  const sts     = ['completed','completed','completed','in-progress','in-progress','pending','flagged'];
  const status  = sts[randInt(0,sts.length-1)];
  const conf    = status==='completed'?rand(90,99.9):status==='in-progress'?rand(72,91):status==='flagged'?rand(30,68):rand(55,80);
  const ago     = randInt(1,59);
  const id      = i !== undefined ? i : globalCounter++;
  return {
    id:`AV-${3000+id}`,
    worker, task, zone, status,
    camId:`CAM-${randInt(1,24).toString().padStart(2,'0')}`,
    frames:randInt(120,480),
    procTime:rand(1.2,7.8).toFixed(1),
    confidence:parseFloat(conf.toFixed(1)),
    timeAgo:`${ago}m ago`,
    timestamp:new Date(Date.now()-ago*60000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
    sparkline:Array.from({length:12},()=>randInt(20,100)),
    threat: status==='flagged' ? randInt(60,95) : randInt(2,25),
    alerts: status==='flagged' ? randInt(1,3) : 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

// ── Mini Sparkline ──
function Sparkline({ data, color, width=80, height=30 }) {
  const min = Math.min(...data), max = Math.max(...data), range = max-min||1;
  const sy = v => height - ((v-min)/range)*(height-4) - 2;
  const pts = data.map((v,i) => `${(i/(data.length-1))*width},${sy(v)}`).join(' ');
  const area = `0,${height} ${pts} ${width},${height}`;
  const uid = `sp${Math.random().toString(36).slice(2,7)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${uid})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8}
        strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={width} cy={sy(data[data.length-1])} r={2.5} fill={color}/>
      <circle cx={width} cy={sy(data[data.length-1])} r={5} fill={color} opacity={0.2}>
        <animate attributeName="r" values="2.5;6;2.5" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

// ── Confidence Ring ──
function ConfidenceRing({ value, size=44 }) {
  const r = (size-8)/2, c = 2*Math.PI*r;
  const progress = (value/100)*c;
  const color = value>=90?'#10b981':value>=72?'#6366f1':value>=50?'#f59e0b':'#ef4444';
  const uid = `cr${Math.random().toString(36).slice(2,7)}`;
  return (
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'absolute'}}>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color}/>
            <stop offset="100%" stopColor={color} stopOpacity={0.4}/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(15,23,42,.08)" strokeWidth={3.5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#${uid})`} strokeWidth={3.5}
          strokeDasharray={`${progress} ${c}`}
          strokeLinecap="round"
          style={{transition:'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)'}}
          filter={`drop-shadow(0 0 3px ${color}60)`}
        />
      </svg>
      <span style={{fontSize:10,fontWeight:800,color,lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>
        {Math.round(value)}
      </span>
    </div>
  );
}

// ── Status Donut ──
function StatusDonut({ stats, size=130 }) {
  const data = [
    { key:'completed',   value:stats.completed,  color:'#10b981' },
    { key:'in-progress', value:stats.inProgress,  color:'#6366f1' },
    { key:'pending',     value:stats.pending||0,  color:'#f59e0b' },
    { key:'flagged',     value:stats.flagged,     color:'#ef4444' },
  ];
  const total = data.reduce((s,d) => s+d.value,0) || 1;
  const r = (size-18)/2, cx = size/2, cy = size/2, c = 2*Math.PI*r;
  let offset = 0;
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{position:'relative',width:size,height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(15,23,42,.05)" strokeWidth={12}/>
        {data.map((d,i) => {
          const dash = (d.value/total)*c;
          const isH = hovered===d.key;
          const el = (
            <circle key={d.key} cx={cx} cy={cy} r={r} fill="none"
              stroke={d.color} strokeWidth={isH?14:11} strokeLinecap="round"
              strokeDasharray={`${Math.max(0,dash-2)} ${c}`}
              strokeDashoffset={-offset}
              style={{
                transition:'all 0.35s cubic-bezier(.4,0,.2,1)',
                filter:`drop-shadow(0 0 ${isH?8:3}px ${d.color}${isH?'80':'30'})`,
                cursor:'pointer',
              }}
              onMouseEnter={() => setHovered(d.key)}
              onMouseLeave={() => setHovered(null)}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{
        position:'absolute',inset:0,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:2,
      }}>
        <div style={{
          fontSize:26,fontWeight:900,color:'#0f172a',lineHeight:1,
          fontFamily:'JetBrains Mono,monospace',
          transition:'all 0.3s',
        }}>
          {hovered ? data.find(d=>d.key===hovered)?.value ?? total : total}
        </div>
        <div style={{fontSize:8,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1.5}}>
          {hovered ? STATUS_META[hovered]?.label : 'Records'}
        </div>
      </div>
    </div>
  );
}

// ── Heatmap ──
const HOURS = Array.from({length:24},(_,i)=>i);
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function HeatmapBlock() {
  const [cells] = useState(() => DAYS.map(() => HOURS.map(() => randInt(0,100))));
  const [tip, setTip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const intensity = v => {
    if(v>80) return 'rgba(6,182,212,.9)';
    if(v>60) return 'rgba(6,182,212,.65)';
    if(v>40) return 'rgba(6,182,212,.42)';
    if(v>20) return 'rgba(6,182,212,.22)';
    return 'rgba(6,182,212,.07)';
  };

  return (
    <div style={{position:'relative',userSelect:'none'}}>
      <div style={{display:'flex',gap:1.5,marginBottom:4,paddingLeft:28}}>
        {[0,3,6,9,12,15,18,21].map(h => (
          <div key={h} style={{flex:'0 0 calc((100% - 28px) / 8)',fontSize:7.5,color:'#94a3b8',fontWeight:700,textAlign:'center',fontFamily:'JetBrains Mono,monospace'}}>
            {h.toString().padStart(2,'0')}h
          </div>
        ))}
      </div>
      {cells.map((row,di) => (
        <div key={di} style={{
          display:'flex',alignItems:'center',gap:1.5,marginBottom:2,
          opacity:selectedDay!==null&&selectedDay!==di?0.4:1,
          transition:'opacity 0.2s',
          cursor:'pointer',
        }}
          onClick={() => setSelectedDay(selectedDay===di?null:di)}
        >
          <div style={{
            width:24,fontSize:8,color:selectedDay===di?'#06b6d4':'#64748b',
            fontWeight:800,fontFamily:'JetBrains Mono,monospace',transition:'color 0.2s',
          }}>
            {DAYS[di]}
          </div>
          {row.map((v,hi) => (
            <div key={hi}
              onMouseEnter={() => setTip({d:di,h:hi,v})}
              onMouseLeave={() => setTip(null)}
              style={{
                flex:'1 1 0', height:13, background:intensity(v),
                borderRadius:3, cursor:'crosshair',
                transition:'all 0.15s ease',
                transform: tip?.d===di&&tip?.h===hi ? 'scaleY(1.8)' : 'scaleY(1)',
                boxShadow: tip?.d===di&&tip?.h===hi ? `0 0 10px rgba(6,182,212,.5)` : 'none',
              }}
            />
          ))}
        </div>
      ))}
      {tip && (
        <div style={{
          position:'absolute', top:-38, left:'50%', transform:'translateX(-50%)',
          background:'#0f172a', color:'#f8fafc', padding:'5px 12px',
          borderRadius:10, fontSize:10, fontWeight:700, whiteSpace:'nowrap',
          boxShadow:'0 8px 24px rgba(0,0,0,.4)', zIndex:50,
          fontFamily:'JetBrains Mono,monospace',
          border:'1px solid rgba(6,182,212,.25)',
        }}>
          <span style={{color:'#94a3b8'}}>{DAYS[tip.d]}</span>
          <span style={{color:'#06b6d4',margin:'0 4px'}}>{tip.h.toString().padStart(2,'0')}:00</span>
          <span style={{color:'#f8fafc',fontWeight:900}}>{tip.v}</span>
          <span style={{color:'#64748b'}}> events</span>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:8,justifyContent:'flex-end'}}>
        <span style={{fontSize:8,color:'#94a3b8',fontWeight:700}}>Low</span>
        {[.07,.22,.42,.65,.9].map((o,i) => (
          <div key={i} style={{width:12,height:9,background:`rgba(6,182,212,${o})`,borderRadius:3,transition:'transform 0.15s'}}/>
        ))}
        <span style={{fontSize:8,color:'#94a3b8',fontWeight:700}}>High</span>
      </div>
    </div>
  );
}

// ── Category Breakdown ──
function CategoryBreakdown({ activities }) {
  const counts = {};
  activities.forEach(a => { const c=a.task.category; counts[c]=(counts[c]||0)+1; });
  const total = activities.length||1;
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:9}}>
      {entries.map(([cat,cnt]) => {
        const CatIcon = CATEGORY_ICONS[cat]||Activity;
        const col = CATEGORY_COLOR[cat]||'#64748b';
        const isH = hovered===cat;
        const pct = ((cnt/total)*100).toFixed(0);
        return (
          <div key={cat}
            onMouseEnter={()=>setHovered(cat)}
            onMouseLeave={()=>setHovered(null)}
            style={{cursor:'default',transition:'all 0.2s',transform:isH?'translateX(3px)':'none'}}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{
                  width:22,height:22,borderRadius:7,
                  background:`${col}15`,display:'flex',alignItems:'center',justifyContent:'center',
                  border:`1px solid ${col}20`,transition:'all 0.2s',
                  transform:isH?'scale(1.1)':'scale(1)',
                }}>
                  <CatIcon size={11} style={{color:col}}/>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:isH?'#1e293b':'#475569',textTransform:'capitalize',transition:'color 0.2s'}}>{cat}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{fontSize:9,fontWeight:700,color:'#94a3b8'}}>{pct}%</span>
                <span style={{fontSize:11,fontWeight:900,color:col,fontFamily:'JetBrains Mono,monospace'}}>{cnt}</span>
              </div>
            </div>
            <div style={{height:5,background:'rgba(15,23,42,.06)',borderRadius:99,overflow:'hidden',position:'relative'}}>
              <div style={{
                height:'100%',width:`${(cnt/total)*100}%`,
                background:`linear-gradient(90deg,${col},${col}AA)`,
                borderRadius:99,transition:'width 1.2s cubic-bezier(.4,0,.2,1)',
                boxShadow:isH?`0 0 10px ${col}60`:'none',
              }}/>
              {isH && <div style={{
                position:'absolute',inset:0,
                overflow:'hidden',borderRadius:99,
              }}>
                <div style={{
                  position:'absolute',top:0,left:'-100%',width:'60%',height:'100%',
                  background:'linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)',
                  animation:'vaultShimmer 1.2s ease-in-out infinite',
                }}/>
              </div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Threat Badge ──
function ThreatBadge({ level }) {
  const color = level>70?'#ef4444':level>40?'#f59e0b':'#10b981';
  const label = level>70?'HIGH':level>40?'MED':'LOW';
  return (
    <div style={{
      display:'inline-flex',alignItems:'center',gap:3,
      fontSize:8,fontWeight:900,color,
      background:`${color}12`,padding:'2px 7px',borderRadius:99,
      border:`1px solid ${color}20`,
      fontFamily:'JetBrains Mono,monospace',letterSpacing:.8,
    }}>
      <div style={{width:4,height:4,borderRadius:'50%',background:color,
        animation:level>70?'vaultPulse 1s ease-in-out infinite':'none'
      }}/>
      {label}
    </div>
  );
}

// ── Activity Row ──
function ActivityRow({ act, idx, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sm = STATUS_META[act.status];
  const catColor = CATEGORY_COLOR[act.task.category]||'#64748b';
  const StatusIcon = sm.icon;
  const confColor = act.confidence>=90?'#10b981':act.confidence>=72?'#6366f1':act.confidence>=50?'#f59e0b':'#ef4444';

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), idx*45);
    return () => clearTimeout(t);
  }, [idx]);

  return (
    <div style={{
      opacity:mounted?1:0,
      transform:mounted?'none':'translateY(-10px)',
      transition:`opacity 0.4s ease ${idx*0.045}s, transform 0.4s cubic-bezier(.4,0,.2,1) ${idx*0.045}s`,
    }}>
      <div
        className="vault-row"
        onClick={() => setExpanded(e=>!e)}
        style={{
          cursor:'pointer',display:'flex',alignItems:'center',
          padding:'13px 20px',gap:12,
          borderBottom:`1px solid rgba(15,23,42,.04)`,
          background: isNew
            ? 'linear-gradient(90deg,rgba(6,182,212,.05),rgba(99,102,241,.03),transparent)'
            : expanded ? 'rgba(6,182,212,.025)' : 'transparent',
        }}
      >
        {/* New indicator */}
        {isNew && (
          <div style={{
            position:'absolute',left:0,top:0,bottom:0,width:2.5,
            background:'linear-gradient(180deg,#06b6d4,#6366f1)',
            borderRadius:'0 3px 3px 0',
          }}/>
        )}

        {/* Chevron */}
        <div className="vault-chevron" style={{
          color:expanded?'#06b6d4':'#cbd5e1',
          transition:'all 0.25s cubic-bezier(.4,0,.2,1)',
          transform:expanded?'rotate(90deg)':'none',
          flexShrink:0,
        }}>
          <ChevronRight size={13} strokeWidth={2.5}/>
        </div>

        {/* ID */}
        <div style={{width:88,flexShrink:0}}>
          <div className="vault-id" style={{
            fontSize:11,fontWeight:800,
            color:expanded?'#06b6d4':'#475569',
            fontFamily:'JetBrains Mono,monospace',
            transition:'color 0.2s',letterSpacing:-.3,
          }}>
            #{act.id}
          </div>
          {isNew && (
            <div style={{
              marginTop:2,fontSize:6.5,fontWeight:900,color:'#fff',
              background:'linear-gradient(90deg,#06b6d4,#6366f1)',
              padding:'1.5px 6px',borderRadius:99,
              letterSpacing:1.5,textTransform:'uppercase',
              display:'inline-block',
            }}>LIVE</div>
          )}
        </div>

        {/* Worker */}
        <div style={{display:'flex',alignItems:'center',gap:9,width:155,flexShrink:0}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{
              width:34,height:34,borderRadius:11,
              background:`linear-gradient(135deg,${act.worker.color},${act.worker.color}BB)`,
              color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:11,fontWeight:900,
              boxShadow:`0 4px 14px ${act.worker.color}35`,
              fontFamily:'JetBrains Mono,monospace',
            }}>
              {act.worker.avatar}
            </div>
            <div style={{
              position:'absolute',bottom:-1,right:-1,
              width:9,height:9,borderRadius:'50%',
              background:act.worker.status==='active'?'#10b981':act.worker.status==='busy'?'#f59e0b':'#94a3b8',
              border:'2px solid #fff',
            }}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:'#1e293b',lineHeight:1.2}}>{act.worker.name}</div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,marginTop:1}}>{act.worker.role}</div>
          </div>
        </div>

        {/* Task */}
        <div style={{display:'flex',alignItems:'center',gap:8,flex:'1 1 0',minWidth:0}}>
          <div style={{
            width:32,height:32,borderRadius:9,
            background:`${catColor}12`,display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:14,flexShrink:0,border:`1px solid ${catColor}18`,
          }}>
            {act.task.icon}
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:'#334155',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{act.task.name}</div>
            <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
              <div style={{
                fontSize:7.5,fontWeight:800,color:catColor,
                background:`${catColor}10`,padding:'1.5px 7px',borderRadius:99,
                textTransform:'uppercase',letterSpacing:.8,border:`1px solid ${catColor}15`,
              }}>
                {act.task.category}
              </div>
              <ThreatBadge level={act.threat}/>
            </div>
          </div>
        </div>

        {/* Zone */}
        <div style={{width:115,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <Camera size={9} style={{color:'#94a3b8'}}/>
            <span style={{fontSize:11,fontWeight:700,color:'#475569'}}>{act.zone}</span>
          </div>
          <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,marginTop:2,fontFamily:'JetBrains Mono,monospace'}}>
            {act.camId}
          </div>
        </div>

        {/* AI Score */}
        <div style={{display:'flex',alignItems:'center',gap:8,width:130,flexShrink:0}}>
          <ConfidenceRing value={act.confidence} size={40}/>
          <Sparkline data={act.sparkline} color={catColor} width={68} height=  {26}/>
        </div>

        {/* Status */}
        <div style={{width:118,flexShrink:0}}>
          <div style={{
            display:'inline-flex',alignItems:'center',gap:5,
            background:sm.bg,color:sm.color,
            padding:'5px 11px',borderRadius:10,
            fontSize:10,fontWeight:800,letterSpacing:.4,textTransform:'uppercase',
            border:`1px solid ${sm.border}`,
          }}>
            <StatusIcon size={10} style={{animation:act.status==='in-progress'?'vaultSpin 1.5s linear infinite':'none'}}/>
            {sm.label}
          </div>
          {act.alerts > 0 && (
            <div style={{
              marginTop:3,fontSize:8,fontWeight:700,color:'#ef4444',
              display:'flex',alignItems:'center',gap:3,
            }}>
              <Bell size={8}/> {act.alerts} alert{act.alerts>1?'s':''}
            </div>
          )}
        </div>

        {/* Time */}
        <div style={{width:62,flexShrink:0,textAlign:'right'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#334155'}}>{act.timeAgo}</div>
          <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,fontFamily:'JetBrains Mono,monospace',marginTop:1}}>{act.timestamp}</div>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div style={{
          background:'linear-gradient(135deg,rgba(6,182,212,.03),rgba(99,102,241,.025),rgba(236,72,153,.015))',
          borderBottom:'1px solid rgba(6,182,212,.08)',
          padding:'14px 20px 14px 54px',
          display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,
          animation:'vaultSlideIn 0.3s cubic-bezier(.4,0,.2,1)',
        }}>
          {[
            {label:'Frames',      value:act.frames.toLocaleString(), icon:<Eye size={12}/>,    color:'#8b5cf6', sub:'Analyzed'},
            {label:'Latency',     value:`${act.procTime}s`,          icon:<Zap size={12}/>,    color:'#f59e0b', sub:'Process Time'},
            {label:'Confidence',  value:`${act.confidence}%`,        icon:<Cpu size={12}/>,    color:confColor, sub:act.confidence>=90?'Excellent':'Review'},
            {label:'Threat',      value:`${act.threat}%`,            icon:<Shield size={12}/>, color:act.threat>50?'#ef4444':'#10b981', sub:act.threat>50?'Elevated':'Normal'},
            {label:'Camera',      value:act.camId,                   icon:<Camera size={12}/>, color:'#06b6d4', sub:act.zone},
          ].map((d,i) => (
            <div key={i} style={{
              background:'rgba(255,255,255,.85)',borderRadius:13,padding:'11px 13px',
              border:'1px solid rgba(15,23,42,.06)',
              display:'flex',alignItems:'center',gap:9,
              backdropFilter:'blur(10px)',
              transition:'all 0.2s cubic-bezier(.4,0,.2,1)',
              cursor:'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${d.color}18`; e.currentTarget.style.borderColor=`${d.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='rgba(15,23,42,.06)'; }}
            >
              <div style={{
                width:30,height:30,borderRadius:9,
                background:`${d.color}12`,color:d.color,
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                border:`1px solid ${d.color}18`,
              }}>{d.icon}</div>
              <div>
                <div style={{fontSize:7.5,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>{d.label}</div>
                <div style={{fontSize:14,fontWeight:900,color:'#1e293b',lineHeight:1.2,fontFamily:'JetBrains Mono,monospace'}}>{d.value}</div>
                <div style={{fontSize:8,color:d.color,fontWeight:700,marginTop:1}}>{d.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Alert Ticker ──
function AlertTicker({ activities }) {
  const flagged = activities.filter(a => a.status==='flagged');
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!flagged.length) return;
    const t = setInterval(() => setIdx(i => (i+1)%flagged.length), 3000);
    return () => clearInterval(t);
  }, [flagged.length]);

  if (!flagged.length) return null;
  const current = flagged[idx % flagged.length];

  return (
    <div style={{
      display:'flex',alignItems:'center',gap:10,
      padding:'7px 16px',
      background:'linear-gradient(90deg,rgba(239,68,68,.06),rgba(239,68,68,.02),transparent)',
      borderBottom:'1px solid rgba(239,68,68,.1)',
      overflow:'hidden',
    }}>
      <div style={{
        display:'flex',alignItems:'center',gap:5,flexShrink:0,
        fontSize:9,fontWeight:900,color:'#ef4444',
        textTransform:'uppercase',letterSpacing:1.2,
        fontFamily:'JetBrains Mono,monospace',
      }}>
        <AlertTriangle size={10}/>
        ALERT
      </div>
      <div style={{width:1,height:12,background:'rgba(239,68,68,.2)'}}/>
      <div style={{
        fontSize:10,fontWeight:700,color:'#dc2626',
        animation:'vaultFadeUp 0.4s ease-out',
        key:idx,
      }}>
        {current.worker.name} — {current.task.name} at {current.zone} · Threat: {current.threat}%
      </div>
      <div style={{marginLeft:'auto',flexShrink:0,display:'flex',gap:3}}>
        {flagged.map((_,i) => (
          <div key={i} style={{
            width:i===idx?18:5,height:5,borderRadius:99,
            background:i===idx?'#ef4444':'rgba(239,68,68,.2)',
            transition:'all 0.3s ease',cursor:'pointer',
          }} onClick={()=>setIdx(i)}/>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
const TABS = ['All','Completed','In Progress','Flagged','Pending'];
const TAB_STATUS = { All:null, Completed:'completed', 'In Progress':'in-progress', Flagged:'flagged', Pending:'pending' };
const TAB_ICONS = { All:Layers, Completed:CheckCircle2, 'In Progress':Loader2, Flagged:AlertTriangle, Pending:Clock };
const TAB_COLORS = { All:'#06b6d4', Completed:'#10b981', 'In Progress':'#6366f1', Flagged:'#ef4444', Pending:'#f59e0b' };

export default function ActivityVault() {
  const [activities, setActivities] = useState([]);
  const [newIds, setNewIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('All');
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [notification, setNotification] = useState(null);
  const counterRef = useRef(0);
  const notifTimerRef = useRef(null);

  useEffect(() => {
    if (document.getElementById('vault-css')) return;
    const s = document.createElement('style');
    s.id='vault-css'; s.textContent=VAULT_CSS;
    document.head.appendChild(s);
    return () => document.getElementById('vault-css')?.remove();
  }, []);

  useEffect(() => {
    setActivities(Array.from({length:14},(_,i) => makeActivity(i)));
  }, []);

  useEffect(() => {
    if (!liveEnabled) return;
    const iv = setInterval(() => {
      const a = makeActivity();
      setActivities(p => { const n=[a,...p]; if(n.length>50)n.pop(); return n; });
      setNewIds(p => new Set([...p,a.id]));
      setTimeout(() => setNewIds(p => { const n=new Set(p); n.delete(a.id); return n; }), 6000);

      if (a.status==='flagged') {
        clearTimeout(notifTimerRef.current);
        setNotification({ msg:`⚠️ ${a.worker.name} flagged at ${a.zone}`, id:a.id });
        notifTimerRef.current = setTimeout(() => setNotification(null), 4000);
      }
    }, 4000);
    return () => clearInterval(iv);
  }, [liveEnabled]);

  const filtered = useMemo(() => {
    let list = [...activities];
    const status = TAB_STATUS[activeTab];
    if (status) list = list.filter(a => a.status===status);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.worker.name.toLowerCase().includes(q) ||
        a.task.name.toLowerCase().includes(q) ||
        a.zone.toLowerCase().includes(q)
      );
    }
    if (sortBy==='confidence') list.sort((a,b) => b.confidence-a.confidence);
    else if (sortBy==='threat') list.sort((a,b) => b.threat-a.threat);
    return list;
  }, [activities, activeTab, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total:      activities.length,
    completed:  activities.filter(a=>a.status==='completed').length,
    inProgress: activities.filter(a=>a.status==='in-progress').length,
    flagged:    activities.filter(a=>a.status==='flagged').length,
    pending:    activities.filter(a=>a.status==='pending').length,
    avgConf:    activities.length?(activities.reduce((s,a)=>s+a.confidence,0)/activities.length).toFixed(1):'0',
    totalAlerts:activities.reduce((s,a)=>s+a.alerts,0),
  }), [activities]);

  return (
    <div style={{
      borderRadius:24,overflow:'hidden',
      border:'1px solid rgba(6,182,212,.1)',
      boxShadow:'0 8px 48px -12px rgba(0,0,0,.12),0 0 0 1px rgba(255,255,255,.9) inset',
      background:'#fff',
      fontFamily:'Space Grotesk,sans-serif',
      animation:'vaultBorderPulse 5s ease-in-out infinite',
      position:'relative',
    }}>
      {/* Float Notification */}
      {notification && (
        <div style={{
          position:'absolute',top:16,right:16,zIndex:100,
          background:'#0f172a',color:'#f8fafc',
          padding:'10px 16px',borderRadius:13,
          fontSize:11,fontWeight:700,
          boxShadow:'0 12px 36px rgba(0,0,0,.35)',
          border:'1px solid rgba(239,68,68,.3)',
          animation:'vaultFadeUp 0.35s cubic-bezier(.4,0,.2,1)',
          display:'flex',alignItems:'center',gap:8,
          maxWidth:280,
        }}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 8px rgba(239,68,68,.8)',flexShrink:0,animation:'vaultPulse 1s infinite'}}/>
          {notification.msg}
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={{
        padding:'24px 28px 20px',position:'relative',overflow:'hidden',
        background:'linear-gradient(135deg,#020617 0%,#0f172a 40%,#1e293b 100%)',
      }}>
        {/* Background orbs */}
        <div style={{position:'absolute',top:-40,right:-20,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,.12),transparent 65%)',animation:'vaultOrb 8s ease-in-out infinite'}}/>
        <div style={{position:'absolute',bottom:-60,left:'25%',width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.08),transparent 65%)',animation:'vaultOrb 10s ease-in-out infinite 2s'}}/>
        <div style={{position:'absolute',top:'30%',left:'60%',width:120,height:120,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,.06),transparent 65%)',animation:'vaultOrb 7s ease-in-out infinite 1s'}}/>

        {/* Scan line */}
        <div style={{
          position:'absolute',left:0,width:'100%',height:1,zIndex:2,
          background:'linear-gradient(90deg,transparent,rgba(6,182,212,.5),transparent)',
          animation:'vaultScan 4s linear infinite',
          opacity:.5,
        }}/>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap',position:'relative',zIndex:3}}>
          {/* Brand */}
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{
              width:46,height:46,borderRadius:14,
              background:'linear-gradient(135deg,#06b6d4,#6366f1)',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 8px 24px rgba(6,182,212,.4)',
              animation:'vaultGlow 4s ease-in-out infinite',
              position:'relative',
            }}>
              <Archive size={20} color="#fff"/>
              <div style={{position:'absolute',inset:0,borderRadius:14,border:'1.5px solid rgba(6,182,212,.4)',animation:'vaultRipple 3s ease-out infinite'}}/>
            </div>
            <div>
              <h3 style={{fontSize:19,fontWeight:800,color:'#f8fafc',margin:0,letterSpacing:-.4,lineHeight:1.2}}>
                Activity Vault
              </h3>
              <div style={{fontSize:10.5,color:'#475569',fontWeight:600,marginTop:3,display:'flex',alignItems:'center',gap:6}}>
                <Radio size={9} style={{color:'#22d3ee'}}/>
                AI-Audited Operational Matrix
                <span style={{width:3,height:3,borderRadius:'50%',background:'#334155'}}/>
                <span style={{color:'#22d3ee',fontWeight:800,fontFamily:'JetBrains Mono,monospace',fontSize:10}}>v5.0</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            {/* Search */}
            <div style={{
              display:'flex',alignItems:'center',gap:7,
              padding:'8px 13px',borderRadius:11,
              background:'rgba(255,255,255,.05)',
              border:'1px solid rgba(255,255,255,.08)',
              transition:'all 0.2s',
            }}
              onFocus={e=>e.currentTarget.style.borderColor='rgba(6,182,212,.35)'}
              onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.08)'}
            >
              <Search size={12} style={{color:'#475569',flexShrink:0}}/>
              <input
                className="vault-input"
                type="text" placeholder="Search records…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background:'transparent',border:'none',outline:'none',
                  color:'#f8fafc',fontSize:11,fontWeight:600,width:130,
                  fontFamily:'Space Grotesk,sans-serif',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{
                  background:'none',border:'none',cursor:'pointer',
                  color:'#475569',padding:0,lineHeight:1,transition:'color 0.2s',
                }}
                  onMouseEnter={e=>e.currentTarget.style.color='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.color='#475569'}
                >
                  <XCircle size={11}/>
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div style={{position:'relative'}}>
              <button
                onClick={() => setShowFilter(v=>!v)}
                style={{
                  display:'flex',alignItems:'center',gap:6,
                  padding:'8px 13px',borderRadius:11,cursor:'pointer',
                  border:`1px solid ${showFilter?'rgba(6,182,212,.4)':'rgba(255,255,255,.08)'}`,
                  background:showFilter?'rgba(6,182,212,.1)':'rgba(255,255,255,.04)',
                  color:showFilter?'#22d3ee':'#64748b',
                  fontSize:11,fontWeight:700,transition:'all 0.2s',
                }}>
                <SlidersHorizontal size={11}/>
                Sort
                <ChevronDown size={10} style={{transition:'transform 0.2s',transform:showFilter?'rotate(180deg)':'none'}}/>
              </button>
              {showFilter && (
                <div style={{
                  position:'absolute',top:'calc(100% + 6px)',right:0,
                  background:'#0f172a',borderRadius:13,
                  border:'1px solid rgba(6,182,212,.2)',
                  boxShadow:'0 16px 40px rgba(0,0,0,.4)',
                  zIndex:50,overflow:'hidden',minWidth:160,
                  animation:'vaultSlideIn 0.2s ease-out',
                }}>
                  {[
                    {key:'newest',label:'Newest First'},
                    {key:'confidence',label:'By Confidence'},
                    {key:'threat',label:'By Threat Level'},
                  ].map(opt => (
                    <button key={opt.key}
                      onClick={() => { setSortBy(opt.key); setShowFilter(false); }}
                      style={{
                        display:'block',width:'100%',textAlign:'left',
                        padding:'10px 16px',background:'none',border:'none',cursor:'pointer',
                        fontSize:11,fontWeight:700,transition:'all 0.15s',
                        color:sortBy===opt.key?'#22d3ee':'#94a3b8',
                        background:sortBy===opt.key?'rgba(6,182,212,.08)':'none',
                      }}
                      onMouseEnter={e=>{ if(sortBy!==opt.key){e.currentTarget.style.background='rgba(255,255,255,.04)';e.currentTarget.style.color='#f8fafc';}}}
                      onMouseLeave={e=>{ if(sortBy!==opt.key){e.currentTarget.style.background='none';e.currentTarget.style.color='#94a3b8';}}}
                    >
                      {sortBy===opt.key && <span style={{color:'#06b6d4',marginRight:6}}>✓</span>}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live toggle */}
            <button onClick={() => setLiveEnabled(v=>!v)} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'8px 14px',borderRadius:11,cursor:'pointer',
              border:`1px solid ${liveEnabled?'rgba(16,185,129,.3)':'rgba(255,255,255,.08)'}`,
              background:liveEnabled?'rgba(16,185,129,.1)':'rgba(255,255,255,.04)',
              color:liveEnabled?'#4ade80':'#64748b',
              fontSize:11,fontWeight:800,transition:'all 0.2s',
            }}>
              {liveEnabled?<Pause size={10}/>:<Play size={10}/>}
              <div style={{
                width:7,height:7,borderRadius:'50%',
                background:liveEnabled?'#22c55e':'#64748b',
                boxShadow:liveEnabled?'0 0 10px rgba(34,197,94,.7)':'none',
                animation:liveEnabled?'vaultPulse 1.5s ease-in-out infinite':'none',
              }}/>
              {liveEnabled?'LIVE':'PAUSED'}
            </button>

            {/* Alerts badge */}
            {stats.totalAlerts > 0 && (
              <div style={{
                display:'flex',alignItems:'center',gap:5,
                padding:'8px 13px',borderRadius:11,
                background:'rgba(239,68,68,.1)',
                border:'1px solid rgba(239,68,68,.25)',
                fontSize:11,fontWeight:800,color:'#f87171',
              }}>
                <Bell size={11}/>
                {stats.totalAlerts}
                <div className="vault-notification-dot" style={{
                  width:6,height:6,borderRadius:'50%',background:'#ef4444',
                }}/>
              </div>
            )}

            {/* View full */}
            <Link to="/activity-vault" style={{
              display:'flex',alignItems:'center',gap:5,
              padding:'8px 14px',borderRadius:11,cursor:'pointer',
              border:'1px solid rgba(255,255,255,.08)',
              background:'rgba(255,255,255,.04)',
              color:'#64748b',fontSize:11,fontWeight:700,
              textDecoration:'none',transition:'all 0.2s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(6,182,212,.35)';e.currentTarget.style.color='#22d3ee';e.currentTarget.style.background='rgba(6,182,212,.08)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.08)';e.currentTarget.style.color='#64748b';e.currentTarget.style.background='rgba(255,255,255,.04)';}}
            >
              <Maximize2 size={10}/>
              Full Vault
            </Link>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginTop:20,position:'relative',zIndex:3}}>
          {[
            {label:'Total Records', value:stats.total,        color:'#22d3ee', Icon:Activity,     sub:'All entries',   trend:'+12%',  up:true},
            {label:'Completed',     value:stats.completed,    color:'#4ade80', Icon:CheckCircle2, sub:'Success rate',  trend:'+8%',   up:true},
            {label:'In Progress',   value:stats.inProgress,   color:'#818cf8', Icon:Loader2,      sub:'Active tasks',  trend:null,    up:null},
            {label:'Flagged',       value:stats.flagged,      color:'#f87171', Icon:AlertTriangle,sub:'Need attention',trend:stats.flagged>3?`${stats.flagged} critical`:'-2%',up:false},
            {label:'Avg Confidence',value:`${stats.avgConf}%`,color:'#fbbf24', Icon:ShieldCheck,  sub:'AI accuracy',   trend:'+0.3%', up:true},
          ].map(({label,value,color,Icon,sub,trend,up}) => (
            <div key={label}
              className="vault-stat-card vault-card"
              style={{
                background:'rgba(255,255,255,.04)',
                border:'1px solid rgba(255,255,255,.06)',
                borderRadius:16,padding:'14px 15px',
                backdropFilter:'blur(10px)',
              }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{
                  width:32,height:32,borderRadius:10,
                  background:`${color}18`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  border:`1px solid ${color}20`,
                }}>
                  <Icon size={14} style={{color,animation:label==='In Progress'?'vaultSpin 2s linear infinite':'none'}}/>
                </div>
                {trend && (
                  <div style={{
                    display:'flex',alignItems:'center',gap:3,
                    fontSize:9,fontWeight:800,
                    color:up===null?'#64748b':up?'#4ade80':'#f87171',
                  }}>
                    {up!==null&&(up?<TrendingUp size={9}/>:<TrendingDown size={9}/>)}
                    {trend}
                  </div>
                )}
              </div>
              <div style={{fontSize:22,fontWeight:900,color:'#f8fafc',lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>{value}</div>
              <div style={{fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:.9,marginTop:4}}>{label}</div>
              <div style={{fontSize:9,color:'#334155',fontWeight:600,marginTop:1}}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ALERT TICKER ═══ */}
      <AlertTicker activities={activities}/>

      {/* ═══ TABS ═══ */}
      <div style={{
        display:'flex',alignItems:'center',gap:2,
        padding:'10px 20px',
        borderBottom:'1px solid rgba(15,23,42,.05)',
        background:'rgba(248,250,252,.9)',
        backdropFilter:'blur(10px)',
        overflowX:'auto',
      }}>
        {TABS.map(tab => {
          const active = tab===activeTab;
          const s = TAB_STATUS[tab];
          const cnt = s ? activities.filter(a=>a.status===s).length : activities.length;
          const color = TAB_COLORS[tab];
          const TabIcon = TAB_ICONS[tab];
          return (
            <button key={tab}
              className={`vault-tab-btn${active?' active':''}`}
              onClick={() => setActiveTab(tab)}
              style={{
                display:'flex',alignItems:'center',gap:6,
                padding:'7px 15px',borderRadius:10,cursor:'pointer',
                border:active?`1px solid ${color}25`:'1px solid transparent',
                background:active?`${color}08`:'transparent',
                color:active?color:'#64748b',
                fontSize:12,fontWeight:active?800:600,
                transition:'all 0.2s',whiteSpace:'nowrap',
              }}>
              <TabIcon size={12} style={{animation:active&&tab==='In Progress'?'vaultSpin 2s linear infinite':'none'}}/>
              {tab}
              <span style={{
                background:active?color:'#e2e8f0',color:active?'#fff':'#94a3b8',
                borderRadius:99,padding:'1px 8px',fontSize:9,fontWeight:900,
                minWidth:20,textAlign:'center',
                boxShadow:active?`0 2px 10px ${color}35`:'none',
                transition:'all 0.2s',
              }}>{cnt}</span>
            </button>
          );
        })}

        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <button style={{
            display:'flex',alignItems:'center',gap:4,
            padding:'6px 12px',borderRadius:9,cursor:'pointer',
            border:'1px solid #e2e8f0',background:'#fff',
            color:'#64748b',fontSize:11,fontWeight:700,transition:'all 0.2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#06b6d4';e.currentTarget.style.color='#06b6d4';e.currentTarget.style.background='rgba(6,182,212,.04)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#64748b';e.currentTarget.style.background='#fff';}}
          >
            <Download size={11}/> Export
          </button>
        </div>
      </div>

      {/* ═══ TABLE HEADER ═══ */}
      <div style={{
        display:'flex',alignItems:'center',gap:12,
        padding:'8px 20px',
        background:'linear-gradient(90deg,#f8fafc,#f1f5f9)',
        borderBottom:'1px solid rgba(15,23,42,.04)',
      }}>
        <div style={{width:13}}/>
        {[
          {label:'ID',         width:88},
          {label:'Worker',     width:155},
          {label:'Task',       flex:1},
          {label:'Zone',       width:115},
          {label:'AI Score',   width:130},
          {label:'Status',     width:118},
          {label:'Time',       width:62,align:'right'},
        ].map((col,i) => (
          <div key={i} style={{
            width:col.width,flex:col.flex||undefined,flexShrink:col.flex?undefined:0,
            fontSize:8.5,fontWeight:800,color:'#94a3b8',
            textTransform:'uppercase',letterSpacing:1.3,
            textAlign:col.align||'left',
            fontFamily:'JetBrains Mono,monospace',
          }}>{col.label}</div>
        ))}
      </div>

      {/* ═══ ROWS ═══ */}
      <div className="vault-scrollbar" style={{maxHeight:440,overflowY:'auto',scrollbarWidth:'thin'}}>
        {filtered.length===0 ? (
          <div style={{padding:'56px 24px',textAlign:'center'}}>
            <div style={{fontSize:36,marginBottom:10,opacity:.3}}>🔍</div>
            <div style={{fontSize:13,fontWeight:800,color:'#94a3b8'}}>No records found</div>
            <div style={{fontSize:11,color:'#cbd5e1',marginTop:4,fontWeight:600}}>Try adjusting your search or filter</div>
          </div>
        ) : (
          filtered.slice(0,15).map((act,i) => (
            <ActivityRow key={act.id} act={act} idx={i} isNew={newIds.has(act.id)}/>
          ))
        )}
      </div>

      {/* ═══ INSIGHTS PANEL ═══ */}
      <div style={{
        borderTop:'1px solid rgba(15,23,42,.05)',
        display:'grid',gridTemplateColumns:'auto 1fr 230px',
        background:'linear-gradient(135deg,#f8fafc,#f1f5f9)',
      }}>
        {/* Donut */}
        <div style={{padding:'22px 26px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRight:'1px solid rgba(15,23,42,.04)'}}>
          <StatusDonut stats={stats} size={120}/>
          <div style={{fontSize:9.5,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1.2,marginTop:10}}>Distribution</div>
          <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap',justifyContent:'center'}}>
            {Object.entries(STATUS_META).map(([k,v]) => (
              <div key={k} style={{display:'flex',alignItems:'center',gap:4,fontSize:8.5,fontWeight:700,color:'#475569'}}>
                <div style={{width:7,height:7,borderRadius:2,background:v.color}}/>
                {v.label}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div style={{padding:'20px 24px',borderRight:'1px solid rgba(15,23,42,.04)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#1e293b',display:'flex',alignItems:'center',gap:6}}>
                <BarChart3 size={13} style={{color:'#06b6d4'}}/>
                Weekly Heatmap
              </div>
              <div style={{fontSize:9.5,color:'#94a3b8',fontWeight:600,marginTop:2}}>Event density — click to isolate day</div>
            </div>
            <div style={{
              fontSize:9,fontWeight:800,color:'#06b6d4',
              background:'rgba(6,182,212,.06)',padding:'4px 10px',borderRadius:99,
              border:'1px solid rgba(6,182,212,.12)',
              fontFamily:'JetBrains Mono,monospace',
            }}>7 DAYS</div>
          </div>
          <HeatmapBlock/>
        </div>

        {/* Categories */}
        <div style={{padding:'20px 20px'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#1e293b',marginBottom:2,display:'flex',alignItems:'center',gap:6}}>
            <Layers size={13} style={{color:'#8b5cf6'}}/>
            Categories
          </div>
          <div style={{fontSize:9.5,color:'#94a3b8',fontWeight:600,marginBottom:13}}>Task distribution</div>
          <CategoryBreakdown activities={activities}/>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{
        padding:'14px 24px',position:'relative',overflow:'hidden',
        background:'linear-gradient(135deg,#020617 0%,#0f172a 100%)',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <div style={{
          position:'absolute',left:0,top:0,width:'100%',height:1,
          background:'linear-gradient(90deg,transparent,rgba(6,182,212,.45),rgba(99,102,241,.3),transparent)',
          backgroundSize:'200% 100%',animation:'vaultLineMove 3s linear infinite',
        }}/>

        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{position:'relative'}}>
            <div style={{
              width:8,height:8,borderRadius:'50%',background:'#22c55e',
              boxShadow:'0 0 12px rgba(34,197,94,.9)',
              animation:'vaultPulse 1.5s ease-in-out infinite',
            }}/>
            <div style={{position:'absolute',inset:-3,borderRadius:'50%',border:'1.5px solid rgba(34,197,94,.3)',animation:'vaultRipple 2.2s linear infinite'}}/>
          </div>
          <span style={{fontSize:11,fontWeight:700,color:'#64748b',fontFamily:'Space Grotesk,sans-serif'}}>
            Showing{' '}
            <span style={{color:'#f8fafc',fontWeight:900,fontFamily:'JetBrains Mono,monospace'}}>{Math.min(filtered.length,15)}</span>
            {' '}of{' '}
            <span style={{color:'#f8fafc',fontWeight:900,fontFamily:'JetBrains Mono,monospace'}}>{filtered.length}</span>
            {' '}records
          </span>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            {[...Array(5)].map((_,i) => (
              <div key={i} style={{
                width:2.5,height:10+i*3,borderRadius:99,
                background:`rgba(6,182,212,${0.15+i*0.17})`,
                animation:'vaultPulse 1s ease-in-out infinite',
                animationDelay:`${i*0.12}s`,
              }}/>
            ))}
          </div>
          <span style={{
            fontSize:10,fontWeight:700,color:'#334155',
            textTransform:'uppercase',letterSpacing:1.3,
            fontFamily:'JetBrains Mono,monospace',
          }}>
            Neural Audit Engine
          </span>
          <div style={{
            fontSize:10,fontWeight:800,color:'#4ade80',
            background:'rgba(34,197,94,.1)',padding:'4px 12px',
            borderRadius:99,border:'1px solid rgba(34,197,94,.2)',
            display:'flex',alignItems:'center',gap:5,
          }}>
            <Wifi size={10}/>
            All Nodes Online
          </div>
        </div>
      </div>
    </div>
  );
}
