import React, { useState, useEffect, useCallback } from 'react';
import { fetchIntelligence, fetchLogs, fetchLogsSummary, EVENTS_URL, VIDEO_FEED_URL } from '../api';
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
import CameraFeed from '../components/dashboard/CameraFeed';

const CAMERAS = [
  { id: '01', status: 'bg-emerald-500', img: 'https://images.unsplash.com/photo-1558002038-1055907df827', name: 'ICU ENTRANCE' },
  { id: '02', status: 'bg-emerald-500', img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514', name: 'MAIN RECEPTION' },
  { id: '03', status: 'bg-emerald-500', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d', name: 'EMERGENCY BAY' },
  { id: '04', status: 'bg-emerald-500', img: 'https://images.unsplash.com/photo-1551076805-e1869033e561', name: 'SUPPLY CLOSET' },
  { id: '05', status: 'bg-emerald-500', img: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b', name: 'LAB SECTOR A' },
  { id: '06', status: 'bg-emerald-500', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c', name: 'NORTH PERIMETER' },
];

export default function NeuralStream() {
  const [logs, setLogs] = useState([]);
  const [activeCamera, setActiveCamera] = useState('01');
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [highlightCam, setHighlightCam] = useState(null); // eslint-disable-line no-unused-vars
  const [intel, setIntel] = useState({ person_count: 0, objects: [], stable_objects: [] });
  const [filterHours, setFilterHours] = useState(1);
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

  const fetchLogsData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoadingLogs(true);
    try {
      const camId = isGlobalView ? undefined : parseInt(activeCamera);
      const logsData = await fetchLogs({ hours: filterHours, camera_id: camId, limit: 50 });

      if (Array.isArray(logsData)) {
        const logsData2 = logsData;
        if (Array.isArray(logsData2)) {
          setLogs(logsData2.slice(0, 50).map(log => {
            const scenario = SCENARIO_UI[log.object_class] || SCENARIO_UI['Default'];
            const isAlert = log.metadata_json?.is_alert || false;
            const detail = log.metadata_json?.detail || log.object_class.toUpperCase();

            // Calculate elapsed time
            const logDate = new Date(log.timestamp);
            const now = new Date();
            const diffMs = Math.max(0, now - logDate);
            const diffMins = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMins / 60);
            let timeAgo = '';
            if (diffMins < 1) timeAgo = 'Just now';
            else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
            else timeAgo = `${diffHrs}h ${diffMins % 60}m ago`;

            // Determine severity
            let severity = 'LOW';
            if (isAlert) severity = 'CRITICAL';
            else if (log.confidence > 0.8 || log.object_class.includes('Vehicle') || log.object_class.includes('Unattended')) severity = 'HIGH';
            else if (log.confidence > 0.6) severity = 'MEDIUM';

            const eventId = `EVT-${logDate.getTime().toString().slice(-6)}-${log.id}`;

            return {
              id: log.id,
              eventId: eventId,
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
              severity: severity
            };
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [filterHours, activeCamera, isGlobalView]);

  useEffect(() => {
    let source;
    let retryTimer;

    const connect = () => {
      source = new EventSource(EVENTS_URL);

      source.onopen = () => {
        setStreamConnected(true);
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && !data.detail) {
            setIntel(data);
            // Trigger a silent refresh for logs when new data arrives
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
    fetchLogsData(true); // Show spinner on initial load

    return () => {
      if (source) source.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [fetchLogsData]);

  // [REMOVED EFFECT: Consolidating into one reliable poller below]

  // 🚀 Ultra-Reliable Sync Engine (Recursive Timeout Pattern)
  useEffect(() => {
    let intelTimeout;
    let logsTimeout;
    let isActive = true;

    const pollIntel = async () => {
      if (!isActive) return;
      try {
        const camId = isGlobalView ? undefined : parseInt(activeCamera);
        const [intelRes, summaryRes] = await Promise.all([
          fetchIntelligence(),
          fetchLogsSummary(filterHours, camId)
        ]);

        if (intelRes && !intelRes.detail) setIntel(intelRes);
        if (summaryRes && !summaryRes.detail) setSummary(summaryRes);
      } catch {
        // Silently handle network errors
      }
      intelTimeout = setTimeout(pollIntel, 1000);
    };

    const pollLogs = async () => {
      if (!isActive) return;
      try {
        await fetchLogsData(false); // Silent background poll
      } catch {
        // Silently handle fetch errors
      }
      logsTimeout = setTimeout(pollLogs, 2000);
    };

    // Start heartbeat
    pollIntel();
    pollLogs();

    return () => {
      isActive = false;
      clearTimeout(intelTimeout);
      clearTimeout(logsTimeout);
    };
  }, [fetchLogsData, filterHours, activeCamera, isGlobalView]);

  return (
    <div className="flex flex-col gap-4 pt-0 pb-4 px-6 min-h-screen bg-bg font-sans transition-colors duration-300">
      {/* COMPACT HEADER */}
      <div className="flex justify-between items-center bg-card px-5 py-3 rounded-xl border border-border shadow-premium">
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
        <div className="flex items-center gap-3">
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
            <div className="bg-surface px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm font-black text-text-dark">{summary.total_persons || 0}</span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${summary.total_weapons > 0 ? 'bg-rose-500 border-rose-600' : 'bg-surface border-border'}`}>
              <Target className={`w-3.5 h-3.5 ${summary.total_weapons > 0 ? 'text-white' : 'text-text-gray'}`} />
              <span className={`text-sm font-black ${summary.total_weapons > 0 ? 'text-white' : 'text-text-dark'}`}>{summary.total_weapons || 0}</span>
            </div>
            <div className="bg-surface px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-sm font-black text-text-dark">{summary.total_vehicles || 0}</span>
            </div>
            <div className="bg-surface px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm font-black text-text-dark">{summary.count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CAMERA STRIP - Compact Row */}
      <div className="grid grid-cols-7 gap-3">
        {/* ALL Cameras Selection */}
        <div
          onClick={() => setIsGlobalView(true)}
          className={`relative aspect-video rounded-lg overflow-hidden transition-all duration-300 cursor-pointer bg-card group border flex flex-col items-center justify-center
          ${isGlobalView ? 'border-accent shadow-[0_8px_20px_-6px_rgba(59,130,246,0.3)] ring-2 ring-accent/10 bg-accent/5' : 'border-border hover:border-accent/40 hover:bg-surface'}`}
        >
          <div className="absolute top-2 left-2 z-20 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 backdrop-blur-md rounded text-[0.55rem] font-bold text-text-dark uppercase tracking-wider border border-border shadow-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${isGlobalView ? 'bg-accent animate-pulse' : 'bg-text-gray'}`} />
              Global View
            </div>
          </div>
          <LayoutGrid className={`w-8 h-8 mb-1 transition-all ${isGlobalView ? 'text-accent scale-110' : 'text-text-gray group-hover:text-accent/60'}`} />
          <span className={`text-[0.6rem] font-black uppercase tracking-[0.2em] ${isGlobalView ? 'text-accent' : 'text-text-gray'}`}>All Feeds</span>
        </div>

        {CAMERAS.map((cam) => {
          const isActiveCam = activeCamera === cam.id && !isGlobalView;
          const isDetected = highlightCam === cam.id;

          return (
            <div
              key={cam.id}
              onClick={() => {
                setActiveCamera(cam.id);
                setIsGlobalView(false);
              }}
              className={`relative aspect-video rounded-lg overflow-hidden transition-all duration-300 cursor-pointer bg-card group border
              ${isActiveCam ? 'border-accent shadow-[0_8px_20px_-6px_rgba(59,130,246,0.3)] ring-2 ring-accent/10' : 'border-border hover:border-accent/40'}
              ${isDetected ? 'ring-4 ring-accent/10 animate-pulse' : ''}`}
            >
              <div className="absolute top-2 left-2 z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 backdrop-blur-md rounded text-[0.55rem] font-bold text-text-dark uppercase tracking-wider border border-border shadow-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${cam.status}`} />
                  {cam.name}
                </div>
              </div>

              <div className="absolute inset-0 bg-surface">
                {isActiveCam && cam.id === '01' ? (
                  <CameraFeed streamUrl={VIDEO_FEED_URL} hideOverlay={true} />
                ) : (
                  <img
                    src={`${cam.img}?auto=format&fit=crop&q=80&w=500`}
                    className={`w-full h-full object-cover transition-all duration-500 ${isActiveCam ? 'opacity-100' : 'opacity-80 group-hover:opacity-100 scale-100 group-hover:scale-105'}`}
                    alt="Stream"
                  />
                )}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:invert" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL-WIDTH INTELLIGENCE & BREAKDOWN SECTION */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* LOGS TABLE OVERVIEW */}
        <div className="flex-1 bg-card rounded-xl border border-border shadow-premium flex flex-col overflow-hidden min-w-0">
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
              onClick={() => setIsGlobalView(!isGlobalView)}
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
                  onClick={() => { setFilterHours(f.val); }}
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
                <span className={`text-[0.5rem] px-1.5 py-0.5 rounded font-black tracking-widest uppercase border ${
                  log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
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
              Showing {logs.length} of {summary.count || 0} events
            </span>
            <span className="text-success flex items-center gap-1.5 text-[0.6rem] uppercase tracking-widest font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Engine Sync Optimal
            </span>
          </div>
        </div>

        {/* DETAILED ACTIVITY BREAKDOWN PANEL */}
        <div className="w-[300px] xl:w-[320px] bg-card rounded-xl border border-border shadow-premium flex flex-col overflow-hidden shrink-0">
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
              <span className="text-accent">{summary.object_breakdown ? Object.values(summary.object_breakdown).reduce((a,b)=>a+b, 0) : 0} detected</span>
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
            {summary.object_breakdown && Object.keys(summary.object_breakdown).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(summary.object_breakdown)
                  .sort((a,b) => b[1] - a[1]) // Sort highest count first
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

