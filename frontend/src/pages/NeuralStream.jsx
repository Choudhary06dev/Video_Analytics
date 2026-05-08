import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchLiveAreas, fetchLiveCameras, fetchLiveScenarios } from '../services/cameraService';
import { fetchLogs, fetchLogsSummary } from '../services/alertService';
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
  LayoutGrid,
  RotateCcw,
  Eye,
  X
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
  const [areas, setAreas] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);
  const [isGlobalView, setIsGlobalView] = useState(true);
  const [gridSize, setGridSize] = useState(3); // 2x2 (2), 3x3 (3), 4x4 (4)
  const [filterHours, setFilterHours] = useState(1);
  const [selectedAreaId, setSelectedAreaId] = useState('all');
  const [selectedScenarioKey, setSelectedScenarioKey] = useState('all');
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
  const [selectedLog, setSelectedLog] = useState(null);

  const loadCameras = useCallback(async () => {
    try {
      const data = await fetchLiveCameras();
      setCameras(data || []);
    } catch (err) {
      console.error('Failed to load cameras:', err);
    }
  }, []);

  const loadFilterOptions = useCallback(async () => {
    const [areasResult, scenariosResult] = await Promise.allSettled([
      fetchLiveAreas(),
      fetchLiveScenarios()
    ]);

    if (areasResult.status === 'fulfilled') {
      setAreas(areasResult.value || []);
    } else {
      console.error('Failed to load areas:', areasResult.reason);
    }

    if (scenariosResult.status === 'fulfilled') {
      setScenarios(scenariosResult.value || []);
    } else {
      console.error('Failed to load scenarios:', scenariosResult.reason);
    }
  }, []);

  const location = useLocation();

  useEffect(() => {
    loadCameras();
    loadFilterOptions();
  }, [loadCameras, loadFilterOptions]);

  // Auto-select camera from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const camId = params.get('camera_id');
    
    if (camId) {
      const parsedId = parseInt(camId);
      // If cameras are already loaded, select immediately
      if (cameras.length > 0) {
        const targetCam = cameras.find(c => c.id === parsedId);
        if (targetCam) {
          setActiveCamera(targetCam.id);
          setIsGlobalView(false);
          // Scroll to top to show the focus view if needed
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } else {
      // If no camera_id in URL, maybe we should stay in current mode 
      // or default to global if the user explicitly cleared it.
      // For now, let's just let the user toggle manually.
    }
  }, [location.search, location.key, cameras]);

  const areaNameById = useMemo(() => {
    return new Map(areas.map(area => [area.id, area.name]));
  }, [areas]);

  const selectedAreaIds = useMemo(() => {
    if (selectedAreaId === 'all') return null;

    const rootId = Number(selectedAreaId);
    const ids = new Set([rootId]);
    let changed = true;

    while (changed) {
      changed = false;
      areas.forEach(area => {
        if (area.parent_id && ids.has(area.parent_id) && !ids.has(area.id)) {
          ids.add(area.id);
          changed = true;
        }
      });
    }

    return ids;
  }, [areas, selectedAreaId]);

  const visibleCameraIdsByScenario = useMemo(() => {
    if (selectedScenarioKey === 'all') return null;
    return new Set(summary.camera_ids || []);
  }, [selectedScenarioKey, summary.camera_ids]);

  const filteredCameras = useMemo(() => {
    return cameras.filter(camera => {
      const matchesArea = !selectedAreaIds || selectedAreaIds.has(camera.area_id);
      const matchesScenario = !visibleCameraIdsByScenario || visibleCameraIdsByScenario.has(camera.id);
      return matchesArea && matchesScenario;
    });
  }, [cameras, selectedAreaIds, visibleCameraIdsByScenario]);

  const activeFilters = useMemo(() => ({
    camera_id: isGlobalView ? undefined : activeCamera,
    area_id: selectedAreaId === 'all' || !isGlobalView ? undefined : Number(selectedAreaId),
    scenario_key: selectedScenarioKey === 'all' ? undefined : selectedScenarioKey
  }), [activeCamera, isGlobalView, selectedAreaId, selectedScenarioKey]);

  const activeAreaLabel = selectedAreaId === 'all'
    ? 'All Areas'
    : areaNameById.get(Number(selectedAreaId)) || 'Selected Area';

  const activeScenarioLabel = selectedScenarioKey === 'all' ? 'All Scenarios' : selectedScenarioKey;

  useEffect(() => {
    if (!isGlobalView && activeCamera && !filteredCameras.some(camera => camera.id === activeCamera)) {
      setActiveCamera(null);
      setIsGlobalView(true);
      setLogsOffset(0);
      setLogs([]); // Clear logs when losing focus
    }
  }, [activeCamera, filteredCameras, isGlobalView]);

  const fetchLogsData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoadingLogs(true);
    try {
      const logsData = await fetchLogs({ hours: filterHours, ...activeFilters, limit: PAGE_SIZE, skip: logsOffset });

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
          const diffDays = Math.floor(diffHrs / 24);
          let timeAgo = '';
          if (diffMins < 1) timeAgo = 'Just now';
          else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
          else if (diffHrs < 24) timeAgo = `${diffHrs}h ${diffMins % 60}m ago`;
          else timeAgo = `${diffDays}d ago`;

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
            severity: log.severity.toUpperCase(),
            rawLog: log
          };
        }));
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [activeFilters, filterHours, logsOffset]);

  useEffect(() => {
    let source;
    let retryTimer;

    const connect = () => {
      const token = encodeURIComponent(localStorage.getItem('token') || '');
      source = new EventSource(`${EVENTS_URL}?token=${token}`);
      source.onopen = () => setStreamConnected(true);
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && !data.detail) {
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
        const summaryRes = await fetchLogsSummary(filterHours, activeFilters);
        if (summaryRes && !summaryRes.detail) setSummary(summaryRes);
      } catch (err) {
        console.error('Failed to poll stream summary:', err);
      }
      intelTimeout = setTimeout(pollIntel, 1000);
    };

    const pollLogs = async () => {
      if (!isActive) return;
      try {
        await fetchLogsData(false);
      } catch (err) {
        console.error('Failed to poll stream logs:', err);
      }
      logsTimeout = setTimeout(pollLogs, 2000);
    };

    pollIntel();
    pollLogs();

    return () => {
      isActive = false;
      clearTimeout(intelTimeout);
      clearTimeout(logsTimeout);
    };
  }, [activeFilters, fetchLogsData, filterHours]);

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-3 sm:gap-4 bg-bg font-sans transition-colors duration-300">
      {/* COMPACT & ROBUST COMMAND HUB HEADER */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-card px-3 sm:px-5 py-3 lg:py-2 rounded-lg border border-border shadow-premium gap-4 lg:gap-3 shrink-0">
        
        {/* Left Section: Compact Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent/20 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-black text-text-dark tracking-tight uppercase italic leading-none truncate">Command Hub</h1>
              <div className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded text-[0.55rem] font-black tracking-widest flex items-center gap-1.5 uppercase shrink-0">
                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                Live
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-[0.6rem] text-text-gray font-bold mt-1 sm:mt-0.5">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> v4.8</span>
              <div className="w-1 h-1 bg-border rounded-full" />
              <span className="text-accent">99.9% Sync</span>
              <div className="w-1 h-1 bg-border rounded-full" />
              <div className={`flex items-center gap-1 truncate ${streamConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                {streamConnected ? 'Events Online' : 'Reconnecting'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Compact Controls & Stats */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 lg:gap-3 w-full lg:w-auto">
          
          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-start">
            {/* Grid Layout (Only visible in Global View) */}
            {isGlobalView && (
              <div className="flex bg-surface p-0.5 rounded-lg border border-border shrink-0 h-[32px] items-center">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setGridSize(num)}
                    className={`h-full px-2.5 rounded-md font-black text-[0.6rem] transition-all uppercase tracking-widest
                       ${gridSize === num ? 'bg-card text-accent shadow-sm border border-border' : 'text-text-gray hover:text-text-dark'}`}
                  >
                    {num}x{num}
                  </button>
                ))}
              </div>
            )}

            {/* Intelligence Stats (Compact) */}
            <div className="flex items-center gap-2 shrink-0 border-l border-border pl-3">
               {/* Threat Level */}
               <div className={`flex items-center gap-2 px-2.5 rounded-lg border transition-all duration-500 h-[32px]
                  ${summary.threat_level === 'Critical' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface border-border'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${summary.threat_level === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className={`text-[0.6rem] font-black uppercase tracking-widest ${summary.threat_level === 'Critical' ? 'text-rose-600' : 'text-text-gray'}`}>
                  {summary.threat_level || 'Safe'}
                </span>
                <Shield className={`w-3 h-3 ${summary.threat_level === 'Critical' ? 'text-rose-600' : 'text-text-gray'}`} />
              </div>

              {/* Quick Counters */}
              <div className="flex items-center gap-1.5">
                <div className={`h-[32px] px-2.5 rounded-lg border flex items-center gap-2 ${summary.total_weapons > 0 ? 'bg-rose-500 border-rose-600' : 'bg-surface border-border'}`}>
                  <Crosshair className={`w-3.5 h-3.5 ${summary.total_weapons > 0 ? 'text-white' : 'text-rose-500'}`} />
                  <span className={`text-[0.8rem] font-black ${summary.total_weapons > 0 ? 'text-white' : 'text-text-dark'}`}>{summary.total_weapons || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Filters */}
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <div className="flex-1 sm:flex-none flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2 h-[32px]">
              <Filter className="w-3 h-3 text-accent shrink-0" />
              <select
                value={selectedAreaId}
                onChange={(e) => { setSelectedAreaId(e.target.value); setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); setLogs([]); }}
                className="w-full sm:max-w-[120px] bg-transparent text-[0.65rem] font-black uppercase tracking-wider text-text-dark outline-none cursor-pointer"
              >
                <option value="all">Areas</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.parent_id ? `${areaNameById.get(a.parent_id) || 'Zone'} / ${a.name}` : a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 sm:flex-none flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2 h-[32px]">
              <Target className="w-3 h-3 text-accent shrink-0" />
              <select
                value={selectedScenarioKey}
                onChange={(e) => { setSelectedScenarioKey(e.target.value); setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); setLogs([]); }}
                className="w-full sm:max-w-[150px] bg-transparent text-[0.65rem] font-black uppercase tracking-wider text-text-dark outline-none cursor-pointer"
              >
                <option value="all">Scenarios</option>
                {scenarios.map(s => (
                  <option key={s.id || s.key || s.name} value={s.key || s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            
            <button
                onClick={() => { setSelectedAreaId('all'); setSelectedScenarioKey('all'); setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); setLogs([]); }}
                className="p-2 sm:p-1.5 border rounded-lg transition-colors bg-surface text-text-gray hover:text-rose-500 border-border cursor-pointer h-[32px] flex items-center justify-center"
                title="Clear Filters"
            >
                <RotateCcw className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* STREAMING MATRIX (Dynamic Focus vs Global) */}
      <div className="w-full shrink-0 overflow-hidden bg-card rounded-lg border border-border shadow-premium p-2 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4">

        {/* CAMERA SELECTION SIDEBAR — horizontal scroll on mobile, vertical sidebar on desktop */}
        <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden custom-scrollbar sm:pr-2 shrink-0 sm:border-r border-border/50 sm:w-20 md:w-40 pb-2 sm:pb-0">
          <div
            onClick={() => { setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); setLogs([]); }}
            className={`aspect-video rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${isGlobalView ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'border-border/50 bg-surface hover:border-accent/40'}`}
          >
            <LayoutGrid className={`w-5 h-5 mb-1 ${isGlobalView ? 'text-accent' : 'text-text-gray'}`} />
            <span className={`text-[0.55rem] font-black uppercase tracking-widest ${isGlobalView ? 'text-accent' : 'text-text-gray'} hidden md:block`}>Matrix</span>
          </div>

          {filteredCameras.map(cam => {
            const isDisabled = cam.is_active === false;
            const isActive = activeCamera === cam.id && !isGlobalView && !isDisabled;
            return (
              <div
                key={cam.id}
                onClick={() => { if (!isDisabled) { setActiveCamera(cam.id); setIsGlobalView(false); setLogsOffset(0); setLogs([]); } }}
                className={`aspect-video rounded-lg border-2 transition-all overflow-hidden relative group
                       ${isActive ? 'border-accent shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer' : isDisabled ? 'border-danger/30 opacity-60 cursor-not-allowed' : 'border-black hover:border-accent/40 cursor-pointer'}
                     `}
              >
                {/* Thumbnail preview */}
                {!isDisabled ? (
                  <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${cam.id}`} hideOverlay={true} />
                ) : (
                  <div className="w-full h-full bg-slate-900 border border-white/5 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)]" />
                    <Settings className="w-4 h-4 text-danger/50" />
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-1.5 transition-opacity flex justify-between items-start z-10">
                  <span className="text-[0.45rem] font-black text-white uppercase tracking-widest">{cam.name}</span>
                  {isDisabled && <span className="text-[0.45rem] font-black text-danger uppercase tracking-widest">OFF</span>}
                </div>
                {isActive && <div className="absolute inset-0 ring-inset ring-2 ring-accent/50 rounded-lg" />}
                {isDisabled && <div className="absolute inset-0 bg-danger/10" />}
              </div>
            )
          })}
        </div>

        {/* MAIN STREAMING AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black rounded-lg relative border border-border overflow-hidden min-h-[350px]">
          {isGlobalView ? (
            /* Dynamic Grid Reflow */
            <div
              className="grid content-start p-2 gap-2"
              style={{ gridTemplateColumns: `repeat(var(--grid-cols, ${gridSize}), minmax(0, 1fr))` }}
            >
              <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width: 640px) {
                  .grid { --grid-cols: 1 !important; }
                }
              `}} />
              {filteredCameras.length === 0 ? (
                <div className="col-span-full min-h-[320px] flex flex-col items-center justify-center text-center bg-slate-950 rounded-lg border border-white/10">
                  <Filter className="w-8 h-8 text-white/25 mb-3" />
                  <span className="text-xs font-black text-white/70 uppercase tracking-widest">No streams match filters</span>
                  <span className="text-[0.65rem] font-bold text-white/35 uppercase tracking-wider mt-1">{activeAreaLabel} / {activeScenarioLabel}</span>
                </div>
              ) : filteredCameras.slice(0, gridSize * gridSize).map(cam => {
                const isDisabled = cam.is_active === false;
                return (
                  <div
                    key={cam.id}
                    onClick={() => { if (!isDisabled) { setActiveCamera(cam.id); setIsGlobalView(false); setLogsOffset(0); setLogs([]); } }}
                    className={`relative bg-slate-900 rounded-lg overflow-hidden border border-white/10 group transition-all ${isDisabled ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-accent/40'}`}
                  >
                    {isDisabled ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-white/5 relative">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)]" />
                        <Settings className="w-8 h-8 text-danger/30 mb-2" />
                        <span className="text-[0.6rem] font-black text-danger/50 uppercase tracking-widest mt-2 z-10">Stream Disabled</span>
                      </div>
                    ) : (
                      <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${cam.id}`} hideOverlay={true} />
                    )}
                    <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent z-10">
                      <span className="text-[0.55rem] font-black text-white/80 uppercase tracking-widest block mb-0.5">Stream-{cam.id}</span>
                      <span className="text-[0.7rem] font-bold text-white tracking-tight leading-none">{cam.name}</span>
                    </div>
                    <div className={`absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur border ${isDisabled ? 'border-danger/30 text-danger' : 'border-white/10 text-accent'} rounded font-black text-[0.55rem] flex items-center gap-1 uppercase z-10`}>
                      {!isDisabled && <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
                      {isDisabled ? 'OFFLINE' : 'Live'}
                    </div>
                  </div>
                )
              })}
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
      <div className="flex-1 flex flex-col xl:flex-row gap-4 overflow-hidden">
        {/* LOGS TABLE OVERVIEW */}
        <div className="flex-1 bg-card rounded-lg border border-border shadow-premium flex flex-col overflow-hidden min-w-0">
          {/* LOGS HEADER + FILTERS (SINGLE LINE COMPACT) */}
          <div className="px-3 sm:px-5 py-2 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 bg-surface/10">
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-1.5 bg-accent/10 text-accent rounded-md border border-accent/20">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-black text-text-dark tracking-tight uppercase">Logs</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[0.5rem] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                </div>
                <span className="text-[0.6rem] font-bold text-text-gray uppercase tracking-widest border-l border-border pl-3 hidden xl:block">
                  {isGlobalView ? 'Global' : `CAM-${String(activeCamera).padStart(2, '0')}`} / {activeScenarioLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end">
              {/* Compact Inline Status Message */}
              {summary.status_message && (
                <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border text-[0.6rem] font-black uppercase tracking-tight
                  ${summary.threat_level === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' :
                    summary.threat_level === 'Elevated' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                      'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${summary.threat_level === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="truncate max-w-[100px] lg:max-w-none">{summary.status_message}</span>
                </div>
              )}

              {/* Time Filters (Restored All) */}
              <div className="flex bg-surface p-0.5 rounded-lg border border-border shrink-0 overflow-x-auto no-scrollbar">
                {[
                  { label: '15M', val: 0.25 },
                  { label: '1H', val: 1 },
                  { label: '6H', val: 6 },
                  { label: '24H', val: 24 },
                  { label: '7D', val: 168 },
                  { label: '1M', val: 720 },
                  { label: '6M', val: 4320 },
                  { label: '1Y', val: 8760 }
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => { setFilterHours(f.val); setLogsOffset(0); }}
                    className={`px-1.5 py-0.5 rounded font-black text-[0.5rem] transition-all uppercase tracking-tighter
                  ${filterHours === f.val ? 'bg-card text-accent shadow-sm border border-border' : 'text-text-gray hover:text-text-dark'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setIsGlobalView(!isGlobalView); setLogsOffset(0); }}
                className={`p-1.5 rounded-md text-xs transition-all border shrink-0
                ${isGlobalView ? 'bg-accent text-white border-accent' : 'bg-surface text-text-gray border-border hover:border-accent/40'}`}
                title="Toggle View Mode"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TABLE HEADER */}
          {/* TABLE HEADER — hidden on mobile, card view instead */}
          <div className="hidden lg:grid grid-cols-12 gap-2 px-5 py-2 bg-surface/50 border-b border-border text-[0.6rem] font-black text-text-gray uppercase tracking-widest">
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Event</div>
            <div className="col-span-2">Event ID</div>
            <div className="col-span-1">Camera</div>
            <div className="col-span-1">Conf.</div>
            <div className="col-span-1">Severity</div>
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-1">Elapsed</div>
            <div className="col-span-1 text-center">Action</div>
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
                className={`
                  /* Desktop: table row */
                  lg:grid lg:grid-cols-12 lg:gap-2 lg:px-5 lg:py-2.5 lg:items-center
                  /* Mobile: card layout */
                  flex flex-col gap-2 p-3 sm:p-4 lg:p-0 lg:flex-row
                  transition-all duration-200 border-b hover:bg-card-hover cursor-default
              ${log.isAlert ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10' : 'border-border/30'}`}
              >
                {/* Icon or Thumbnail */}
                {/* Status Icon/Thumbnail */}
                <div className="lg:col-span-1 flex items-center gap-3 lg:gap-0">
                  {log.rawLog?.image_base64 ? (
                    <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-lg overflow-hidden border border-border/50 shadow-sm relative group cursor-pointer shrink-0" onClick={() => setSelectedLog(log)}>
                      <img
                        src={`data:image/jpeg;base64,${log.rawLog.image_base64}`}
                        alt="Event"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      {log.isAlert && <div className="absolute inset-0 border border-rose-500 rounded-lg pointer-events-none"></div>}
                    </div>
                  ) : (
                    <div className={`w-10 h-10 lg:w-8 lg:h-8 rounded-lg ${log.bg} flex items-center justify-center border border-border/10 shrink-0`}>
                      <log.icon className={`w-4 h-4 ${log.iconColor}`} />
                    </div>
                  )}
                  {/* Mobile: show event name next to icon */}
                  <div className="lg:hidden flex-1 min-w-0">
                    <span className={`text-[0.75rem] font-extrabold tracking-wide uppercase ${log.iconColor} truncate block`}>{log.type}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.6rem] font-mono text-text-gray">{log.camera}</span>
                      <span className={`text-[0.5rem] px-1.5 py-0.5 rounded font-black tracking-widest uppercase border ${log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : log.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-blue-500/20 text-blue-500 border-blue-500/30'}`}>{log.severity}</span>
                    </div>
                  </div>
                  {/* Mobile: action button */}
                  <button className="lg:hidden p-2 text-text-gray hover:text-accent hover:bg-accent/10 rounded-lg transition-colors ml-auto shrink-0" onClick={() => setSelectedLog(log)}>
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Desktop-only table columns */}
                <div
                  className="hidden lg:flex col-span-2 items-center gap-2 min-w-0 cursor-pointer group/event"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedScenarioKey(log.rawLog.scenario_key);
                    setIsGlobalView(true);
                    setActiveCamera(null);
                    setLogsOffset(0);
                    setLogs([]);
                  }}
                  title={`Filter by ${log.type}`}
                >
                  <span className={`text-[0.7rem] font-extrabold tracking-wide uppercase ${log.iconColor} truncate group-hover/event:text-accent transition-colors`}>
                    {log.type}
                  </span>
                  {log.isAlert && (
                    <span className="text-rose-500 text-[0.55rem] font-black animate-pulse uppercase tracking-wider shrink-0">Alert</span>
                  )}
                </div>

                <div className="hidden lg:block col-span-2">
                  <span className="text-[0.6rem] font-mono text-text-gray">{log.eventId}</span>
                </div>

                <div className="hidden lg:block col-span-1">
                  <span className="flex items-center gap-1.5 text-[0.65rem] font-bold text-text-dark">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    {log.camera}
                  </span>
                </div>

                <div className="hidden lg:block col-span-1">
                  <span className="text-[0.65rem] font-bold text-text-dark">{log.confidence}</span>
                </div>

                <div className="hidden lg:block col-span-1">
                  <span className={`inline-block w-[60px] mr-4 text-center text-[0.5rem] px-1.5 py-0.5 rounded font-black tracking-widest uppercase border ${log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                    log.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                      log.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                        'bg-slate-500/20 text-slate-500 border-slate-500/30'
                    }`}>
                    {log.severity}
                  </span>
                </div>

                <div className="hidden lg:block col-span-2">
                  <span className="text-[0.65rem] font-mono text-text-dark font-bold">{log.timestamp}</span>
                </div>

                <div className="hidden lg:block col-span-1">
                  <span className="text-[0.6rem] text-text-gray font-medium font-mono">{log.timeAgo}</span>
                </div>

                <div className="hidden lg:flex col-span-1 justify-center">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1.5 text-text-gray hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="View Log Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile: extra details row */}
                <div className="lg:hidden flex items-center justify-between gap-2 text-[0.6rem] text-text-gray font-mono">
                  <span>{log.confidence}</span>
                  <span>{log.timestamp}</span>
                  <span>{log.timeAgo}</span>
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
          <div className="px-3 sm:px-5 py-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 bg-surface/30 shrink-0">
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
        <div className="w-full xl:w-[320px] bg-card rounded-lg border border-border shadow-premium flex flex-col overflow-hidden shrink-0">
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
                      <div
                        key={name}
                        className="flex items-center p-2 rounded-lg hover:bg-surface transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedScenarioKey(name);
                          setIsGlobalView(true);
                          setActiveCamera(null);
                          setLogsOffset(0);
                          setLogs([]);
                        }}
                        title={`Filter by ${name}`}
                      >
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

      {/* LOG DETAILS MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-premium rounded-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${selectedLog.bg} flex items-center justify-center border border-border/10`}>
                  <selectedLog.icon className={`w-5 h-5 ${selectedLog.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-dark tracking-tight">Log Details</h2>
                  <p className="text-xs text-text-gray font-mono">{selectedLog.eventId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 text-text-gray hover:text-text-dark transition-colors rounded-lg hover:bg-surface border border-transparent hover:border-border">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Event Type</span>
                  <span className="text-sm font-bold text-text-dark">{selectedLog.type}</span>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Camera</span>
                  <span className="text-sm font-bold text-text-dark flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                    {selectedLog.camera}
                  </span>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Severity & Confidence</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-[0.6rem] px-2 py-0.5 rounded font-black tracking-widest uppercase border ${selectedLog.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                      selectedLog.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                        selectedLog.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                          'bg-slate-500/20 text-slate-500 border-slate-500/30'
                      }`}>
                      {selectedLog.severity}
                    </span>
                    <span className="text-sm font-bold text-text-dark">{selectedLog.confidence}</span>
                  </div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Timestamp</span>
                  <span className="text-sm font-mono text-text-dark">{new Date(selectedLog.rawLog.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {selectedLog.rawLog.image_base64 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold text-text-dark tracking-tight">Detection Snapshot</h3>
                  <div className="bg-black rounded-lg border border-border overflow-hidden relative shadow-inner">
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/20 rounded font-black text-[0.55rem] uppercase tracking-widest text-white z-10">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                      Captured Frame
                    </div>
                    <img
                      src={`data:image/jpeg;base64,${selectedLog.rawLog.image_base64}`}
                      alt="Detection Event"
                      className="w-full object-contain max-h-[350px] border border-white/5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface/30 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-bold text-text-dark hover:bg-border transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
