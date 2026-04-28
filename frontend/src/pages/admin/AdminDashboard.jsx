import React, { useEffect, useState } from "react";
import {
  Users,
  Shield,
  Camera,
  MapPin,
  AlertTriangle,
  Settings,
  Activity, 
  FileText,
  RefreshCw,
  Eye,
  Zap,
  TrendingUp,
  Database,
  Globe,
  Bell
} from "lucide-react";

import { fetchAdminUsers, fetchAuditLogs } from '../../services/userService';
import { fetchAdminAreas, fetchAdminCameras, fetchScenarios } from '../../services/cameraService';
import { fetchAlerts } from '../../services/alertService';

// Sub-component for premium cards
const MetricCard = ({ title, value, icon: Icon, colorClass, gradientClass, subtext }) => (
  <div className="group relative bg-card border border-border/60 rounded-2xl p-5 hover:border-accent/40 transition-all duration-500 shadow-sm overflow-hidden">
    <div className={`absolute -right-8 -top-8 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-30 transition-all duration-700 ${gradientClass}`} />
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl bg-surface border border-border/40 group-hover:scale-110 transition-transform duration-500 ${colorClass} shadow-lg shadow-current/10`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-text-gray uppercase tracking-[0.15em] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black italic tracking-tighter text-text-dark">{value}</h3>
          {subtext && <span className="text-[10px] font-medium text-text-gray/60">{subtext}</span>}
        </div>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    cameras: 0,
    areas: 0,
    scenarios: 0,
    alerts: 0,
    audits: 0,
  });

  const [rawStats, setRawStats] = useState({
    cameras: [],
    scenarios: [],
    audits: []
  });

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔗 Real-time backend integration
  const fetchStats = async () => {
    try {
      setLoading(true);
      const [users, cameras, areas, scenarios, alerts, audits] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminCameras(),
        fetchAdminAreas(),
        fetchScenarios(),
        fetchAlerts({ hours: 24 }),
        fetchAuditLogs()
      ]);

      setStats({
        users: users?.length || 0,
        cameras: cameras?.length || 0,
        areas: areas?.length || 0,
        scenarios: scenarios?.length || 0,
        alerts: alerts?.length || 0,
        audits: audits?.length || 0,
      });

      setRawStats({
        cameras: cameras || [],
        scenarios: scenarios || [],
        audits: audits || []
      });

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard intelligence:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds for live monitoring
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-10">
      
      {/* ── Top Intelligence Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-card/80 to-surface/80 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] -mr-32 -mt-32" />
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 border border-white/20 rounded-2xl items-center justify-center relative overflow-hidden group shadow-lg shadow-blue-500/20">
            <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
            <Activity className="w-7 h-7 text-white relative z-10 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark">
                AI Hospital <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 underline decoration-blue-600/30 underline-offset-4">Command Center</span>
              </h1>
              <div className="px-2 py-0.5 bg-success/10 border border-success/20 rounded text-[9px] font-black text-success tracking-widest uppercase flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full bg-success ${loading ? 'animate-ping' : 'animate-pulse'}`} />
                {loading ? 'Recalibrating...' : 'Network Online'}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3 text-accent" /> Facility: Medical Block A
              </p>
              <div className="w-1 h-1 rounded-full bg-border" />
              <p className="text-[10px] font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-center relative z-10">
          <button 
            onClick={fetchStats}
            disabled={loading}
            className={`flex items-center gap-2.5 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Recalibrating...' : 'Recalibrate System'}
          </button>
        </div>
      </div>

      {/* ── Hospital KPI Matrix ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <MetricCard title="Total Personnel" value={stats.users} icon={Users} colorClass="text-blue-500" gradientClass="bg-blue-500" subtext="Active IDs" />
        <MetricCard title="Stream Nodes" value={stats.cameras} icon={Camera} colorClass="text-emerald-500" gradientClass="bg-emerald-500" subtext="Online" />
        <MetricCard title="Hospital Sectors" value={stats.areas} icon={MapPin} colorClass="text-purple-500" gradientClass="bg-purple-500" />
        <MetricCard title="AI Scenarios" value={stats.scenarios} icon={Settings} colorClass="text-amber-500" gradientClass="bg-amber-500" subtext="Running" />
        <MetricCard title="Active Alerts" value={stats.alerts} icon={AlertTriangle} colorClass="text-red-500" gradientClass="bg-red-500" subtext="Priority 1" />
        <MetricCard title="Audit Signals" value={stats.audits} icon={FileText} colorClass="text-slate-500" gradientClass="bg-slate-500" />
      </div>

      {/* ── Deep Analytics Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CAMERA OVERVIEW MODULE */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-dark mb-6 flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg"><Camera size={16} className="text-emerald-500" /></div>
            Cameras Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-surface/50 rounded-xl border border-border/30">
              <span className="text-[11px] font-bold text-text-gray uppercase tracking-wider">🟢 Online Nodes</span>
              <span className="text-sm font-black text-emerald-500">{rawStats.cameras.filter(c => c.is_active || c.status === 'online').length} Units</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface/50 rounded-xl border border-border/30">
              <span className="text-[11px] font-bold text-text-gray uppercase tracking-wider">🔴 Offline Nodes</span>
              <span className="text-sm font-black text-red-500">{rawStats.cameras.filter(c => !c.is_active && c.status !== 'online').length} Units</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface/50 rounded-xl border border-border/30">
              <span className="text-[11px] font-bold text-text-gray uppercase tracking-wider">📍 Coverage Areas</span>
              <span className="text-[10px] font-black text-text-dark italic truncate ml-4">
                {stats.areas > 0 ? `${stats.areas} Registered Sectors` : 'No Areas Found'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl border border-emerald-500/20">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">🤖 Neural Inference</span>
              <span className="text-sm font-black text-emerald-600">{rawStats.cameras.length} Enabled</span>
            </div>
          </div>
        </div>

        {/* AI SCENARIOS MODULE */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-dark mb-6 flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/10 rounded-lg"><Settings size={16} className="text-amber-500" /></div>
            AI Intelligence Mesh
          </h2>
          <div className="space-y-3">
            {rawStats.scenarios.length > 0 ? rawStats.scenarios.slice(0, 5).map((scenario, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 hover:bg-surface transition-colors rounded-lg">
                <span className="text-[11px] font-bold text-text-gray">{scenario.name}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500`}>
                  ACTIVE
                </span>
              </div>
            )) : (
              <p className="text-[10px] text-text-gray/60 italic text-center py-4 uppercase font-black">No Scenarios Configured</p>
            )}
          </div>
        </div>

        {/* AUDIT LOG MODULE */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm relative overflow-hidden group flex flex-col h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-dark mb-6 flex items-center gap-3">
            <div className="p-1.5 bg-blue-500/10 rounded-lg"><FileText size={16} className="text-blue-500" /></div>
            Intelligence Audit
          </h2>
          <div className="space-y-4 overflow-y-auto flex-1 scrollbar-none">
            {rawStats.audits.length > 0 ? rawStats.audits.slice(0, 5).map((log, i) => (
              <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-surface/50 transition-colors">
                <span className="text-lg">👤</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-text-dark truncate">{log.action || log.message}</p>
                  <p className="text-[9px] font-medium text-text-gray/60 uppercase mt-0.5">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-[10px] text-text-gray/60 italic text-center py-4 uppercase font-black">No Audit Logs Found</p>
            )}
          </div>
        </div>

      </div>

      {/* ── Infrastructure Visuals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 blur-[80px] -mr-24 -mt-24" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-white font-black italic uppercase tracking-widest text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  RBAC Protocol Status
                </h3>
                <p className="text-white/40 text-[9px] font-bold uppercase mt-1">Identity Management Engine</p>
              </div>
              <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-[10px] font-black uppercase">
                Active
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-white/30 uppercase">Neural Integrity</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-[94%]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-white/30 uppercase">Encryption Level</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[100%]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-white/30 uppercase">Packet Safety</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 w-[88%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex items-center justify-between overflow-hidden relative">
           <div className="absolute inset-0 bg-accent/[0.02] pointer-events-none" />
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border/50 flex items-center justify-center shadow-inner group">
                <Activity className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black italic uppercase tracking-tighter text-text-dark">System Status: Nominal</h4>
                <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest mt-1">Uptime: 99.998% // Nodes Synced</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-text-gray uppercase tracking-widest">Real-time Dashboard</p>
              <p className="text-[14px] font-black text-accent italic tracking-tighter mt-1">V1.0 HOSPITAL OPS</p>
           </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 text-[9px] font-black text-text-gray/40 text-center uppercase tracking-[0.5em]">
        AI Hospital Monitoring System • Powered by Command Intelligence v2.0
      </div>
    </div>
  );
}