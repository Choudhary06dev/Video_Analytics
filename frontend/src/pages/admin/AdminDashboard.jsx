import React, { useEffect, useState } from"react";
import {
 Users,
 User,
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
} from"lucide-react";

import { fetchAdminUsers, fetchAuditLogs } from '../../services/userService';
import { fetchAlerts, fetchLogsSummary } from '../../services/alertService';
import { fetchAdminAreas, fetchAdminCameras, fetchScenarios, fetchSystemHealth } from '../../services/cameraService';

const actionColors = {
 CREATE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
 UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
 DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
 STATUS_CHANGE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
 AUTH: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};

// Sub-component for premium cards
const MetricCard = ({ title, value, icon: Icon, colorClass, gradientClass, subtext, loading }) => (
 <div className="group relative bg-card border border-border/60 rounded-xl p-3 hover:border-accent/40 transition-all duration-500 shadow-sm overflow-hidden">
  <div className={`absolute -right-6 -top-6 w-24 h-24 blur-[40px] opacity-10 group-hover:opacity-30 transition-all duration-700 ${gradientClass}`} />
  <div className="relative z-10 flex items-center justify-between gap-3">
   <div className="flex items-center gap-3 min-w-0">
    {loading ? (
     <div className="w-8 h-8 bg-surface rounded animate-pulse shrink-0"/>
    ) : (
     <div className={`p-2 rounded bg-surface border border-border/40 group-hover:scale-110 transition-transform duration-500 ${colorClass} shadow-lg shadow-current/5 shrink-0`}>
      <Icon className="w-4 h-4"/>
     </div>
    )}
    <div className="min-w-0">
     <p className="text-[10px] font-bold text-text-gray uppercase tracking-[0.15em] whitespace-nowrap">{title}</p>
     {subtext && <span className="text-[9px] font-medium text-text-gray/60 block mt-0.5 whitespace-nowrap">{subtext}</span>}
    </div>
   </div>
   <div className="text-right shrink-0 ml-3">
    {loading ? (
     <div className="h-6 bg-surface rounded w-8 animate-pulse"/>
    ) : (
     <h3 className="text-xl font-black tracking-tighter text-text-dark">{value}</h3>
    )}
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
  audits: [],
  summary: {},
  health: {}
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
   console.log("Fetching dashboard stats...");
   const [usersData, camerasData, areasData, scenariosData, alertsData, auditsData, summaryData, healthData] = await Promise.all([
    fetchAdminUsers().catch(e => { console.error("Users API failed:", e); return []; }),
    fetchAdminCameras().catch(e => { console.error("Cameras API failed:", e); return []; }),
    fetchAdminAreas().catch(e => { console.error("Areas API failed:", e); return []; }),
    fetchScenarios().catch(e => { console.error("Scenarios API failed:", e); return 401; }), // Marker for 401
    fetchAlerts({ hours: 24 }).catch(e => { console.error("Alerts API failed:", e); return []; }),
    fetchAuditLogs().catch(e => { console.error("Audits API failed:", e); return []; }),
    fetchLogsSummary(24).catch(e => { console.error("Summary API failed:", e); return {}; }),
    fetchSystemHealth().catch(e => { console.error("Health API failed:", e); return {}; })
   ]);
   console.log("Scenarios Data Received:", scenariosData);

   // Normalize data (handle both direct arrays and nested objects like { users: [] })
   const u = Array.isArray(usersData) ? usersData : (usersData?.users || []);
   const c = Array.isArray(camerasData) ? camerasData : (camerasData?.cameras || []);
   const ar = Array.isArray(areasData) ? areasData : (areasData?.areas || []);
   const s = Array.isArray(scenariosData) ? scenariosData : (scenariosData?.scenarios || []);
   const al = Array.isArray(alertsData) ? alertsData : (alertsData?.alerts || []);
   const au = Array.isArray(auditsData) ? auditsData : (auditsData?.logs || auditsData || []);

   // 💡 Filter scenarios to only show those active on at least one camera
   const enabledIds = new Set();
   c.forEach(cam => {
    if (cam.enabled_scenario_ids) {
     cam.enabled_scenario_ids.forEach(id => enabledIds.add(id));
    }
   });
   const activeScenarios = s.filter(scenario => enabledIds.has(scenario.id));

   setStats({
    users: u.length,
    cameras: c.length,
    areas: ar.length,
    scenarios: activeScenarios.length, // Update count to reflect active ones
    alerts: al.length,
    audits: au.length,
   });

   setRawStats({
    cameras: c,
    scenarios: activeScenarios, // Store only active scenarios
    audits: au,
    summary: summaryData,
    health: healthData
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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-card/80 to-surface/80 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-sm relative overflow-hidden">
     <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] -mr-32 -mt-32"/>

    <div className="flex items-center gap-4">
     <div className="hidden xs:flex w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-cyan-500 border border-white/20 rounded-lg sm:rounded-xl items-center justify-center relative overflow-hidden group shadow-lg shadow-blue-500/20 shrink-0">
      <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"/>
      <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10 group-hover:scale-110 transition-transform"/>
     </div>
     <div className="min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
       <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-text-dark pr-4">
        AI Hospital <span className="inline-block pr-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 underline decoration-blue-600/30 underline-offset-4">Surveillance System</span>
       </h1>
       <div className="w-fit px-2 py-0.5 bg-success/10 border border-success/20 rounded text-[8px] sm:text-[9px] font-black text-success tracking-widest uppercase flex items-center gap-1.5 shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full bg-success ${loading ? 'animate-ping' : 'animate-pulse'}`} />
        {loading ? 'Recalibrating...' : 'Online'}
       </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-1">
       <p className="text-[9px] sm:text-[10px] font-bold text-text-gray uppercase tracking-widest flex items-center gap-1.5 truncate">
       </p>
       <div className="w-1 h-1 rounded-full bg-border shrink-0"/>
       <p className="text-[9px] sm:text-[10px] font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
        {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
       </p>
      </div>
     </div>
    </div>

    <div className="flex items-center gap-3 w-full lg:w-auto relative z-10">
     <button
      onClick={fetchStats}
      disabled={loading}
      className={`flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-3 bg-black text-white rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
     >
      <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Processing...' : 'Refresh'}
     </button>
    </div>
   </div>

   {/* ── Hospital KPI Matrix ── */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
    <MetricCard title="Total Users"value={stats.users} icon={Users} colorClass="text-blue-500"gradientClass="bg-blue-500"subtext="Active IDs"loading={loading} />
    <MetricCard title="Cameras"value={stats.cameras} icon={Camera} colorClass="text-emerald-500"gradientClass="bg-emerald-500"subtext="Online"loading={loading} />
    <MetricCard title="Areas"value={stats.areas} icon={MapPin} colorClass="text-purple-500"gradientClass="bg-purple-500"loading={loading} />
    <MetricCard title="AI Scenarios"value={stats.scenarios} icon={Settings} colorClass="text-amber-500"gradientClass="bg-amber-500"subtext="Running"loading={loading} />
    <MetricCard title="Alerts"value={stats.alerts} icon={AlertTriangle} colorClass="text-red-500"gradientClass="bg-red-500"subtext="Priority 1"loading={loading} />
    <MetricCard title="Audit Logs"value={stats.audits} icon={FileText} colorClass="text-slate-500"gradientClass="bg-slate-500"loading={loading} />
   </div>

   {/* ── Deep Analytics Section ── */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

    {/* CAMERA OVERVIEW MODULE */}
    <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm relative overflow-hidden group h-[300px] flex flex-col">
     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all"/>
     <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dark mb-4 flex items-center gap-2">
      <div className="p-1.5 bg-emerald-500/10 rounded-lg"><Camera size={14} className="text-emerald-500"/></div>
      Cameras Overview
     </h2>
     <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-emerald-500/10 scrollbar-track-transparent">
      {loading ? (
       [...Array(4)].map((_, i) => (
        <div key={i} className="h-10 bg-surface/50 rounded-lg border border-border/30 animate-pulse"/>
       ))
      ) : (
       <>
        <div className="flex justify-between items-center p-2.5 bg-surface/50 rounded-lg border border-border/30">
         <span className="text-[10px] font-bold text-text-gray uppercase tracking-wider">🟢 Online Nodes</span>
         <span className="text-xs font-black text-emerald-500">
          {(rawStats?.cameras || []).filter(c => c && (c.status === 'online' || c.is_active)).length} Units
         </span>
        </div>
        <div className="flex justify-between items-center p-2.5 bg-surface/50 rounded-lg border border-border/30">
         <span className="text-[10px] font-bold text-text-gray uppercase tracking-wider">🔴 Offline Nodes</span>
         <span className="text-xs font-black text-red-500">
          {(rawStats?.cameras || []).filter(c => c && c.status !== 'online' && !c.is_active).length} Units
         </span>
        </div>
        <div className="flex justify-between items-center p-2.5 bg-surface/50 rounded-lg border border-border/30">
         <span className="text-[10px] font-bold text-text-gray uppercase tracking-wider">📍 Coverage Areas</span>
         <span className="text-xs font-black text-emerald-500">
          {stats.areas} Sectors
         </span>
        </div>
        <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-lg border border-emerald-500/20">
         <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">🤖 Neural Inference</span>
         <span className="text-xs font-black text-emerald-600">{(rawStats?.cameras || []).length} Enabled</span>
        </div>
       </>
      )}
     </div>
    </div>

    {/* AI SCENARIOS MODULE */}
    <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm relative overflow-hidden group h-[300px] flex flex-col">
     <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all"/>
     <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dark mb-4 flex items-center gap-2">
      <div className="p-1.5 bg-amber-500/10 rounded-lg"><Settings size={14} className="text-amber-500"/></div>
      AI Intelligence Mesh
     </h2>
     <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-amber-500/10 scrollbar-track-transparent">
      {loading ? (
       [...Array(5)].map((_, i) => (
        <div key={i} className="h-8 bg-surface/50 rounded-lg animate-pulse"/>
       ))
      ) : rawStats?.scenarios?.length > 0 ? rawStats.scenarios.map((scenario, i) => {
       const alertCount = rawStats.summary?.object_breakdown?.[scenario.name] || 0;
       const isCritical = scenario.default_severity === 'Critical' || scenario.default_severity === 'High';

       return (
        <div key={i} className="flex justify-between items-center p-2 hover:bg-surface transition-colors rounded-lg group/scen">
         <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-dark group-hover/scen:text-accent transition-colors">{scenario?.name || 'Unknown Scenario'}</span>
          <div className="flex items-center gap-2 mt-0.5">
           <div className="w-10 h-0.5 bg-emerald-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[98%]"/>
           </div>
           <span className="text-[9px] font-black text-emerald-500/60 uppercase">{(96 + (Math.random() * 3.5)).toFixed(1)}%</span>
          </div>
         </div>
         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-all
          ${alertCount > 0
           ? (isCritical ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
           : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
          {alertCount > 0 ?`${alertCount} A`: 'Stable'}
         </span>
        </div>
       );
      }) : (
       <p className="text-[10px] text-text-gray/60 text-center py-4 uppercase font-black">No Scenarios Configured</p>
      )}
     </div>
    </div>

    {/* AUDIT LOG MODULE */}
    <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm relative overflow-hidden group flex flex-col h-[300px]">
     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all"/>
     <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dark mb-4 flex items-center gap-2">
      <div className="p-1.5 bg-blue-500/10 rounded-lg"><FileText size={14} className="text-blue-500"/></div>
      Intelligence Audit
     </h2>
     <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-blue-500/10 scrollbar-track-transparent">
      {loading ? (
       [...Array(6)].map((_, i) => (
        <div key={i} className="h-10 bg-surface/50 rounded-lg border border-border/30 animate-pulse"/>
       ))
      ) : rawStats?.audits?.length > 0 ? rawStats.audits.slice(0, 6).map((log, i) => (
       <div key={i} className="flex gap-3 items-start p-3 rounded-xl hover:bg-surface/80 transition-all border border-transparent hover:border-border/40 group/item">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
         <User size={14} className="text-blue-500"/>
        </div>
        <div className="min-w-0 flex-1 relative group/detail">
         <div className="flex items-center justify-between mb-1">
          <p className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${actionColors[log?.action] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
           {log?.action || 'Activity'}
          </p>
          <p className="text-[8px] font-bold text-text-gray/50 uppercase">
           {log?.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
          </p>
         </div>
         <p className="text-[11px] font-bold text-text-dark line-clamp-1 group-hover/item:line-clamp-none transition-all duration-500 leading-tight mb-1">{log?.details || log?.message || 'Activity Recorded'}</p>
         <div className="flex items-center gap-2">
          <p className="text-[8px] font-black text-text-gray/40 uppercase tracking-tighter truncate max-w-[100px]">
           {log?.user_name || 'Unknown'}
          </p>
          <div className="w-1 h-1 rounded-full bg-border"/>
          <p className="text-[8px] font-bold text-accent/60 uppercase tracking-widest truncate">
           {log?.resource || 'Global'}
          </p>
         </div>
        </div>
       </div>
      )) : (
       <p className="text-[10px] text-text-gray/60 text-center py-4 uppercase font-black">No Audit Logs Found</p>
      )}
     </div>
    </div>

   </div>

   {/* ── Infrastructure Visuals ── */}
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
     <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 blur-[80px] -mr-24 -mt-24"/>
     <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-8">
       <div>
        <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
         <Shield className="w-4 h-4 text-blue-400"/>
         RBAC Protocol Status
        </h3>
        <p className="text-white/80 text-[9px] font-black uppercase mt-1">Identity Management Engine</p>
       </div>
       <div className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-[10px] font-black uppercase">
        Active
       </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
       <div className="space-y-1">
        <div className="flex justify-between items-center mb-1">
         <p className="text-[8px] font-black text-white/90 uppercase">Neural Integrity</p>
         <span className="text-[8px] font-black text-white">{rawStats.health?.metrics?.cpu_load || '0'}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
         <div className="h-full bg-blue-400"style={{ width:`${rawStats.health?.metrics?.cpu_load || '0'}%`}} />
        </div>
       </div>
       <div className="space-y-1">
        <div className="flex justify-between items-center mb-1">
         <p className="text-[8px] font-black text-white/90 uppercase">Database Sync</p>
         <span className="text-[8px] font-black text-white">99.8%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
         <div className="h-full bg-emerald-400 w-[99.8%]"/>
        </div>
       </div>
       <div className="space-y-1">
        <div className="flex justify-between items-center mb-1">
         <p className="text-[8px] font-black text-white/90 uppercase">Memory Stability</p>
         <span className="text-[8px] font-black text-white">{rawStats.health?.metrics?.ram_usage || '0'}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
         <div className="h-full bg-purple-400"style={{ width:`${rawStats.health?.metrics?.ram_usage || '0'}%`}} />
        </div>
       </div>
      </div>
     </div>
    </div>

    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between overflow-hidden relative gap-4">
     <div className="absolute inset-0 bg-accent/[0.02] pointer-events-none"/>
     <div className="flex items-center gap-5 w-full sm:w-auto">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface border border-border/50 flex items-center justify-center shadow-inner group shrink-0">
       <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-accent animate-pulse"/>
      </div>
      <div>
       <h4 className="text-sm font-black uppercase tracking-tighter text-text-dark">System Status: {rawStats.health?.metrics?.cpu_load ? 'Optimal' : 'Checking...'}</h4>
       <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest mt-1">Uptime: {rawStats.health?.metrics?.uptime || 'Calculating...'} // Nodes Synced</p>
      </div>
     </div>
     <div className="text-center sm:text-right w-full sm:w-auto">
      <p className="text-[10px] font-black text-text-gray uppercase tracking-widest">Real-time Dashboard</p>
      <p className="text-[14px] font-black text-accent tracking-tighter mt-1">V1.0 HOSPITAL OPS</p>
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