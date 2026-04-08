import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Info, ArrowRight, X, Bell, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_CONFIG = {
  critical: {
    icon: ShieldAlert,
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    iconBg: 'rgba(239,68,68,0.12)',
    iconColor: '#ef4444',
    badge: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca', label: 'CRITICAL' },
  },
  warning: {
    icon: AlertTriangle,
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.18)',
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#f59e0b',
    badge: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'WARNING' },
  },
  info: {
    icon: Info,
    bg: 'rgba(14,165,233,0.05)',
    border: 'rgba(14,165,233,0.15)',
    iconBg: 'rgba(14,165,233,0.10)',
    iconColor: '#0ea5e9',
    badge: { bg: '#f0f9ff', text: '#0ea5e9', border: '#bae6fd', label: 'INFO' },
  },
};

const INITIAL_ALERTS = [
  { id: 1, type: 'critical', message: 'Unauthorized Entry', time: '2 mins ago', location: 'Server Room' },
  { id: 2, type: 'warning', message: 'Crowd Threshold Exceeded', time: '14 mins ago', location: 'Main Lobby' },
  { id: 3, type: 'info', message: 'New Device Registered', time: '45 mins ago', location: 'Gate 2' },
  { id: 4, type: 'critical', message: 'Sensor Tampered', time: '1h ago', location: 'Perimeter B' },
];

const INCOMING = [
  { type: 'warning', message: 'Motion in Restricted Zone', location: 'Lab Alpha' },
  { type: 'critical', message: 'Weapon Detection Triggered', location: 'Entrance A' },
  { type: 'info', message: 'Staff Check-in Logged', location: 'Reception' },
];

function AlertRow({ alert, onDismiss }) {
  const cfg = TYPE_CONFIG[alert.type];
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(() => onDismiss(alert.id), 350);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? cfg.bg : 'transparent',
        borderLeft: `3px solid ${hovered ? cfg.iconColor : 'transparent'}`,
        transform: dismissed ? 'translateX(110%)' : 'translateX(0)',
        opacity: dismissed ? 0 : 1,
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        maxHeight: dismissed ? 0 : 200,
        overflow: 'hidden',
      }}
      className="flex items-start gap-3 px-4 py-3"
    >
      {/* Icon */}
      <div
        style={{
          background: cfg.iconBg,
          border: `1px solid ${cfg.border}`,
          transform: alert.type === 'critical' ? undefined : undefined,
        }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          alert.type === 'critical' ? 'animate-pulse' : ''
        }`}
      >
        <cfg.icon className="w-4.5 h-4.5" style={{ color: cfg.iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <p className="text-[0.82rem] font-bold text-slate-800 truncate">{alert.message}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              style={{
                background: cfg.badge.bg,
                color: cfg.badge.text,
                border: `1px solid ${cfg.badge.border}`,
              }}
              className="text-[0.55rem] font-black px-1.5 py-0.5 rounded-full tracking-wide"
            >
              {cfg.badge.label}
            </span>
            {hovered && (
              <button
                onClick={handleDismiss}
                className="p-0.5 rounded-md bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[0.68rem] text-slate-400 font-medium">
          <span className="font-semibold" style={{ color: cfg.iconColor }}>{alert.location}</span>
          <span>·</span>
          <span>{alert.time}</span>
        </div>
      </div>
    </div>
  );
}

export default function RecentAlerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [incomingIdx, setIncomingIdx] = useState(0);
  const [newAlert, setNewAlert] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => {
      const incoming = INCOMING[incomingIdx % INCOMING.length];
      const id = Date.now();
      const alert = { ...incoming, id, time: 'Just now' };
      setNewAlert(alert);
      setTimeout(() => {
        setAlerts(prev => [alert, ...prev].slice(0, 6));
        setNewAlert(null);
      }, 800);
      setIncomingIdx(p => p + 1);
    }, 6000);
    return () => clearInterval(iv);
  }, [incomingIdx]);

  const dismissAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  const criticalCount = alerts.filter(a => a.type === 'critical').length;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 24px -6px rgba(0,0,0,0.06)',
      }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell className="w-4.5 h-4.5 text-slate-700" />
            {criticalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[0.45rem] font-black rounded-full flex items-center justify-center animate-bounce">
                {criticalCount}
              </span>
            )}
          </div>
          <h2 className="text-[1rem] font-black text-slate-800">Recent Activity</h2>
        </div>
        <Link
          to="/alerts"
          className="text-[0.7rem] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group transition-colors"
        >
          View All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Incoming flash banner */}
      {newAlert && (
        <div
          style={{
            background: TYPE_CONFIG[newAlert.type].bg,
            borderBottom: `1px solid ${TYPE_CONFIG[newAlert.type].border}`,
            animation: 'slideDownBanner 0.4s ease-out',
          }}
          className="px-5 py-2.5 flex items-center gap-2 text-[0.72rem] font-bold shrink-0"
        >
          <style>{`@keyframes slideDownBanner { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span style={{ color: TYPE_CONFIG[newAlert.type].iconColor }}>NEW:</span>
          <span className="text-slate-700">{newAlert.message}</span>
          <span className="text-slate-400 ml-auto">{newAlert.location}</span>
        </div>
      )}

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-300">
            <CheckCircle2 className="w-8 h-8" />
            <span className="text-sm font-bold">All Clear</span>
          </div>
        ) : (
          alerts.map(a => <AlertRow key={a.id} alert={a} onDismiss={dismissAlert} />)
        )}
      </div>

      {/* Footer status pill */}
      <div className="p-4 bg-slate-50/60 border-t border-slate-100 shrink-0">
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: 14,
            padding: '10px 16px',
          }}
          className="flex items-center justify-between text-white shadow-lg"
        >
          <div className="flex flex-col">
            <span className="text-[0.55rem] font-bold opacity-60 uppercase tracking-widest leading-tight">System Status</span>
            <span className="text-[0.75rem] font-black">ALL NODES ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.6rem] text-slate-400 font-semibold">{alerts.length} events</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
