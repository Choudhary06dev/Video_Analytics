import React, { useEffect, useState } from 'react';
import { Maximize2, Activity, ShieldCheck, AlertTriangle, Eye, Radio } from 'lucide-react';

const CAMERAS = [
  {
    id: 1, name: 'ICU West Entrance',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80',
    fields: [
      { label: 'Authorized Staff', value: 'Maria Santos', color: '#0ea5e9' },
      { label: 'Task Detected',   value: 'Hand Hygiene',  color: '#22c55e' },
    ],
    tags: [
      { text: '98% Conf.',   bg: 'rgba(14,165,233,0.15)', color: '#0ea5e9' },
      { text: 'Bio-Secure',  bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
    ],
    stats: [{ label: 'Objects', value: '12' }, { label: 'Motion', value: '0.14' }],
    alertMode: false,
  },
  {
    id: 2, name: 'Main Lobby Central',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80',
    fields: [
      { label: 'Security', value: 'John Rivera',  color: '#0ea5e9' },
      { label: 'Pattern',  value: 'Patrol Check', color: '#0ea5e9' },
    ],
    tags: [
      { text: '94% Conf.',    bg: 'rgba(14,165,233,0.15)', color: '#0ea5e9' },
      { text: 'Verified Area', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    ],
    stats: [{ label: 'Objects', value: '18' }, { label: 'Motion', value: '0.42' }],
    alertMode: false,
  },
  {
    id: 3, name: 'Emergency Bay Exterior',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    fields: [
      { label: 'State',    value: 'Critical Watch', color: '#f59e0b' },
      { label: 'Priority', value: 'VITAL',           color: '#ef4444' },
    ],
    tags: [{ text: 'Threat Alert', bg: 'rgba(239,68,68,0.2)', color: '#ef4444' }],
    stats: [{ label: 'Alerts', value: '2' }, { label: 'Queue', value: '5' }],
    alertMode: true,
  },
  {
    id: 4, name: 'Supply Hallway B',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80',
    fields: [
      { label: 'Staff',  value: 'Tom Wilson', color: '#0ea5e9' },
      { label: 'Task',   value: 'Janitorial',  color: '#f59e0b' },
    ],
    tags: [
      { text: '91% Conf.', bg: 'rgba(14,165,233,0.15)', color: '#0ea5e9' },
      { text: 'Zone Clear', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    ],
    stats: [{ label: 'Objects', value: '8' }, { label: 'Motion', value: '0.21' }],
    alertMode: false,
  },
  {
    id: 5, name: 'Secure Research Lab α',
    image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=800',
    fields: [
      { label: 'Auth Head',  value: 'Lisa Chen', color: '#0ea5e9' },
      { label: 'Access',     value: 'L-3 Grant', color: '#22c55e' },
    ],
    tags: [
      { text: '99% Conf.',   bg: 'rgba(14,165,233,0.15)', color: '#0ea5e9' },
      { text: 'Locked Down', bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
    ],
    stats: [{ label: 'Objects', value: '15' }, { label: 'Motion', value: '0.08' }],
    alertMode: false,
  },
  {
    id: 6, name: 'Perimeter Sector 7',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80',
    fields: [
      { label: 'Status',  value: 'Deep Scanning', color: '#0ea5e9' },
      { label: 'Threats', value: 'Zero (0)',       color: '#22c55e' },
    ],
    tags: [{ text: 'Perimeter Safe', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' }],
    stats: [{ label: 'Objects', value: '6' }, { label: 'Motion', value: '0.00' }],
    alertMode: false,
  },
];

function CameraCard({ cam }) {
  const [hovered, setHovered] = useState(false);
  const [dots, setDots] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      const newDots = [];
      // Simulate 2 tracked objects with 6 dots each (2x3 grid)
      for (let p = 0; p < 2; p++) {
        const ox = 15 + Math.random() * 70;
        const oy = 20 + Math.random() * 50;
        const spacingX = 5;
        const spacingY = 8;

        // 6 dots pattern (2 columns, 3 rows)
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 2; col++) {
            newDots.push({
              id: `${p}-${row}-${col}`,
              top: `${oy + row * spacingY}%`,
              left: `${ox + col * spacingX}%`,
            });
          }
        }
      }
      setDots(newDots);
    }, 1500); // Significant slowdown
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          aspectRatio: '16/9',
          position: 'relative',
          cursor: 'pointer',
          border: cam.alertMode
            ? '2px solid rgba(239,68,68,0.6)'
            : hovered
            ? '2px solid rgba(14,165,233,0.5)'
            : '2px solid transparent',
          boxShadow: cam.alertMode
            ? '0 0 24px rgba(239,68,68,0.35)'
            : hovered
            ? '0 20px 50px -12px rgba(0,0,0,0.35)'
            : '0 4px 16px rgba(0,0,0,0.15)',
          transform: hovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
          transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          background: '#000',
        }}
      >
        {/* Camera image */}
        <img
          src={cam.image} alt={cam.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: hovered ? 0.55 : 0.88,
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.6s ease',
          }}
        />

        {/* Scan-line overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          opacity: 0.5,
        }} />

        {/* Alert pulse border for critical cams */}
        {cam.alertMode && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 18,
            border: '2px solid rgba(239,68,68,0.8)',
            animation: 'alertPulse 1.2s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}

        {/* Top HUD */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '14px 14px 32px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              Stream-{String(cam.id).padStart(2,'0')}
            </div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 900, letterSpacing: -0.3 }}>{cam.name}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: cam.alertMode ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8, padding: '3px 8px',
            fontSize: 10, fontWeight: 900, color: '#fff',
            border: cam.alertMode ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
          }}>
            {cam.alertMode
              ? <AlertTriangle style={{ width: 11, height: 11 }} />
              : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80', animation: 'pulse 1.5s infinite' }} />
            }
            {cam.alertMode ? 'CRITICAL' : 'LIVE'}
          </div>
        </div>

        {/* AI tracking dots */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{ overflow: 'hidden' }}>
          {dots.map(dot => (
            <div
              key={dot.id}
              style={{
                position: 'absolute',
                top: dot.top, left: dot.left,
                width: 6, height: 6,
                borderRadius: '50%',
                background: cam.alertMode ? '#ef4444' : '#0ea5e9',
                border: '1.5px solid rgba(255,255,255,0.9)',
                boxShadow: `0 0 10px ${cam.alertMode ? '#ef4444' : '#38bdf8'}`,
                transition: 'top 1s ease-in-out, left 1s ease-in-out',
                animation: 'dotPulse 2s infinite ease-in-out',
              }}
            />
          ))}
        </div>

        {/* Hover overlay panel */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px',
          transform: hovered ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.10,0.64,1)',
          zIndex: 20,
        }}>
          <div style={{
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {cam.tags.map((t, i) => (
                  <span key={i} style={{
                    background: t.bg, color: t.color,
                    border: `1px solid ${t.color}30`,
                    fontSize: 9, fontWeight: 900,
                    padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase',
                  }}>
                    {t.text}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setExpanded(true)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 7, padding: 5, color: '#fff', cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                <Maximize2 style={{ width: 12, height: 12 }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {cam.fields.map((f, i) => (
                <div key={i}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{f.label}</div>
                  <div style={{ color: f.color, fontSize: 11, fontWeight: 900 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side stats on hover */}
        <div style={{
          position: 'absolute', top: '50%', right: 0,
          transform: `translateY(-50%) translateX(${hovered ? '-44px' : '8px'})`,
          opacity: hovered ? 1 : 0,
          display: 'flex', flexDirection: 'column', gap: 5,
          transition: 'all 0.4s ease', zIndex: 30,
        }}>
          {cam.stats.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '4px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</span>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>{s.value}</span>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes alertPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
          @keyframes dotPulse { 0%,100%{transform:scale(1); opacity:1} 50%{transform:scale(1.3); opacity:0.7} }
        `}</style>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeInModal 0.25s ease',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            width: '80vw', maxWidth: 900, borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)', position: 'relative',
          }}>
            <img src={cam.image} alt={cam.name} style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 16, left: 16, color: '#fff', fontWeight: 900, fontSize: 18 }}>{cam.name}</div>
            <button onClick={() => setExpanded(false)} style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}>✕ Close</button>
          </div>
          <style>{`@keyframes fadeInModal{from{opacity:0}to{opacity:1}}`}</style>
        </div>
      )}
    </>
  );
}

export default function CameraGrid() {
  return (
    <div
      className="bg-card rounded-[28px] border border-border shadow-premium p-[22px]"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <div>
          <h3 className="text-[1.05rem] font-black text-text-dark flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-500" />
            Neural Feed Matrix
          </h3>
          <p className="text-[0.7rem] text-text-gray font-semibold">Sentinel AI Engine v4.2 · hover to inspect · click ⤢ to expand</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-black">
            <Radio className="w-3 h-3" />
            6 STREAMS SYNCED
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-black">
            <ShieldCheck className="w-3.5 h-3.5" />
            AES-256 ENCRYPTED
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-black animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            1 ALERT ACTIVE
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAMERAS.map(cam => <CameraCard key={cam.id} cam={cam} />)}
      </div>
    </div>
  );
}
