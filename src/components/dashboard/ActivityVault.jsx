import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Archive, Activity, Zap, ShieldCheck, AlertCircle, Clock,
  Eye, TrendingUp, ChevronRight, ArrowRight, Cpu, Camera,
  CheckCircle2, XCircle, Loader2, Download, Sparkles,
  BarChart3, Layers, Search, SlidersHorizontal, Play, Pause,
  Radio, Wifi, Shield, Target, Gauge
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════════════
   CSS KEYFRAMES — injected once
   ═══════════════════════════════════════════════════════════════════════════════ */
const VAULT_CSS = `
@keyframes vaultPulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
@keyframes vaultGlow    { 0%,100%{box-shadow:0 0 8px rgba(14,165,233,.3)} 50%{box-shadow:0 0 20px rgba(14,165,233,.5)} }
@keyframes vaultSlideIn { from{opacity:0;transform:translateY(-12px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes vaultExpand  { from{opacity:0;max-height:0;padding-top:0;padding-bottom:0} to{opacity:1;max-height:200px;padding-top:14px;padding-bottom:14px} }
@keyframes vaultSpin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes vaultShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes vaultFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes vaultRipple  { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.5);opacity:0} }
@keyframes vaultGradient{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes vaultDash    { to{stroke-dashoffset:0} }
@keyframes vaultBorderGlow {
  0%,100%{border-color:rgba(14,165,233,.15)}
  50%{border-color:rgba(14,165,233,.35)}
}
.vault-row:hover { background:linear-gradient(90deg,rgba(14,165,233,.03),rgba(139,92,246,.02),transparent) !important; }
.vault-row:hover .vault-id { color:#0ea5e9 !important; text-shadow:0 0 10px rgba(14,165,233,.3); }
.vault-row:hover .vault-expand { color:#0ea5e9 !important; transform:translateX(2px); }
.vault-scrollbar::-webkit-scrollbar { width:4px; }
.vault-scrollbar::-webkit-scrollbar-track { background:transparent; }
.vault-scrollbar::-webkit-scrollbar-thumb { background:rgba(14,165,233,.2); border-radius:99px; }
.vault-scrollbar::-webkit-scrollbar-thumb:hover { background:rgba(14,165,233,.4); }
`;

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA GENERATORS
   ═══════════════════════════════════════════════════════════════════════════════ */
const ZONES = ['ICU-Zone-A','Reception','Perimeter-B','Ward-C','Lab-1','Emergency-B','Hallway-3','Server-Room'];
const TASK_TYPES = [
  { name:'Deep Clean',     category:'cleaning',   icon:'🧹' },
  { name:'Patrol Check',   category:'patrol',     icon:'🛡️' },
  { name:'Equipment Scan', category:'monitor',    icon:'📡' },
  { name:'Mask Verify',    category:'compliance', icon:'😷' },
  { name:'Entry Log',      category:'access',     icon:'🚪' },
  { name:'Crowd Audit',    category:'monitor',    icon:'👥' },
  { name:'Thermal Check',  category:'monitor',    icon:'🌡️' },
  { name:'Sanitization',   category:'cleaning',   icon:'✨' },
];
const WORKERS = [
  { name:'Maria Santos', role:'Security Lead', avatar:'MS', color:'#8b5cf6' },
  { name:'John Rivera',  role:'AI Operator',   avatar:'JR', color:'#0ea5e9' },
  { name:'Tom Wilson',   role:'Facility Mgr',  avatar:'TW', color:'#22c55e' },
  { name:'Lisa Chen',    role:'Health Tech',    avatar:'LC', color:'#f59e0b' },
  { name:'Robert Fox',   role:'Guard',         avatar:'RF', color:'#ef4444' },
  { name:'Sarah Miller', role:'Supervisor',    avatar:'SM', color:'#ec4899' },
];
const STATUS_META = {
  completed:     { label:'Completed',   color:'#22c55e', bg:'rgba(34,197,94,.08)',   glow:'rgba(34,197,94,.25)',  icon:CheckCircle2 },
  'in-progress': { label:'In Progress', color:'#6366f1', bg:'rgba(99,102,241,.08)',  glow:'rgba(99,102,241,.25)', icon:Loader2 },
  pending:       { label:'Pending',     color:'#f59e0b', bg:'rgba(245,158,11,.08)',  glow:'rgba(245,158,11,.25)', icon:Clock },
  flagged:       { label:'Flagged',     color:'#ef4444', bg:'rgba(239,68,68,.08)',   glow:'rgba(239,68,68,.25)',  icon:XCircle },
};
const CATEGORY_COLOR = {
  cleaning:'#22c55e', patrol:'#0ea5e9', monitor:'#8b5cf6', compliance:'#f59e0b', access:'#ec4899',
};
const CATEGORY_ICONS = {
  cleaning: Sparkles, patrol: Shield, monitor: Gauge, compliance: Target, access: Layers,
};

function rand(a,b){ return Math.random()*(b-a)+a; }
function randInt(a,b){ return Math.floor(rand(a,b+1)); }

function makeActivity(i, now=Date.now()) {
  const worker  = WORKERS[randInt(0,WORKERS.length-1)];
  const task    = TASK_TYPES[randInt(0,TASK_TYPES.length-1)];
  const zone    = ZONES[randInt(0,ZONES.length-1)];
  const sts     = ['completed','completed','completed','in-progress','in-progress','pending','flagged'];
  const status  = sts[randInt(0,sts.length-1)];
  const conf    = status==='completed'?rand(90,99.9):status==='in-progress'?rand(72,91):status==='flagged'?rand(30,68):rand(55,80);
  const ago     = randInt(1,59);
  return {
    id:`AV-${(3000+(i??randInt(0,999)))}`,
    worker, task, zone, status,
    camId:`CAM-${randInt(1,24).toString().padStart(2,'0')}`,
    frames:randInt(120,480),
    procTime:rand(1.2,7.8).toFixed(1),
    confidence:parseFloat(conf.toFixed(1)),
    timeAgo:`${ago}m ago`,
    timestamp:new Date(now-ago*60000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
    sparkline:Array.from({length:10},()=>randInt(30,100)),
    threat: status==='flagged' ? randInt(60,95) : randInt(2,25),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

// ── Animated Sparkline with gradient fill ──
function Sparkline({ data, color, width=72, height=28 }) {
  const min = Math.min(...data), max = Math.max(...data), range = max-min||1;
  const sy = v => height - ((v-min)/range)*height;
  const linePoints = data.map((v,i) => `${(i/(data.length-1))*width},${sy(v)}`).join(' ');
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;
  const uid = `sp-${Math.random().toString(36).slice(2,8)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
          <stop offset="100%" stopColor={color} stopOpacity={0.02}/>
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${uid})`}/>
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={width} cy={sy(data[data.length-1])} r={2.5} fill={color}/>
      <circle cx={width} cy={sy(data[data.length-1])} r={5} fill={color} opacity={0.15}>
        <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

// ── Premium Confidence Ring ──
function ConfidenceRing({ value, size=42 }) {
  const r = (size-8)/2, c = 2*Math.PI*r;
  const progress = (value/100)*c;
  const color = value>=90?'#22c55e':value>=72?'#6366f1':value>=50?'#f59e0b':'#ef4444';
  const uid = `cr-${Math.random().toString(36).slice(2,8)}`;
  return (
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'absolute'}}>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color}/>
            <stop offset="100%" stopColor={color} stopOpacity={0.5}/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,.05)" strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#${uid})`} strokeWidth={3}
          strokeDasharray={`${progress} ${c}`}
          strokeLinecap="round"
          style={{transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)'}}
        />
      </svg>
      <span style={{fontSize:10,fontWeight:900,color,lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>
        {Math.round(value)}
      </span>
    </div>
  );
}

// ── Donut Chart for status distribution ──
function StatusDonut({ stats, size=120 }) {
  const data = [
    { key:'completed',   value:stats.completed,  color:'#22c55e' },
    { key:'in-progress', value:stats.inProgress,  color:'#6366f1' },
    { key:'pending',     value:stats.pending || 0, color:'#f59e0b' },
    { key:'flagged',     value:stats.flagged,     color:'#ef4444' },
  ];
  const total = data.reduce((s,d) => s+d.value, 0) || 1;
  const r = (size-16)/2, cx = size/2, cy = size/2, c = 2*Math.PI*r;
  let offset = 0;
  return (
    <div style={{position:'relative',width:size,height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,.04)" strokeWidth={10}/>
        {data.map((d,i) => {
          const dash = (d.value/total)*c;
          const el = (
            <circle key={d.key} cx={cx} cy={cy} r={r} fill="none"
              stroke={d.color} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={`${Math.max(0,dash-3)} ${c}`}
              strokeDashoffset={-offset}
              style={{transition:'all 1s ease',filter:`drop-shadow(0 0 4px ${d.color}40)`}}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{
        position:'absolute',inset:0,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',
      }}>
        <div style={{fontSize:22,fontWeight:900,color:'#0f172a',lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>
          {total}
        </div>
        <div style={{fontSize:8,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1.2,marginTop:2}}>
          Records
        </div>
      </div>
    </div>
  );
}

// ── Heatmap ──
const HEATMAP_HOURS = Array.from({length:24},(_,i)=>i);
const HEATMAP_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function HeatmapBlock() {
  const [cells] = useState(() =>
    HEATMAP_DAYS.map(() => HEATMAP_HOURS.map(() => randInt(0,100)))
  );
  const [tip, setTip] = useState(null);
  const intensity = v => {
    if(v>80) return 'rgba(14,165,233,.85)';
    if(v>60) return 'rgba(14,165,233,.6)';
    if(v>40) return 'rgba(14,165,233,.4)';
    if(v>20) return 'rgba(14,165,233,.2)';
    return 'rgba(14,165,233,.06)';
  };
  return (
    <div style={{position:'relative'}}>
      <div style={{display:'flex',gap:1,marginBottom:3,paddingLeft:26}}>
        {[0,4,8,12,16,20].map(h=>(
          <div key={h} style={{flex:'1 1 0',fontSize:8,color:'#94a3b8',fontWeight:700,textAlign:'center',fontFamily:'JetBrains Mono,monospace'}}>
            {h.toString().padStart(2,'0')}
          </div>
        ))}
      </div>
      {cells.map((row,di)=>(
        <div key={di} style={{display:'flex',alignItems:'center',gap:1,marginBottom:1}}>
          <div style={{width:22,fontSize:8,color:'#64748b',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{HEATMAP_DAYS[di]}</div>
          {row.map((v,hi)=>(
            <div key={hi}
              onMouseEnter={()=>setTip({d:di,h:hi,v})}
              onMouseLeave={()=>setTip(null)}
              style={{
                flex:'1 1 0', height:12, background:intensity(v),
                borderRadius:2.5, cursor:'crosshair',
                transition:'all 0.15s ease',
                transform: tip?.d===di&&tip?.h===hi ? 'scaleY(1.6)' : 'scaleY(1)',
                boxShadow: tip?.d===di&&tip?.h===hi ? `0 0 8px ${intensity(v)}` : 'none',
              }}
            />
          ))}
        </div>
      ))}
      {tip && (
        <div style={{
          position:'absolute', top:-32, left:'50%', transform:'translateX(-50%)',
          background:'#0f172a', color:'#f8fafc', padding:'4px 10px',
          borderRadius:8, fontSize:10, fontWeight:700, whiteSpace:'nowrap',
          boxShadow:'0 4px 16px rgba(0,0,0,.3)', zIndex:10,
          fontFamily:'JetBrains Mono,monospace',
          border:'1px solid rgba(14,165,233,.3)',
        }}>
          {HEATMAP_DAYS[tip.d]} {tip.h.toString().padStart(2,'0')}:00 — <span style={{color:'#38bdf8'}}>{tip.v} events</span>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:3,marginTop:6,justifyContent:'flex-end'}}>
        <span style={{fontSize:8,color:'#94a3b8',fontWeight:700}}>Less</span>
        {[.06,.2,.4,.6,.85].map((o,i)=>(
          <div key={i} style={{width:10,height:8,background:`rgba(14,165,233,${o})`,borderRadius:2}}/>
        ))}
        <span style={{fontSize:8,color:'#94a3b8',fontWeight:700}}>More</span>
      </div>
    </div>
  );
}

// ── Category Breakdown with interactive bars ──
function CategoryBreakdown({ activities }) {
  const counts = {};
  activities.forEach(a => { const c = a.task.category; counts[c] = (counts[c]||0)+1; });
  const total = activities.length || 1;
  const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {entries.map(([cat,cnt]) => {
        const CatIcon = CATEGORY_ICONS[cat] || Activity;
        const isH = hovered === cat;
        return (
          <div key={cat} onMouseEnter={()=>setHovered(cat)} onMouseLeave={()=>setHovered(null)}
            style={{cursor:'default',transition:'all 0.2s',
              transform:isH?'translateX(2px)':'none',
            }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                <CatIcon size={11} style={{color:CATEGORY_COLOR[cat]||'#64748b'}}/>
                <span style={{fontSize:11,fontWeight:700,color:isH?'#1e293b':'#475569',textTransform:'capitalize',transition:'color 0.2s'}}>{cat}</span>
              </div>
              <span style={{fontSize:11,fontWeight:900,color:CATEGORY_COLOR[cat]||'#64748b',fontFamily:'JetBrains Mono,monospace'}}>{cnt}</span>
            </div>
            <div style={{height:6,background:'rgba(0,0,0,.04)',borderRadius:99,overflow:'hidden',position:'relative'}}>
              <div style={{
                height:'100%',width:`${(cnt/total)*100}%`,
                background:`linear-gradient(90deg,${CATEGORY_COLOR[cat]||'#64748b'},${CATEGORY_COLOR[cat]||'#64748b'}90)`,
                borderRadius:99,transition:'width 1s cubic-bezier(.4,0,.2,1)',
                boxShadow:isH?`0 0 8px ${CATEGORY_COLOR[cat]}50`:'none',
              }}/>
              {isH && <div style={{
                position:'absolute',inset:0,
                background:'linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)',
                backgroundSize:'200% 100%',
                animation:'vaultShimmer 1s infinite',
                borderRadius:99,
              }}/>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Activity Card Row ──
function ActivityRow({ act, idx, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rowHover, setRowHover] = useState(false);
  const sm = STATUS_META[act.status];
  const catColor = CATEGORY_COLOR[act.task.category] || '#64748b';
  const StatusIcon = sm.icon;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), idx * 40);
    return () => clearTimeout(t);
  }, [idx]);

  const confColor = act.confidence>=90?'#22c55e':act.confidence>=72?'#6366f1':act.confidence>=50?'#f59e0b':'#ef4444';

  return (
    <div style={{
      opacity:mounted?1:0,
      transform:mounted?'none':'translateY(-8px)',
      transition:`opacity 0.4s ease ${idx*0.04}s, transform 0.4s ease ${idx*0.04}s`,
    }}>
      <div
        className="vault-row"
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={() => setRowHover(true)}
        onMouseLeave={() => setRowHover(false)}
        style={{
          cursor:'pointer', display:'flex', alignItems:'center',
          padding:'14px 24px', gap:14,
          borderBottom:'1px solid rgba(0,0,0,.04)',
          background: isNew ? 'linear-gradient(90deg,rgba(14,165,233,.06),rgba(139,92,246,.03),transparent)' : 'transparent',
          transition:'all 0.25s ease',
          position:'relative',
        }}
      >
        {/* Live indicator line for new items */}
        {isNew && (
          <div style={{
            position:'absolute', left:0, top:0, bottom:0, width:3,
            background:'linear-gradient(180deg,#0ea5e9,#8b5cf6)',
            borderRadius:'0 4px 4px 0',
            animation:'vaultPulse 1.5s ease-in-out infinite',
          }}/>
        )}

        {/* Expand chevron */}
        <div className="vault-expand" style={{
          color:expanded?'#0ea5e9':'#cbd5e1',
          transition:'all 0.25s ease',
          transform:expanded?'rotate(90deg)':'none',
          flexShrink:0,
        }}>
          <ChevronRight size={14} strokeWidth={2.5}/>
        </div>

        {/* ID */}
        <div style={{width:85,flexShrink:0}}>
          <div className="vault-id" style={{
            fontSize:12, fontWeight:800,
            color:expanded?'#0ea5e9':'#475569',
            fontFamily:'JetBrains Mono,monospace',
            transition:'all 0.2s',
            letterSpacing:-.3,
          }}>
            #{act.id}
          </div>
          {isNew && (
            <div style={{
              marginTop:2, fontSize:7, fontWeight:900, color:'#fff',
              background:'linear-gradient(90deg,#0ea5e9,#8b5cf6)',
              padding:'1px 6px', borderRadius:99,
              letterSpacing:1.5, textTransform:'uppercase',
              display:'inline-block',
            }}>LIVE</div>
          )}
        </div>

        {/* Worker */}
        <div style={{display:'flex',alignItems:'center',gap:10,width:150,flexShrink:0}}>
          <div style={{position:'relative'}}>
            <div style={{
              width:34, height:34, borderRadius:10,
              background:`linear-gradient(135deg,${act.worker.color},${act.worker.color}CC)`,
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:900, flexShrink:0,
              boxShadow:`0 3px 12px ${act.worker.color}40`,
              transition:'transform 0.2s, box-shadow 0.2s',
              transform:rowHover?'scale(1.08)':'scale(1)',
            }}>
              {act.worker.avatar}
            </div>
            {/* Online dot */}
            <div style={{
              position:'absolute', bottom:-1, right:-1,
              width:9, height:9, borderRadius:'50%', background:'#22c55e',
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
            width:32, height:32, borderRadius:8,
            background:`${catColor}10`, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15, flexShrink:0,
            border:`1px solid ${catColor}18`,
          }}>
            {act.task.icon}
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:'#334155',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{act.task.name}</div>
            <div style={{
              fontSize:8, fontWeight:800, color:catColor,
              background:`${catColor}12`, padding:'2px 7px', borderRadius:99,
              display:'inline-flex', alignItems:'center', gap:3,
              marginTop:2, textTransform:'uppercase', letterSpacing:.8,
              border:`1px solid ${catColor}15`,
            }}>
              <div style={{width:4,height:4,borderRadius:'50%',background:catColor}}/>
              {act.task.category}
            </div>
          </div>
        </div>

        {/* Zone */}
        <div style={{width:110,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <Camera size={10} style={{color:'#94a3b8'}}/>
            <span style={{fontSize:11,fontWeight:700,color:'#475569'}}>{act.zone}</span>
          </div>
          <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,marginTop:2,fontFamily:'JetBrains Mono,monospace'}}>
            {act.camId}
          </div>
        </div>

        {/* AI Score with sparkline */}
        <div style={{display:'flex',alignItems:'center',gap:8,width:130,flexShrink:0}}>
          <ConfidenceRing value={act.confidence} size={38}/>
          <div style={{flex:1,minWidth:0}}>
            <Sparkline data={act.sparkline} color={catColor} width={65} height={24}/>
          </div>
        </div>

        {/* Status pill */}
        <div style={{width:110,flexShrink:0}}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:5,
            background:sm.bg, color:sm.color,
            padding:'5px 12px', borderRadius:10,
            fontSize:10, fontWeight:800, letterSpacing:.5, textTransform:'uppercase',
            border:`1px solid ${sm.color}15`,
            boxShadow:rowHover?`0 0 12px ${sm.glow}`:'none',
            transition:'box-shadow 0.3s',
          }}>
            <StatusIcon size={11}
              style={{animation:act.status==='in-progress'?'vaultSpin 1.5s linear infinite':'none'}}
            />
            {sm.label}
          </div>
        </div>

        {/* Time */}
        <div style={{width:65,flexShrink:0,textAlign:'right'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#334155'}}>{act.timeAgo}</div>
          <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,fontFamily:'JetBrains Mono,monospace'}}>{act.timestamp}</div>
        </div>
      </div>

      {/* ── Expanded Detail Panel ── */}
      {expanded && (
        <div style={{
          background:'linear-gradient(135deg,rgba(14,165,233,.03),rgba(139,92,246,.025),rgba(236,72,153,.015))',
          borderBottom:'1px solid rgba(14,165,233,.1)',
          padding:'14px 24px 14px 56px',
          display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10,
          animation:'vaultSlideIn 0.3s ease-out',
        }}>
          {[
            {label:'Frames Analyzed', value:act.frames.toLocaleString(), icon:<Eye size={13}/>, color:'#8b5cf6', sub:'Total frames'},
            {label:'Process Time',    value:`${act.procTime}s`,         icon:<Zap size={13}/>, color:'#f59e0b', sub:'Avg latency'},
            {label:'AI Confidence',   value:`${act.confidence}%`,       icon:<Cpu size={13}/>, color:confColor, sub:act.confidence>=90?'Excellent':'Needs review'},
            {label:'Threat Level',    value:`${act.threat}%`,            icon:<Shield size={13}/>, color:act.threat>50?'#ef4444':'#22c55e', sub:act.threat>50?'Elevated':'Normal'},
            {label:'Camera Feed',     value:act.camId,                  icon:<Camera size={13}/>, color:'#0ea5e9', sub:act.zone},
          ].map((d,i) => (
            <div key={i} style={{
              background:'rgba(255,255,255,.85)', borderRadius:14, padding:'12px 14px',
              border:'1px solid rgba(0,0,0,.06)',
              display:'flex', alignItems:'center', gap:10,
              backdropFilter:'blur(8px)',
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${d.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{
                width:32, height:32, borderRadius:10,
                background:`${d.color}12`, color:d.color,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                border:`1px solid ${d.color}18`,
              }}>{d.icon}</div>
              <div>
                <div style={{fontSize:8,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>{d.label}</div>
                <div style={{fontSize:15,fontWeight:900,color:'#1e293b',lineHeight:1.2,fontFamily:'JetBrains Mono,monospace'}}>{d.value}</div>
                <div style={{fontSize:8,color:d.color,fontWeight:700,marginTop:1}}>{d.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
const TABS = ['All','Completed','In Progress','Flagged','Pending'];
const TAB_STATUS = { All:null, Completed:'completed', 'In Progress':'in-progress', Flagged:'flagged', Pending:'pending' };
const TAB_ICONS = { All:Layers, Completed:CheckCircle2, 'In Progress':Loader2, Flagged:XCircle, Pending:Clock };
const TAB_COLORS = { All:'#0ea5e9', Completed:'#22c55e', 'In Progress':'#6366f1', Flagged:'#ef4444', Pending:'#f59e0b' };

export default function ActivityVault() {
  const [activities, setActivities] = useState([]);
  const [newIds, setNewIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('All');
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const counterRef = useRef(3000);

  // inject CSS
  useEffect(() => {
    if (document.getElementById('vault-css')) return;
    const style = document.createElement('style');
    style.id = 'vault-css';
    style.textContent = VAULT_CSS;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('vault-css'); el?.remove(); };
  }, []);

  // initial batch
  useEffect(() => {
    setActivities(Array.from({length:14},(_,i) => makeActivity(i)));
  }, []);

  // live feed
  useEffect(() => {
    if (!liveEnabled) return;
    const iv = setInterval(() => {
      const a = makeActivity(counterRef.current++);
      setActivities(p => { const n=[a,...p]; if(n.length>40) n.pop(); return n; });
      setNewIds(p => new Set([...p, a.id]));
      setTimeout(() => setNewIds(p => { const n=new Set(p); n.delete(a.id); return n; }), 5000);
    }, 4500);
    return () => clearInterval(iv);
  }, [liveEnabled]);

  const filtered = useMemo(() => {
    let list = activities;
    const status = TAB_STATUS[activeTab];
    if (status) list = list.filter(a => a.status === status);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.worker.name.toLowerCase().includes(q) ||
        a.task.name.toLowerCase().includes(q) ||
        a.zone.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activities, activeTab, searchQuery]);

  const stats = useMemo(() => ({
    total:      activities.length,
    completed:  activities.filter(a=>a.status==='completed').length,
    inProgress: activities.filter(a=>a.status==='in-progress').length,
    flagged:    activities.filter(a=>a.status==='flagged').length,
    pending:    activities.filter(a=>a.status==='pending').length,
    avgConf:    activities.length ? (activities.reduce((s,a)=>s+a.confidence,0)/activities.length).toFixed(1) : '0',
  }), [activities]);

  return (
    <div style={{
      borderRadius:28, overflow:'hidden',
      border:'1px solid rgba(14,165,233,.12)',
      boxShadow:'0 4px 40px -10px rgba(0,0,0,.08), 0 0 0 1px rgba(255,255,255,.8) inset',
      background:'#fff',
      animation:'vaultBorderGlow 4s ease-in-out infinite',
    }}>
      {/* ═══════════════ HEADER ═══════════════ */}
      <div style={{
        padding:'22px 28px 18px', position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)',
        backgroundSize:'200% 200%',
        animation:'vaultGradient 8s ease infinite',
      }}>
        {/* Decorative orbs */}
        <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,.15),transparent 70%)',animation:'vaultFloat 4s ease-in-out infinite'}}/>
        <div style={{position:'absolute',bottom:-40,left:'30%',width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.1),transparent 70%)',animation:'vaultFloat 5s ease-in-out infinite 1s'}}/>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap',position:'relative',zIndex:1}}>
          {/* Title section */}
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{
              width:44, height:44, borderRadius:14,
              background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 6px 20px rgba(14,165,233,.4)',
              animation:'vaultGlow 3s ease-in-out infinite',
              position:'relative',
            }}>
              <Archive size={20} color="#fff"/>
              {/* Ripple effect */}
              <div style={{
                position:'absolute',inset:0,borderRadius:14,
                border:'2px solid rgba(14,165,233,.3)',
                animation:'vaultRipple 2.5s ease-out infinite',
              }}/>
            </div>
            <div>
              <h3 style={{fontSize:18,fontWeight:900,color:'#f8fafc',margin:0,lineHeight:1.2,letterSpacing:-.3}}>
                Activity Vault
              </h3>
              <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginTop:3,display:'flex',alignItems:'center',gap:6}}>
                <Radio size={10} style={{color:'#38bdf8'}}/>
                AI-Audited Operational Record Matrix
                <span style={{width:3,height:3,borderRadius:'50%',background:'#475569'}}/>
                <span style={{color:'#38bdf8',fontWeight:800,fontFamily:'JetBrains Mono,monospace',fontSize:10}}>v4.2</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {/* Search bar */}
            <div style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'7px 12px',borderRadius:10,
              background:'rgba(255,255,255,.06)',
              border:'1px solid rgba(255,255,255,.08)',
              transition:'all 0.2s',
            }}>
              <Search size={12} style={{color:'#64748b'}}/>
              <input
                type="text" placeholder="Search records..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background:'transparent',border:'none',outline:'none',
                  color:'#f8fafc',fontSize:11,fontWeight:600,width:120,
                  fontFamily:'Outfit,sans-serif',
                }}
              />
            </div>

            {/* Live toggle */}
            <button onClick={() => setLiveEnabled(v => !v)} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'7px 14px',borderRadius:10,cursor:'pointer',
              border:`1.5px solid ${liveEnabled?'rgba(34,197,94,.35)':'rgba(255,255,255,.1)'}`,
              background:liveEnabled?'rgba(34,197,94,.12)':'rgba(255,255,255,.04)',
              color:liveEnabled?'#4ade80':'#64748b',
              fontSize:11,fontWeight:800,transition:'all 0.2s',
            }}>
              {liveEnabled ? <Play size={10}/> : <Pause size={10}/>}
              <span style={{
                width:7,height:7,borderRadius:'50%',
                background:liveEnabled?'#22c55e':'#64748b',
                boxShadow:liveEnabled?'0 0 8px rgba(34,197,94,.6)':'none',
                animation:liveEnabled?'vaultPulse 1.5s ease-in-out infinite':'none',
              }}/>
              {liveEnabled?'LIVE':'PAUSED'}
            </button>

            {/* View full link */}
            <Link to="/activity-vault" style={{
              display:'flex',alignItems:'center',gap:5,
              padding:'7px 14px',borderRadius:10,cursor:'pointer',
              border:'1.5px solid rgba(255,255,255,.1)',
              background:'rgba(255,255,255,.04)',
              color:'#94a3b8',fontSize:11,fontWeight:700,
              textDecoration:'none',transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(14,165,233,.4)'; e.currentTarget.style.color='#38bdf8'; e.currentTarget.style.background='rgba(14,165,233,.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.1)'; e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.background='rgba(255,255,255,.04)'; }}
            >
              Full Vault <ArrowRight size={11}/>
            </Link>
          </div>
        </div>

        {/* ── STATS ROW inside header ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginTop:18,position:'relative',zIndex:1}}>
          {[
            {label:'Total Records', value:stats.total,        color:'#38bdf8', Icon:Activity,     trend:'+12%'},
            {label:'Completed',     value:stats.completed,    color:'#4ade80', Icon:CheckCircle2, trend:'+8%'},
            {label:'In Progress',   value:stats.inProgress,   color:'#818cf8', Icon:Wifi,         trend:null},
            {label:'Flagged',       value:stats.flagged,      color:'#f87171', Icon:AlertCircle,  trend:stats.flagged>3?`${stats.flagged} active`:null},
            {label:'Avg Confidence',value:`${stats.avgConf}%`,color:'#fbbf24', Icon:ShieldCheck,  trend:null},
          ].map(({label,value,color,Icon,trend}) => (
            <div key={label} style={{
              background:'rgba(255,255,255,.04)',
              border:'1px solid rgba(255,255,255,.06)',
              borderRadius:14, padding:'12px 14px',
              display:'flex', alignItems:'center', gap:10,
              backdropFilter:'blur(8px)',
              transition:'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.borderColor=`${color}30`; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,.06)'; e.currentTarget.style.transform='none'; }}
            >
              <div style={{
                width:34,height:34,borderRadius:10,
                background:`${color}15`,
                display:'flex',alignItems:'center',justifyContent:'center',
                flexShrink:0,
              }}>
                <Icon size={16} style={{color}}/>
              </div>
              <div>
                <div style={{fontSize:18,fontWeight:900,color:'#f8fafc',lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>
                  {value}
                </div>
                <div style={{fontSize:8,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:1,marginTop:2}}>{label}</div>
                {trend && (
                  <div style={{fontSize:8,fontWeight:800,color:color,marginTop:1}}>
                    {trend}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ TABS BAR ═══════════════ */}
      <div style={{
        display:'flex',alignItems:'center',gap:4,
        padding:'10px 24px',
        borderBottom:'1px solid rgba(0,0,0,.05)',
        background:'rgba(248,250,252,.8)',
        backdropFilter:'blur(8px)',
        overflowX:'auto',
      }}>
        {TABS.map(tab => {
          const active = tab===activeTab;
          const s = TAB_STATUS[tab];
          const cnt = s ? activities.filter(a => a.status===s).length : activities.length;
          const color = TAB_COLORS[tab];
          const TabIcon = TAB_ICONS[tab];
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'7px 16px',borderRadius:10,cursor:'pointer',
              border:active?`1.5px solid ${color}35`:'1.5px solid transparent',
              background:active?`${color}08`:'transparent',
              color:active?color:'#64748b',
              fontSize:12,fontWeight:active?800:600,
              transition:'all 0.2s',whiteSpace:'nowrap',
            }}>
              <TabIcon size={12} style={{animation:active&&tab==='In Progress'?'vaultSpin 1.5s linear infinite':'none'}}/>
              {tab}
              <span style={{
                background:active?color:'#e2e8f0',color:active?'#fff':'#94a3b8',
                borderRadius:99,padding:'1px 7px',fontSize:9,fontWeight:800,
                minWidth:18,textAlign:'center',
                boxShadow:active?`0 2px 8px ${color}30`:'none',
                transition:'all 0.2s',
              }}>{cnt}</span>
            </button>
          );
        })}

        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <button style={{
            display:'flex',alignItems:'center',gap:4,
            padding:'6px 12px',borderRadius:8,cursor:'pointer',
            border:'1.5px solid #e2e8f0',background:'#fff',
            color:'#64748b',fontSize:11,fontWeight:700,
            transition:'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#0ea5e9'; e.currentTarget.style.color='#0ea5e9'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}
          >
            <SlidersHorizontal size={11}/> Filter
          </button>
          <button style={{
            display:'flex',alignItems:'center',gap:4,
            padding:'6px 12px',borderRadius:8,cursor:'pointer',
            border:'1.5px solid #e2e8f0',background:'#fff',
            color:'#64748b',fontSize:11,fontWeight:700,
            transition:'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#8b5cf6'; e.currentTarget.style.color='#8b5cf6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}
          >
            <Download size={11}/> Export
          </button>
        </div>
      </div>

      {/* ═══════════════ TABLE HEADER ═══════════════ */}
      <div style={{
        display:'flex',alignItems:'center',gap:14,
        padding:'8px 24px',
        background:'linear-gradient(90deg,#f8fafc,#f1f5f9)',
        borderBottom:'1px solid rgba(0,0,0,.04)',
      }}>
        <div style={{width:14}}/>
        {[
          {label:'ID',          width:85},
          {label:'Worker',      width:150},
          {label:'Task',        flex:1},
          {label:'Zone / Cam',  width:110},
          {label:'AI Score',    width:130},
          {label:'Status',      width:110},
          {label:'Time',        width:65,align:'right'},
        ].map((col,i) => (
          <div key={i} style={{
            width:col.width, flex:col.flex||undefined, flexShrink:col.flex?undefined:0,
            fontSize:9, fontWeight:800, color:'#94a3b8',
            textTransform:'uppercase', letterSpacing:1.2,
            textAlign:col.align||'left',
            fontFamily:'JetBrains Mono,monospace',
          }}>{col.label}</div>
        ))}
      </div>

      {/* ═══════════════ ACTIVITY ROWS ═══════════════ */}
      <div className="vault-scrollbar" style={{maxHeight:420,overflowY:'auto',scrollbarWidth:'thin',scrollbarColor:'rgba(14,165,233,.2) transparent'}}>
        {filtered.length === 0 ? (
          <div style={{padding:'50px 24px',textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8,opacity:.4}}>🔍</div>
            <div style={{fontSize:13,fontWeight:700,color:'#94a3b8'}}>No records found</div>
            <div style={{fontSize:11,color:'#cbd5e1',marginTop:4}}>Try adjusting your search or filter criteria</div>
          </div>
        ) : (
          filtered.slice(0,12).map((act,i) => (
            <ActivityRow key={act.id} act={act} idx={i} isNew={newIds.has(act.id)}/>
          ))
        )}
      </div>

      {/* ═══════════════ INSIGHTS PANEL ═══════════════ */}
      <div style={{
        borderTop:'1px solid rgba(0,0,0,.05)',
        display:'grid', gridTemplateColumns:'auto 1fr 220px',
        background:'linear-gradient(135deg,#f8fafc,#f1f5f9)',
      }}>
        {/* Donut */}
        <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRight:'1px solid rgba(0,0,0,.04)'}}>
          <StatusDonut stats={stats} size={110}/>
          <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,marginTop:8}}>Distribution</div>
          <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap',justifyContent:'center'}}>
            {Object.entries(STATUS_META).map(([k,v]) => (
              <div key={k} style={{display:'flex',alignItems:'center',gap:3,fontSize:8,fontWeight:700,color:'#475569'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:v.color}}/>
                {v.label}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div style={{padding:'18px 24px',borderRight:'1px solid rgba(0,0,0,.04)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#1e293b',display:'flex',alignItems:'center',gap:6}}>
                <BarChart3 size={13} style={{color:'#0ea5e9'}}/>
                Weekly Activity Heatmap
              </div>
              <div style={{fontSize:10,color:'#94a3b8',fontWeight:600,marginTop:2}}>Event density per hour</div>
            </div>
            <div style={{
              fontSize:9,fontWeight:800,color:'#0ea5e9',
              background:'rgba(14,165,233,.06)',padding:'4px 10px',borderRadius:99,
              border:'1px solid rgba(14,165,233,.12)',
              fontFamily:'JetBrains Mono,monospace',
            }}>LAST 7 DAYS</div>
          </div>
          <HeatmapBlock/>
        </div>

        {/* Category breakdown */}
        <div style={{padding:'18px 20px'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#1e293b',marginBottom:2,display:'flex',alignItems:'center',gap:6}}>
            <Layers size={13} style={{color:'#8b5cf6'}}/>
            Categories
          </div>
          <div style={{fontSize:10,color:'#94a3b8',fontWeight:600,marginBottom:12}}>Task distribution</div>
          <CategoryBreakdown activities={activities}/>
        </div>
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <div style={{
        padding:'14px 28px', position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        {/* Animated scan line */}
        <div style={{
          position:'absolute',left:0,top:0,width:'100%',height:1,
          background:'linear-gradient(90deg,transparent,rgba(14,165,233,.4),transparent)',
          backgroundSize:'200% 100%',animation:'vaultShimmer 3s linear infinite',
        }}/>

        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{position:'relative'}}>
            <div style={{
              width:8,height:8,borderRadius:'50%',background:'#22c55e',
              boxShadow:'0 0 10px rgba(34,197,94,.8)',
              animation:'vaultPulse 1.5s ease-in-out infinite',
            }}/>
            <div style={{
              position:'absolute',inset:-3,borderRadius:'50%',
              border:'1.5px solid rgba(34,197,94,.3)',
              animation:'vaultRipple 2s linear infinite',
            }}/>
          </div>
          <span style={{fontSize:11,fontWeight:700,color:'#64748b'}}>
            Showing <span style={{color:'#f8fafc',fontWeight:900,fontFamily:'JetBrains Mono,monospace'}}>{Math.min(filtered.length,12)}</span>
            {' '}of{' '}
            <span style={{color:'#f8fafc',fontWeight:900,fontFamily:'JetBrains Mono,monospace'}}>{filtered.length}</span>
            {' '}records
          </span>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {[...Array(4)].map((_,i) => (
              <div key={i} style={{
                width:3, height:12+i*3, borderRadius:99,
                background:`rgba(14,165,233,${0.2+i*0.2})`,
                animation:'vaultPulse 1s ease-in-out infinite',
                animationDelay:`${i*0.15}s`,
              }}/>
            ))}
          </div>
          <span style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:1.2,fontFamily:'JetBrains Mono,monospace'}}>
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
