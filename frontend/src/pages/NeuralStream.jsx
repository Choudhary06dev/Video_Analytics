import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';

const SCENARIO_UI = {
  'Unauthorized Entry - Restricted Area': { icon: Lock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Weapon Detection (Gun/Knife)': { icon: Crosshair, color: 'text-rose-500', bg: 'bg-rose-500/15' },
  'Mobile Phone Usage - Restricted': { icon: Phone, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'Vehicle Observation': { icon: Car, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'Object Left Unattended': { icon: Package, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  'Fire / Smoke Detection': { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/15' },
  'Aggressive Behaviour Detection': { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-600/10' },
  'Multiple Persons - Single Access': { icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
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
  const [highlightCam, setHighlightCam] = useState(null);
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
  const stableLockActive = intel.stable_objects?.some(obj => obj === 'Unauthorized Entry - Restricted Area' || obj === 'Weapon Detection (Gun/Knife)');

  const fetchLogsData = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const camId = isGlobalView ? '' : `&camera_id=${parseInt(activeCamera)}`;
      const timestamp = Date.now();
      const logsRes = await fetch(`http://localhost:8000/logs?hours=${filterHours}${camId}&t=${timestamp}`);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (Array.isArray(logsData)) {
          setLogs(logsData.slice(0, 50).map(log => {
            const scenario = SCENARIO_UI[log.object_class] || SCENARIO_UI['Default'];
            const isAlert = log.metadata_json?.is_alert || false;
            const detail = log.metadata_json?.detail || log.object_class.toUpperCase();

            return {
              id: log.id,
              type: detail,
              icon: scenario.icon,
              color: scenario.color,
              bg: isAlert ? 'bg-rose-500/20' : scenario.bg,
              iconColor: isAlert ? 'text-rose-600' : scenario.color,
              isAlert: isAlert,
              camera: `CAM-${log.camera_id.toString().padStart(2, '0')}`,
              confidence: `${(log.confidence * 100).toFixed(1)}%`,
              timestamp: new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
      source = new EventSource('http://localhost:8000/events');

      source.onopen = () => {
        setStreamConnected(true);
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && !data.detail) {
            setIntel(data);
            fetchLogsData();
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
    fetchLogsData();

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
        const timestamp = Date.now();
        const camIdParam = isGlobalView ? '' : `&camera_id=${parseInt(activeCamera)}`;
        
        const [intelRes, summaryRes] = await Promise.all([
          fetch(`http://localhost:8000/intelligence?t=${timestamp}`).then(r => r.json()),
          fetch(`http://localhost:8000/logs/summary?hours=${filterHours}${camIdParam}&t=${timestamp}`).then(r => r.json())
        ]);

        if (intelRes && !intelRes.detail) setIntel(intelRes);
        if (summaryRes && !summaryRes.detail) setSummary(summaryRes);
      } catch (e) {}
      intelTimeout = setTimeout(pollIntel, 1000);
    };

    const pollLogs = async () => {
      if (!isActive) return;
      try {
        await fetchLogsData();
      } catch (e) {}
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
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-bg font-sans transition-colors duration-300">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-premium">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-dark tracking-tight">Command Hub</h1>
              <div className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded text-[0.6rem] font-bold tracking-widest flex items-center gap-1.5 uppercase">
                <div className="relative flex">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-ping absolute opacity-75" />
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                </div>
                Live Stream Active
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-gray font-medium font-sans">
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Engine v4.8</span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="text-accent">Sync: 99.9%</span>
              <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${streamConnected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{streamConnected ? 'Events Online' : 'Reconnecting'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-[0.25em] text-text-gray font-bold mb-3">Live presence</div>
          <div className="text-4xl font-extrabold text-text-dark">{intel.person_count}</div>
          <div className="text-[0.75rem] text-text-gray uppercase tracking-widest mt-2">People in frame</div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-[0.25em] text-text-gray font-bold mb-3">Active objects</div>
          <div className="text-4xl font-extrabold text-text-dark">{intel.objects.length}</div>
          <div className="text-[0.75rem] text-text-gray uppercase tracking-widest mt-2">Current classes</div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-[0.25em] text-text-gray font-bold">
            <span>Stable lock</span>
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${stableLockActive ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {stableLockActive ? 'ALERT' : intel.stable_objects.length > 0 ? 'LOCKED' : 'IDLE'}
            </span>
          </div>
          <div className="text-4xl font-extrabold text-text-dark">{intel.stable_objects.length}</div>
          <div className="text-[0.75rem] text-text-gray uppercase tracking-widest mt-2">Stable scenarios</div>
        </div>
      </div>

      <div className="flex gap-6 items-start h-[calc(100vh-140px)]">
        {/* CAMERA MATRIX */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 h-full content-start overflow-y-auto pr-2 custom-scrollbar">
          {CAMERAS.map((cam) => {
            const isActive = activeCamera === cam.id;
            const isDetected = highlightCam === cam.id;
            const cameraLogs = logs.filter((log) => log.camera === `CAM-${cam.id}`);
            const latestCameraLog = cameraLogs[0];

            return (
              <div
                key={cam.id}
                onClick={() => {
                  setActiveCamera(cam.id);
                  setIsGlobalView(false);
                }}
                className={`relative aspect-video rounded-xl overflow-hidden transition-all duration-300 cursor-pointer bg-card group border
                ${isActive ? 'border-accent shadow-[0_12px_24px_-8px_rgba(59,130,246,0.3)] ring-2 ring-accent/10' : 'border-border hover:border-accent/40'}
                ${isDetected ? 'ring-4 ring-accent/10 animate-pulse' : ''}`}
              >
                {/* CLEAN HUD OVERLAY */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none transition-opacity duration-300">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-card/90 backdrop-blur-md rounded-lg text-[0.65rem] font-bold text-text-dark uppercase tracking-wider border border-border shadow-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${cam.status}`} />
                    {cam.name}
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 backdrop-blur-md rounded text-[0.6rem] font-medium text-text-gray border border-border shadow-sm">
                    <Wifi className="w-3 h-3" /> 12ms
                  </div>
                </div>

                <div className="absolute inset-0 bg-surface">
                  {isActive && cam.id === '01' ? (
                    <CameraFeed streamUrl="http://localhost:8000/video_feed" hideOverlay={true} />
                  ) : (
                    <img
                      src={`${cam.img}?auto=format&fit=crop&q=80&w=800`}
                      className={`w-full h-full object-cover transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100 scale-100 group-hover:scale-105'}`}
                      alt="Stream"
                    />
                  )}
                  {/* Subtle Grid Overlay */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none dark:invert" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                </div>

                <div className={`absolute left-0 right-0 bottom-0 p-3 bg-slate-950/65 backdrop-blur-xl text-white border-t border-white/10 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                  <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.22em] font-semibold">
                    <span>{isActive ? 'Live insights' : 'Camera preview'}</span>
                    <span className={`rounded-full px-2 py-1 text-[0.65rem] font-black ${isActive ? 'bg-accent/15 text-accent' : 'bg-slate-800/70 text-slate-300'}`}>
                      {isActive ? `${intel.person_count} persons` : 'tap to activate'}
                    </span>
                  </div>
                  {isActive ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {intel.objects.length > 0 ? intel.objects.slice(0, 4).map((item) => (
                        <span key={item} className="px-2.5 py-1 rounded-full bg-white/10 text-[0.7rem] text-white/90 border border-white/10">
                          {item}
                        </span>
                      )) : (
                        <span className="text-[0.75rem] text-slate-300">No active detections</span>
                      )}
                      {latestCameraLog ? (
                        <span className="w-full rounded-2xl bg-slate-900/80 px-3 py-2 text-[0.72rem] text-slate-200 border border-slate-700">
                          Latest event: <span className="font-semibold text-white">{latestCameraLog.type}</span>
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 text-[0.75rem] text-slate-300">
                      Select this camera to load live telemetry and event history.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CLEAN SIDEBAR */}
        <div className="w-[380px] bg-card rounded-2xl border border-border shadow-premium flex flex-col h-full overflow-hidden shrink-0">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 text-accent rounded-lg border border-accent/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-bold text-text-dark tracking-tight">Intelligence Logs</h2>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[0.6rem] font-bold text-emerald-600 uppercase tracking-tighter">Live Sync</span>
                    </div>
                  </div>
                  <p className="text-[0.65rem] font-medium text-text-gray uppercase tracking-widest">{isGlobalView ? 'System Wide' : `Selected: CAM-0${activeCamera}`}</p>
                </div>
              </div>
            </div>

            {/* FILTER UI */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsGlobalView(!isGlobalView)}
                className={`p-2 rounded-lg text-xs font-semibold transition-all border
                ${isGlobalView ? 'bg-accent text-white border-accent' : 'bg-surface text-text-gray border-border hover:border-accent/40'}`}
                title="Toggle Global View"
              >
                <Filter className="w-4 h-4" />
              </button>
              <div className="flex flex-1 bg-surface p-1 rounded-lg border border-border">
                {[
                  { label: '1H', val: 1 },
                  { label: '24H', val: 24 },
                  { label: '7D', val: 168 }
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => { setFilterHours(f.val); }}
                    className={`flex-1 py-1.5 rounded-md font-bold text-[0.7rem] transition-all
                    ${filterHours === f.val ? 'bg-card text-accent shadow-premium border border-border' : 'text-text-gray hover:text-text-dark'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 rounded-3xl border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between mb-3 text-[0.65rem] font-bold uppercase tracking-wider text-text-gray">
                <span>Stable detection</span>
                <span className={`px-2 py-1 rounded-full text-[0.6rem] font-black transition-all ${intel.stable_objects?.length > 0 ? (stableLockActive ? 'bg-rose-500/10 text-rose-600 animate-pulse' : 'bg-emerald-500/10 text-emerald-600') : 'bg-slate-500/10 text-text-gray'}`}>
                  {intel.stable_objects?.length > 0 ? (stableLockActive ? 'LOCKED — ALERT' : 'LOCKED') : 'SCANNING'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {intel.stable_objects?.length > 0 ? intel.stable_objects.map((item) => (
                  <span key={item} className="px-3 py-1 rounded-full bg-surface text-text-dark text-[0.65rem] font-semibold uppercase tracking-[0.2em] border border-border">
                    {item}
                  </span>
                )) : (
                  <span className="px-3 py-1 rounded-full bg-surface text-text-gray text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                    Awaiting stable lock
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* LOG ENTRIES */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-surface/30">
            {loadingLogs ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin mb-3"></div>
                <div className="text-xs text-text-gray uppercase tracking-widest font-bold">Fetching Logs...</div>
              </div>
            ) : logs.length > 0 ? logs.map((log) => {
              const isDeparture = /left frame|cleared from scene/i.test(log.type);
              return (
                <div
                  key={log.id}
                  className={`flex gap-3 p-3 rounded-xl transition-all duration-200 border bg-card hover:bg-card-hover hover:border-accent/30 hover:shadow-premium
                  ${highlightCam === log.camera.replace('CAM-', '') ? 'border-accent shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-border/50'}
                  ${log.isAlert ? 'border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20 animate-pulse' : ''}
                  ${isDeparture ? 'bg-slate-900/5 border-slate-500/30' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-lg ${log.bg} shrink-0 flex items-center justify-center border border-border/10`}>
                    <log.icon className={`w-5 h-5 ${log.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[0.7rem] font-bold tracking-wider uppercase ${log.iconColor} truncate`}>
                        {log.type}
                      </span>
                      <span className="text-[0.65rem] font-mono text-text-gray font-bold">{log.timestamp}</span>
                    </div>
                    <div className="text-xs font-bold text-text-dark flex items-center gap-2">
                      {log.camera}
                      <span className="w-1 h-1 bg-border rounded-full"></span>
                      <span className="text-text-gray font-medium">Conf: {log.confidence}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center mb-3 shadow-premium border border-border">
                  <Shield className="w-5 h-5 text-text-gray" />
                </div>
                <div className="text-sm font-bold text-text-dark">No Events Detected</div>
                <p className="text-[0.65rem] text-text-gray mt-1 uppercase tracking-wider font-bold">Adjust filters or view global matrix</p>
              </div>
            )}
          </div>

          {/* INTELLIGENCE FOOTER */}
          <div className="p-4 bg-card border-t border-border shrink-0">
            {/* THREAT ASSESSMENT */}
            <div className={`mb-4 p-3 rounded-xl border transition-all duration-500 flex flex-col gap-1.5
                ${summary.threat_level === 'Critical' ? 'bg-rose-500/15 border-rose-500/30' :
                summary.threat_level === 'Elevated' ? 'bg-amber-500/15 border-amber-500/30' :
                  'bg-emerald-500/10 border-emerald-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${summary.threat_level === 'Critical' ? 'bg-rose-500' :
                      summary.threat_level === 'Elevated' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className={`text-[0.65rem] font-black uppercase tracking-widest ${summary.threat_level === 'Critical' ? 'text-rose-600' :
                      summary.threat_level === 'Elevated' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {summary.threat_level || 'Checking...'}
                  </span>
                </div>
                <Shield className={`w-3.5 h-3.5 ${summary.threat_level === 'Critical' ? 'text-rose-600' :
                    summary.threat_level === 'Elevated' ? 'text-amber-600' : 'text-emerald-600'}`} />
              </div>
              <p className={`text-xs font-bold leading-tight ${summary.threat_level === 'Critical' ? 'text-rose-700' :
                  summary.threat_level === 'Elevated' ? 'text-amber-700' : 'text-text-dark'}`}>
                {summary.status_message || 'Initializing assessment...'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-surface p-2.5 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[0.55rem] font-bold text-text-gray uppercase tracking-wider">Human Activity</span>
                </div>
                <div className="text-lg font-black text-text-dark leading-none">{summary.total_persons || 0}</div>
              </div>

              <div className={`p-2.5 rounded-xl border ${summary.total_weapons > 0 ? 'bg-rose-500 border-rose-600 shadow-md' : 'bg-surface border-border'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Target className={`w-3.5 h-3.5 ${summary.total_weapons > 0 ? 'text-white' : 'text-text-gray'}`} />
                  <span className={`text-[0.55rem] font-bold uppercase tracking-wider ${summary.total_weapons > 0 ? 'text-white/80' : 'text-text-gray'}`}>Ballistics</span>
                </div>
                <div className={`text-lg font-black leading-none ${summary.total_weapons > 0 ? 'text-white' : 'text-text-dark'}`}>{summary.total_weapons || 0}</div>
              </div>

              <div className="bg-surface p-2.5 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Car className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[0.55rem] font-bold text-text-gray uppercase tracking-wider">Transit</span>
                </div>
                <div className="text-lg font-black text-text-dark leading-none">{summary.total_vehicles || 0}</div>
              </div>

              <div className="bg-surface p-2.5 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[0.55rem] font-bold text-text-gray uppercase tracking-wider">Signals</span>
                </div>
                <div className="text-lg font-black text-text-dark leading-none">{summary.count || 0}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[0.6rem] px-1 font-bold">
              <span className="text-text-gray uppercase tracking-widest">Engine Sync</span>
              <span className="text-success flex items-center gap-1.5 uppercase tracking-widest font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Optimal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

