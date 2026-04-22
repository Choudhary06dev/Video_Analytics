import React, { useState, useEffect, useCallback } from 'react';
import { fetchIntelligence } from '../api';
import { fetchAdminCameras, getStreamUrl } from '../services/cameraService';
import { fetchLogs, fetchLogsSummary, subscribeToEvents } from '../services/alertService';
import { EVENTS_URL, VIDEO_FEED_URL } from '../api';
import {
  Radio,
  Shield,
  Cpu,
  Settings,
  ChevronRight,
  Target,
  BarChart2,
  Lock,
  Wifi,
  Activity,
  Filter,
  Crosshair,
  Phone,
  Car,
  Package,
  Flame,
  AlertTriangle,
  Users,
  AlertCircle,
  LayoutGrid
} from 'lucide-react';

const SCENARIO_UI = {
  'Staff/Visitor Activity': { icon: Lock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Weapon Detection (Gun/Knife)': { icon: Crosshair, color: 'text-rose-500', bg: 'bg-rose-500/15' },
  'Mobile Phone Usage - Restricted': { icon: Phone, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'Vehicle Observation': { icon: Car, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'Object Left Unattended': { icon: Package, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  'Fire / Smoke Detection': { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/15' },
  'Aggressive Behaviour Detection': { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-600/10' },
  'Multiple Persons - Single Access': { icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  'Electronic Device Detected': { icon: Cpu, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  'Surveillance Monitor Active': { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'Aerial Object Detected': { icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  'Maritime Vessel Detected': { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  'Rail Transit Detected': { icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'Animal Intrusion Detected': { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-600/10' },
  'Consumable Item Detected': { icon: Package, color: 'text-yellow-600', bg: 'bg-yellow-600/10' },
  'Furniture Displacement': { icon: Package, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  'Recreational Activity Detected': { icon: Target, color: 'text-lime-500', bg: 'bg-lime-500/10' },
  'Potential Weapon - Blunt Object': { icon: Shield, color: 'text-rose-400', bg: 'bg-rose-400/15' },
  'Traffic Signal Detected': { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  'Parking Zone Detected': { icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Default': { icon: Target, color: 'text-slate-400', bg: 'bg-slate-400/10' }
};
import CameraFeed from '../components/camera/CameraFeed';

export default function NeuralStream() {
  const [logs, setLogs] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);
  const [isGlobalView, setIsGlobalView] = useState(true);
  const [gridSize, setGridSize] = useState(3); // 2x2 (2), 3x3 (3), 4x4 (4)
  const [intel, setIntel] = useState({ person_count: 0, objects: [], stable_objects: [] });
  const [filterHours, setFilterHours] = useState(1);
  const [logsOffset, setLogsOffset] = useState(0);
  const PAGE_SIZE = 50;
  const [summary, setSummary] = useState({
    total_persons: 0,
    total_weapons: 0,
    total_vehicles: 0,
    count: 0,
    threat_level: 'Normal',
    status_message: 'Security posture stable',
    object_breakdown: {}
  });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      const data = await fetchAdminCameras();
      setCameras(data || []);
      if (data && data.length > 0 && !activeCamera) {
          // If we want a default selected camera, we could do it here
      }
    } catch (err) {
      console.error('Failed to load cameras:', err);
    }
  };

  const fetchLogsData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoadingLogs(true);
    try {
      const camId = isGlobalView ? undefined : activeCamera;
      const logsData = await fetchLogs({ hours: filterHours, camera_id: camId, limit: PAGE_SIZE, skip: logsOffset });

      if (Array.isArray(logsData)) {
        setLogs(logsData.slice(0, 50).map(log => {
          const scenario = SCENARIO_UI[log.scenario_key] || SCENARIO_UI['Default'];
          const isAlert = log.is_alert || false;
          const detail = log.metadata_json?.detail || log.scenario_key.toUpperCase();

          const logDate = new Date(log.timestamp);
          const now = new Date();
          const diffMs = Math.max(0, now - logDate);
          const diffMins = Math.floor(diffMs / 60000);
          const diffHrs = Math.floor(diffMins / 60);
          let timeAgo = '';
          if (diffMins < 1) timeAgo = 'Just now';
          else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
          else timeAgo = `${diffHrs}h ${diffMins % 60}m ago`;

          return {
            id: log.id,
            eventId: `EVT-${logDate.getTime().toString().slice(-6)}-${log.id}`,
            type: detail,
            icon: scenario.icon,
            color: scenario.color,
            bg: isAlert ? 'bg-rose-500/20' : scenario.bg,
            iconColor: isAlert ? 'text-rose-600' : scenario.color,
            isAlert: isAlert,
            camera: `CAM-${log.camera_id.toString().padStart(2, '0')}`,
            confidence: `${(log.confidence * 100).toFixed(1)}%`,
            timestamp: logDate.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timeAgo: timeAgo,
            severity: log.severity.toUpperCase()
          };
        }));
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [filterHours, activeCamera, isGlobalView, logsOffset]);

  useEffect(() => {
    let source;
    let retryTimer;

    const connect = () => {
      source = new EventSource(EVENTS_URL);
      source.onopen = () => setStreamConnected(true);
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && !data.detail) {
            setIntel(data);
            fetchLogsData(false);
          }
        } catch (err) {
          console.error('Event parsing failed:', err);
        }
      };
      source.onerror = () => {
        setStreamConnected(false);
        if (source) source.close();
        retryTimer = window.setTimeout(connect, 1500);
      };
    };

    connect();
    fetchLogsData(true);

    return () => {
      if (source) source.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [fetchLogsData]);

  useEffect(() => {
    let intelTimeout;
    let logsTimeout;
    let isActive = true;

    const pollIntel = async () => {
      if (!isActive) return;
      try {
        const camId = isGlobalView ? undefined : activeCamera;
        const [intelRes, summaryRes] = await Promise.all([
          fetchIntelligence(),
          fetchLogsSummary(filterHours, camId)
        ]);

        if (intelRes && !intelRes.detail) setIntel(intelRes);
        if (summaryRes && !summaryRes.detail) setSummary(summaryRes);
      } catch {}
      intelTimeout = setTimeout(pollIntel, 1000);
    };

    const pollLogs = async () => {
      if (!isActive) return;
      try { await fetchLogsData(false); } catch {}
      logsTimeout = setTimeout(pollLogs, 2000);
    };

    pollIntel();
    pollLogs();

    return () => {
      isActive = false;
      clearTimeout(intelTimeout);
      clearTimeout(logsTimeout);
    };
  }, [fetchLogsData, filterHours, activeCamera, isGlobalView]);

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-4 bg-bg font-sans transition-colors duration-300">
      {/* COMPACT HEADER */}
      <div className="flex justify-between items-center bg-card px-5 py-3 rounded-lg border border-border shadow-premium shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-dark tracking-tight">Command Hub</h1>
              <div className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded text-[0.55rem] font-bold tracking-widest flex items-center gap-1.5 uppercase">
                <div className="relative flex">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-ping absolute opacity-75" />
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                </div>
                Live
              </div>
            </div>
            <div className="flex items-center gap-3 text-[0.65rem] text-text-gray font-medium">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Engine v4.8</span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="text-accent">Sync: 99.9%</span>
              <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${streamConnected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{streamConnected ? 'Events Online' : 'Reconnecting'}</span>
            </div>
          </div>
        </div>

        {/* STATS BAR IN HEADER */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Grid Layout Switcher (Only visible in Global View) */}
          {isGlobalView && (
             <div className="flex bg-surface p-1 rounded-lg border border-border mr-2">
                {[2, 3, 4].map(num => (
                   <button
                     key={num}
                     onClick={() => setGridSize(num)}
                     className={`px-3 py-1 rounded-md font-bold text-[0.65rem] transition-all uppercase tracking-widest
                     ${gridSize === num ? 'bg-card text-accent shadow-premium border border-border' : 'text-text-gray hover:text-text-dark'}`}
                   >
                     {num}x{num}
                   </button>
                ))}
             </div>
          )}

          {/* Threat Assessment Badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-500
              ${summary.threat_level === 'Critical' ? 'bg-rose-500/15 border-rose-500/30' :
              summary.threat_level === 'Elevated' ? 'bg-amber-500/15 border-amber-500/30' :
                'bg-emerald-500/10 border-emerald-500/20'}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${summary.threat_level === 'Critical' ? 'bg-rose-500' :
              summary.threat_level === 'Elevated' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className={`text-[0.6rem] font-black uppercase tracking-widest ${summary.threat_level === 'Critical' ? 'text-rose-600' :
              summary.threat_level === 'Elevated' ? 'text-amber-600' : 'text-emerald-600'}`}>
              {summary.threat_level || 'Checking...'}
            </span>
            <Shield className={`w-3.5 h-3.5 ${summary.threat_level === 'Critical' ? 'text-rose-600' :
              summary.threat_level === 'Elevated' ? 'text-amber-600' : 'text-emerald-600'}`} />
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${summary.total_weapons > 0 ? 'bg-rose-500 border-rose-600' : 'bg-surface border-border'}`}>
              <Target className={`w-3.5 h-3.5 ${summary.total_weapons > 0 ? 'text-white' : 'text-text-gray'}`} />
              <span className={`text-sm font-black ${summary.total_weapons > 0 ? 'text-white' : 'text-text-dark'}`}>{summary.total_weapons || 0}</span>
            </div>
            <div className="bg-surface px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm font-black text-text-dark">{summary.count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* STREAMING MATRIX (Dynamic Focus vs Global) */}
      <div className="w-full shrink-0 overflow-hidden bg-card rounded-lg border border-border shadow-premium p-4 flex gap-4">
          
          {/* CAMERA SELECTION SIDEBAR (Small Strip) */}
          <div className="w-20 md:w-40 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 shrink-0 border-r border-border/50">
             <div
               onClick={() => { setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); }}
               className={`aspect-video rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${isGlobalView ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'border-border/50 bg-surface hover:border-accent/40'}`}
             >
                <LayoutGrid className={`w-5 h-5 mb-1 ${isGlobalView ? 'text-accent' : 'text-text-gray'}`} />
                <span className={`text-[0.55rem] font-black uppercase tracking-widest ${isGlobalView ? 'text-accent' : 'text-text-gray'} hidden md:block`}>Matrix</span>
             </div>
             
             {cameras.map(cam => {
                const isActive = activeCamera === cam.id && !isGlobalView;
                return (
                   <div 
                     key={cam.id}
                     onClick={() => { setActiveCamera(cam.id); setIsGlobalView(false); setLogsOffset(0); }}
                     className={`aspect-video rounded-lg border-2 cursor-pointer transition-all overflow-hidden relative group
                       ${isActive ? 'border-accent shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'border-black hover:border-accent/40'}
                     `}
                   >
                     {/* Thumbnail preview - since it's hard to stream 20 cameras, we'll stream the active one or a placeholder image */}
                     {isActive ? (
                         <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${cam.id}`} hideOverlay={true} />
                     ) : (
                         <div className="w-full h-full bg-slate-900 border border-white/5 flex items-center justify-center relative">
                             <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)]" />
                             <Radio className="w-4 h-4 text-white/20" />
                         </div>
                     )}
                     <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[0.45rem] font-black text-white uppercase tracking-widest">{cam.name}</span>
                     </div>
                     {isActive && <div className="absolute inset-0 ring-inset ring-2 ring-accent/50 rounded-lg" />}
                   </div>
                )
             })}
          </div>

          {/* MAIN STREAMING AREA */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-black rounded-lg relative border border-border overflow-hidden">
             {isGlobalView ? (
                /* Dynamic Grid Reflow */
                <div 
                  className="grid h-full p-2 gap-2"
                  style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                >
                   {cameras.slice(0, gridSize * gridSize).map(cam => (
                      <div key={cam.id} className="relative bg-slate-900 rounded-lg overflow-hidden border border-white/10 group">
                         <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${cam.id}`} hideOverlay={true} />
                         <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent">
                            <span className="text-[0.55rem] font-black text-white/80 uppercase tracking-widest block mb-0.5">Stream-{cam.id}</span>
                            <span className="text-[0.7rem] font-bold text-white tracking-tight leading-none">{cam.name}</span>
                         </div>
                         <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur border border-white/10 rounded font-black text-[0.55rem] text-accent flex items-center gap-1 uppercase">
                             <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" /> Live
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                /* Focus Mode */
                <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                   {activeCamera && <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${activeCamera}`} hideOverlay={true} />}
                   <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                      <div className="px-3 py-1 bg-black/60 backdrop-blur border border-white/10 rounded-lg">
                          <span className="text-[0.6rem] font-black text-white/50 uppercase tracking-widest block mb-0.5">Neural Stream Active</span>
                          <span className="text-[1rem] font-bold text-white tracking-tight">
                             {cameras.find(c => c.id === activeCamera)?.name || 'Unknown Zone'}
                          </span>
                      </div>
                      <div className="flex gap-2">
                         <div className="px-2 py-1 bg-accent/20 border border-accent/30 rounded text-[0.55rem] font-black text-accent uppercase tracking-widest flex items-center gap-1.5">
                            <Shield className="w-3 h-3" /> Encrypted Link
                         </div>
                      </div>
                   </div>
                   
                   {/* Overlay HUD lines just for aesthetic Focus Mode */}
                   <div className="absolute inset-x-8 top-1/2 h-[1px] bg-accent/10 pointer-events-none" />
                   <div className="absolute inset-y-8 left-1/2 w-[1px] bg-accent/10 pointer-events-none" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none border border-accent/20 rounded-full" />
                </div>
             )}
          </div>
      </div>


      {/* FULL-WIDTH INTELLIGENCE & BREAKDOWN SECTION */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* LOGS TABLE OVERVIEW */}
        <div className="flex-1 bg-card rounded-lg border border-border shadow-premium flex flex-col overflow-hidden min-w-0">
          {/* LOGS HEADER + FILTERS */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 text-accent rounded-lg border border-accent/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-text-dark tracking-tight">Intelligence Logs</h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[0.55rem] font-bold text-emerald-600 uppercase tracking-tighter">Live Sync</span>
                  </div>
                </div>
                <p className="text-[0.6rem] font-medium text-text-gray uppercase tracking-widest">{isGlobalView ? 'System Wide' : `Selected: CAM-0${activeCamera}`} — {logs.length} Events</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Message */}
              <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[0.6rem] font-bold
                ${summary.threat_level === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' :
                  summary.threat_level === 'Elevated' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
                {summary.status_message || 'Initializing...'}
              </div>

              <button
                onClick={() => { setIsGlobalView(!isGlobalView); setLogsOffset(0); }}
                className={`p-2 rounded-lg text-xs font-semibold transition-all border
              ${isGlobalView ? 'bg-accent text-white border-accent' : 'bg-surface text-text-gray border-border hover:border-accent/40'}`}
                title="Toggle Global View"
              >
                <Filter className="w-4 h-4" />
              </button>
              <div className="flex bg-surface p-1 rounded-lg border border-border">
                {[
                  { label: '15M', val: 0.25 },
                  { label: '1H', val: 1 },
                  { label: '6H', val: 6 },
                  { label: '12H', val: 12 },
                  { label: '24H', val: 24 },
                  { label: '7D', val: 168 },
                  { label: '30D', val: 720 }
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => { setFilterHours(f.val); setLogsOffset(0); }}
                    className={`px-3 py-1 rounded-md font-bold text-[0.65rem] transition-all
                  ${filterHours === f.val ? 'bg-card text-accent shadow-premium border border-border' : 'text-text-gray hover:text-text-dark'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE HEADER */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-surface/50 border-b border-border text-[0.6rem] font-black text-text-gray uppercase tracking-widest">
            <div className="col-span-1">Status</div>
            <div className="col-span-3">Event</div>
            <div className="col-span-2">Event ID</div>
            <div className="col-span-1">Camera</div>
            <div className="col-span-1">Confidence</div>
            <div className="col-span-1">Severity</div>
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-1">Elapsed</div>
          </div>

          {/* LOG ROWS */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingLogs ? (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin mb-3"></div>
                <div className="text-xs text-text-gray uppercase tracking-widest font-bold">Fetching Logs...</div>
              </div>
            ) : logs.length > 0 ? logs.map((log) => (
              <div
                key={log.id}
                className={`grid grid-cols-12 gap-2 px-5 py-2.5 items-center transition-all duration-200 border-b hover:bg-card-hover cursor-default
              ${log.isAlert ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10' : 'border-border/30'}`}
              >
                {/* Icon */}
                <div className="col-span-1">
                  <div className={`w-8 h-8 rounded-lg ${log.bg} flex items-center justify-center border border-border/10`}>
                    <log.icon className={`w-4 h-4 ${log.iconColor}`} />
                  </div>
                </div>

                {/* Event Detail */}
                <div className="col-span-3 flex items-center gap-2 min-w-0">
                  <span className={`text-[0.7rem] font-extrabold tracking-wide uppercase ${log.iconColor} truncate`}>
                    {log.type}
                  </span>
                  {log.isAlert && (
                    <span className="text-rose-500 text-[0.55rem] font-black animate-pulse uppercase tracking-wider shrink-0">⚠ Alert</span>
                  )}
                </div>

                {/* Event ID */}
                <div className="col-span-2">
                  <span className="text-[0.6rem] font-mono text-text-gray">{log.eventId}</span>
                </div>

                {/* Camera */}
                <div className="col-span-1">
                  <span className="flex items-center gap-1.5 text-[0.65rem] font-bold text-text-dark">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    {log.camera}
                  </span>
                </div>

                {/* Confidence */}
                <div className="col-span-1">
                  <span className="text-[0.65rem] font-bold text-text-dark">{log.confidence}</span>
                </div>

                {/* Severity */}
                <div className="col-span-1">
                  <span className={`text-[0.5rem] px-1.5 py-0.5 rounded font-black tracking-widest uppercase border ${log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                      log.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                        log.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                          'bg-slate-500/20 text-slate-500 border-slate-500/30'
                    }`}>
                    {log.severity}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="col-span-2">
                  <span className="text-[0.65rem] font-mono text-text-dark font-bold">{log.timestamp}</span>
                </div>

                {/* Elapsed */}
                <div className="col-span-1">
                  <span className="text-[0.6rem] text-text-gray font-medium font-mono">{log.timeAgo}</span>
                </div>
              </div>
            )) : (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center mb-3 shadow-premium border border-border">
                  <Shield className="w-5 h-5 text-text-gray" />
                </div>
                <div className="text-sm font-bold text-text-dark">No Events Detected</div>
                <p className="text-[0.65rem] text-text-gray mt-1 uppercase tracking-wider font-bold">Adjust filters or view global matrix</p>
              </div>
            )}
          </div>

          {/* FOOTER BAR */}
          <div className="px-5 py-2 border-t border-border flex items-center justify-between bg-surface/30 shrink-0">
            <span className="text-[0.6rem] text-text-gray uppercase tracking-widest font-bold">
              Showing {summary.count ? logsOffset + 1 : 0}-{Math.min(logsOffset + logs.length, summary.count || 0)} of {summary.count || 0} events
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setLogsOffset(prev => Math.max(0, prev - PAGE_SIZE)); }}
                disabled={logsOffset === 0 || loadingLogs}
                className="px-3 py-1 bg-surface border border-border rounded text-[0.6rem] font-bold uppercase tracking-wider text-text-dark hover:bg-border disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => { setLogsOffset(prev => prev + PAGE_SIZE); }}
                disabled={logsOffset + logs.length >= (summary.count || 0) || loadingLogs}
                className="px-3 py-1 bg-surface border border-border rounded text-[0.6rem] font-bold uppercase tracking-wider text-text-dark hover:bg-border disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* DETAILED ACTIVITY BREAKDOWN PANEL */}
        <div className="w-[300px] xl:w-[320px] bg-card rounded-lg border border-border shadow-premium flex flex-col overflow-hidden shrink-0">
          <div className="px-5 py-3 border-b border-border bg-gradient-to-br from-surface to-bg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Target className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-2 mb-0.5">
              <BarChart2 className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-text-dark tracking-tight">Analytics Breakdown</h3>
            </div>
            <p className="text-[0.6rem] font-bold text-text-gray uppercase tracking-widest mt-1.5 flex justify-between">
              <span>Total Entities</span>
              <span className="text-accent">{summary.object_breakdown ? Object.values(summary.object_breakdown).reduce((a, b) => a + b, 0) : 0} detected</span>
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
            {summary.object_breakdown && Object.keys(summary.object_breakdown).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(summary.object_breakdown)
                  .sort((a, b) => b[1] - a[1]) // Sort highest count first
                  .map(([name, count]) => {
                    const scenario = SCENARIO_UI[name] || SCENARIO_UI['Default'];
                    return (
                      <div key={name} className="flex items-center p-2 rounded-lg hover:bg-surface transition-colors group">
                        <div className={`w-8 h-8 rounded-md ${scenario.bg} flex items-center justify-center border border-border/10 shrink-0`}>
                          <scenario.icon className={`w-3.5 h-3.5 ${scenario.iconColor}`} />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="text-[0.65rem] font-bold text-text-dark truncate uppercase tracking-wide group-hover:text-accent transition-colors">
                            {name}
                          </div>
                          <div className="w-full bg-border/50 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div className={`h-full ${scenario.bg.replace('/10', '').replace('/15', '')} ${scenario.bg.includes('rose') ? 'bg-rose-500' : scenario.bg.includes('amber') ? 'bg-amber-500' : 'bg-accent'}`} style={{ width: `${Math.min(100, (count / Math.max(1, summary.count || 1)) * 100)}%` }}></div>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center justify-center min-w-[2rem]">
                          <span className="text-sm font-black text-text-dark">{count}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center mb-2">
                  <Target className="w-4 h-4 text-border" />
                </div>
                <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest">No detailed analytics</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

