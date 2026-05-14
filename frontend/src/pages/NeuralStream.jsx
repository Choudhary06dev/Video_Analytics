import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchLiveAreas, fetchLiveCameras, fetchLiveScenarios } from '../services/cameraService';
import { fetchLogs, fetchLogsSummary } from '../services/alertService';
import { EVENTS_URL, VIDEO_FEED_URL, fetchIntelligence, fetchScenarioMatrix } from '../api';
import {
  Radio,
  Shield,
  Cpu,
  Settings,
  ChevronRight,
  ChevronDown,
  MapPin,
  Layers,
  Search,
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
  X,
  Star,
  Maximize,
  Minimize,
  List
} from 'lucide-react';

const SCENARIO_UI = {
  'UNAUTHORIZED_ENTRY_INTO_RESTRICTED_AREAS': { icon: Lock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'WEAPON_DETECTION_GUN_KNIFE': { icon: Crosshair, color: 'text-rose-500', bg: 'bg-rose-500/15' },
  'MOBILE_PHONE_USAGE_IN_RESTRICTED_AREAS': { icon: Phone, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'VEHICLE_DETECTION_TRACKING': { icon: Car, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'OBJECT_LEFT_UNATTENDED': { icon: Package, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  'FIRE_SMOKE_DETECTION': { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/15' },
  'AGGRESSIVE_BEHAVIOUR_DETECTION': { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-600/10' },
  'MULTIPLE_PERSONS_ENTRY_ON_SINGLE_ACCESS': { icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  'ELECTRONIC_DEVICE_DETECTED': { icon: Cpu, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  'VISITOR_COUNT_LIMIT_EXCEEDED': { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
  const [gridSize, setGridSize] = useState(3); // Default to 3x3 (3 columns)
  const [filterHours, setFilterHours] = useState(24);
  const [selectedAreaId, setSelectedAreaId] = useState('all');
  const [selectedScenarioKey, setSelectedScenarioKey] = useState('all');
  const [logsOffset, setLogsOffset] = useState(0);
  const [cameraLimit, setCameraLimit] = useState(6);
  const [cameraOffset, setCameraOffset] = useState(0);
  const INITIAL_CAMERA_LIMIT = 6;
  const PAGE_SIZE = 15;
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
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraCounts, setCameraCounts] = useState({});
  const [expandedZones, setExpandedZones] = useState(new Set());
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [matrixData, setMatrixData] = useState({ scenarios: [], cameras: [], matrix: {}, total_alerts: 0 });
  const [showOnlyActiveCams, setShowOnlyActiveCams] = useState(true);

  const scenarioNameByKey = useMemo(() => {
    const map = new Map();
    scenarios.forEach(s => {
      if (s.key) map.set(s.key.toLowerCase(), s.name);
    });
    return map;
  }, [scenarios]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const toggleZone = (zoneId) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  };

  const zoneTree = useMemo(() => {
    const roots = areas.filter(a => !a.parent_id);
    const getChildren = (parentId) => areas.filter(a => a.parent_id === parentId);
    return roots.map(root => ({
      ...root,
      children: getChildren(root.id)
    }));
  }, [areas]);

  const getCameraCountForZone = useCallback((zoneId, includeChildren = true) => {
    if (!includeChildren) {
      return cameras.filter(c => c.area_id === zoneId).length;
    }
    const ids = new Set([zoneId]);
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
    return cameras.filter(c => ids.has(c.area_id)).length;
  }, [areas, cameras]);

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

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadCameras();
    loadFilterOptions();
  }, [loadCameras, loadFilterOptions]);

  // Auto-select camera from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const camId = params.get('camera_id');
    if (camId && cameras.length > 0) {
      const parsedId = parseInt(camId);
      const targetCam = cameras.find(c => c.id === parsedId);
      if (targetCam) {
        setActiveCamera(targetCam.id);
        setIsGlobalView(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Default to Grid View
      setIsGlobalView(true);
      setActiveCamera(null);
      // Clean URL if it has parameters
      if (location.search.includes('camera_id')) {
        navigate('/neural-stream', { replace: true });
      }
    }
  }, [location.search, cameras]);

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

  const selectedScenarioId = useMemo(() => {
    if (selectedScenarioKey === 'all') return null;
    const scenario = scenarios.find(s => s.key === selectedScenarioKey || s.name === selectedScenarioKey);
    return scenario ? scenario.id : null;
  }, [scenarios, selectedScenarioKey]);

  const filteredCameras = useMemo(() => {
    return cameras.filter(camera => {
      const matchesArea = !selectedAreaIds || selectedAreaIds.has(camera.area_id);

      // Filter by scenario: matches if the camera has events OR if it is assigned to this scenario
      let matchesScenario = true;
      if (selectedScenarioKey !== 'all') {
        const hasEvents = visibleCameraIdsByScenario?.has(camera.id);
        const isEnabled = selectedScenarioId && camera.enabled_scenario_ids?.includes(selectedScenarioId);
        matchesScenario = hasEvents || isEnabled;
      }

      return matchesArea && matchesScenario;
    });
  }, [cameras, selectedAreaIds, visibleCameraIdsByScenario, selectedScenarioKey, selectedScenarioId]);

  const activeFilters = useMemo(() => ({
    camera_id: isGlobalView ? undefined : activeCamera,
    area_id: selectedAreaId === 'all' || !isGlobalView ? undefined : Number(selectedAreaId),
    scenario_key: selectedScenarioKey === 'all' ? undefined : selectedScenarioKey
  }), [activeCamera, isGlobalView, selectedAreaId, selectedScenarioKey]);

  const activeAreaLabel = selectedAreaId === 'all'
    ? 'All Areas'
    : areaNameById.get(Number(selectedAreaId)) || 'Selected Area';

  const activeScenarioLabel = selectedScenarioKey === 'all' ? 'All Scenarios' : selectedScenarioKey;

  const currentSummary = summary.current || summary;

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
        setLogs(logsData.slice(0, 30).map(log => {
          const scenario = SCENARIO_UI[log.scenario_key] || SCENARIO_UI['Default'];
          const isAlert = log.is_alert || false;
          const friendlyName = scenarioNameByKey.get(log.scenario_key.toLowerCase());
          const detail = friendlyName || log.scenario_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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
            severity: log.severity.charAt(0).toUpperCase() + log.severity.slice(1).toLowerCase(),
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

  const filteredLogs = useMemo(() => {
    if (severityFilter === 'ALL') return logs;
    return logs.filter(log => log.severity === severityFilter);
  }, [logs, severityFilter]);

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
        const [summaryRes, intelRes, matrixRes] = await Promise.all([
          fetchLogsSummary(filterHours, activeFilters),
          fetchIntelligence(),
          fetchScenarioMatrix(filterHours, selectedAreaId === 'all' ? undefined : Number(selectedAreaId))
        ]);
        if (summaryRes && !summaryRes.detail) setSummary(summaryRes);
        if (intelRes && !intelRes.detail) setCameraCounts(intelRes.camera_counts || {});
        if (matrixRes && !matrixRes.detail) setMatrixData(matrixRes);
      } catch (err) {
        console.error('Failed to poll stream summary or intelligence:', err);
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
  }, [activeFilters, fetchLogsData, filterHours, selectedAreaId]);

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-3 sm:gap-4 bg-bg font-sans transition-colors duration-300">
      {/* COMPACT & ROBUST DASHBOARD HEADER */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-card px-3 sm:px-5 py-3 lg:py-2 rounded-lg border border-border shadow-premium gap-4 lg:gap-3 shrink-0">

        {/* Left Section: Compact Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent/20 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-black text-text-dark tracking-wider uppercase leading-none truncate pr-1">Live  Stream</h1>
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

          </div>

          {/* Compact Filters */}
          <div className="flex items-center gap-2 flex-1 sm:flex-none">

            <div className="flex-1 sm:flex-none flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2 h-[32px]">
              <Target className="w-3 h-3 text-accent shrink-0" />
              <select
                value={selectedScenarioKey}
                onChange={(e) => { setSelectedScenarioKey(e.target.value); setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); setCameraOffset(0); setLogs([]); }}
                className="w-full sm:max-w-[150px] bg-transparent text-[0.65rem] font-black tracking-wider text-text-dark outline-none cursor-pointer"
              >
                <option value="all">Scenarios</option>
                {scenarios.map(s => (
                  <option key={s.id || s.key || s.name} value={s.key || s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 sm:flex-none flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2 h-[32px]">
              <Eye className="w-3 h-3 text-accent shrink-0" />
              <select
                value={cameraLimit}
                onChange={(e) => { setCameraLimit(Number(e.target.value)); setCameraOffset(0); }}
                className="w-full sm:max-w-[100px] bg-transparent text-[0.65rem] font-black tracking-wider text-text-dark outline-none cursor-pointer"
              >
                <option value={6}>6 Nodes</option>
                <option value={9}>9 Nodes</option>
                <option value={12}>12 Nodes</option>
                <option value={24}>24 Nodes</option>
                <option value={48}>48 Nodes</option>
                <option value={200}>Show All</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSelectedAreaId('all');
                setSelectedScenarioKey('all');
                setIsGlobalView(true);
                setActiveCamera(null);
                setLogsOffset(0);
                setCameraOffset(0);
                setLogs([]);
                setCameraLimit(INITIAL_CAMERA_LIMIT);
                setFilterHours(24);
                setSeverityFilter('ALL');
                navigate('/neural-stream', { replace: true });
              }}
              className="p-2 sm:p-1.5 border rounded-lg transition-colors bg-surface text-text-gray hover:text-rose-500 border-border cursor-pointer h-[32px] flex items-center justify-center"
              title="Clear Filters"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 sm:p-1.5 border rounded-lg transition-colors bg-surface text-text-gray hover:text-accent hover:border-accent/30 cursor-pointer h-[32px] flex items-center justify-center gap-2 ml-1"
              title="Toggle Full Screen"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-3 sm:h-3" /> : <Maximize className="w-3.5 h-3.5 sm:w-3 sm:h-3" />}
              <span className="hidden sm:block text-[10px] font-bold tracking-widest">Full Screen</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: Unified Neural Hub (Sidebar + Matrix) */}
      <div className="flex flex-1 bg-card rounded-lg border border-border shadow-premium overflow-hidden min-h-0">
        {/* LEFT SIDEBAR: Area / Zone Tree */}
        <div className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-border/60 overflow-hidden">
          {/* Sidebar Header */}
          <div className="px-4 py-3 border-b border-border bg-surface/30 flex items-center gap-2.5">
            <div className="p-1.5 bg-accent/10 text-accent rounded-md border border-accent/20">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[0.7rem] font-black text-text-dark uppercase tracking-widest">Area / Zone Selection</span>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 h-[30px]">
              <Search className="w-3 h-3 text-text-gray shrink-0" />
              <input
                type="text"
                placeholder="Search Area / Zone..."
                value={zoneSearchQuery}
                onChange={(e) => setZoneSearchQuery(e.target.value)}
                className="bg-transparent text-[0.65rem] font-bold text-text-dark outline-none w-full placeholder:text-text-gray/50"
              />
              {zoneSearchQuery && (
                <button onClick={() => setZoneSearchQuery('')} className="text-text-gray hover:text-rose-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 flex flex-col gap-0.5">
            {/* All Areas Button */}
            <button
              onClick={() => { setSelectedAreaId('all'); setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); setCameraOffset(0); setLogs([]); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-[0.65rem] font-black uppercase tracking-widest flex items-center justify-between transition-all duration-200 group
         ${selectedAreaId === 'all' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-gray hover:bg-surface hover:text-text-dark border border-transparent'}`}
            >
              <span className="flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5" />
                All Areas
              </span>
              <span className={`text-[0.6rem] font-black px-1.5 py-0.5 rounded-md ${selectedAreaId === 'all' ? 'bg-accent/20 text-accent' : 'bg-surface text-text-gray'}`}>
                {cameras.length}
              </span>
            </button>

            {/* Zone Tree */}
            {zoneTree
              .filter(root => !zoneSearchQuery || root.name.toLowerCase().includes(zoneSearchQuery.toLowerCase()) || root.children.some(c => c.name.toLowerCase().includes(zoneSearchQuery.toLowerCase())))
              .map(root => {
                const rootCount = getCameraCountForZone(root.id);
                const isExpanded = expandedZones.has(root.id) || !!zoneSearchQuery;
                const isActive = selectedAreaId === String(root.id);
                const filteredChildren = root.children.filter(c => !zoneSearchQuery || c.name.toLowerCase().includes(zoneSearchQuery.toLowerCase()) || root.name.toLowerCase().includes(zoneSearchQuery.toLowerCase()));

                return (
                  <div key={root.id} className="flex flex-col">
                    <div className={`flex items-center rounded-lg transition-all duration-200 group
            ${isActive ? 'bg-accent/10 border border-accent/20' : 'hover:bg-surface border border-transparent'}`}>
                      {filteredChildren.length > 0 ? (
                        <button
                          onClick={() => toggleZone(root.id)}
                          className="p-2 text-text-gray hover:text-accent transition-colors shrink-0"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-3 h-3" />
                            : <ChevronRight className="w-3 h-3" />}
                        </button>
                      ) : (
                        <div className="w-7" />
                      )}
                      <button
                        onClick={() => { setSelectedAreaId(String(root.id)); setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); setCameraOffset(0); setLogs([]); }}
                        className={`flex-1 text-left py-2 pr-3 flex items-center justify-between min-w-0
              ${isActive ? 'text-accent' : 'text-text-dark group-hover:text-text-dark'}`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[0.65rem] font-black uppercase tracking-wider truncate">{root.name}</span>
                        </span>
                        <span className={`text-[0.6rem] font-black px-1.5 py-0.5 rounded-md shrink-0 ${isActive ? 'bg-accent/20 text-accent' : 'bg-surface text-text-gray'}`}>
                          {rootCount}
                        </span>
                      </button>
                    </div>

                    {/* Children */}
                    {isExpanded && filteredChildren.length > 0 && (
                      <div className="ml-4 pl-3 border-l border-border/50 flex flex-col gap-0.5 mt-0.5 mb-1">
                        {filteredChildren.map(child => {
                          const childCount = getCameraCountForZone(child.id, false);
                          const isChildActive = selectedAreaId === String(child.id);
                          return (
                            <button
                              key={child.id}
                              onClick={() => { setSelectedAreaId(String(child.id)); setIsGlobalView(true); setActiveCamera(null); setLogsOffset(0); setCameraOffset(0); setLogs([]); }}
                              className={`w-full text-left px-3 py-2 rounded-md text-[0.65rem] font-black uppercase tracking-wider flex items-center justify-between transition-all duration-200
                 ${isChildActive ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-gray hover:bg-surface hover:text-text-dark border border-transparent'}`}
                            >
                              <span className="truncate">{child.name}</span>
                              <span className={`text-[0.55rem] font-black px-1.5 py-0.5 rounded-md shrink-0 ${isChildActive ? 'bg-accent/20 text-accent' : 'bg-surface/80 text-text-gray'}`}>
                                {childCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* RIGHT: Streaming Matrix */}
        <div className="flex-1 shrink-0 overflow-hidden p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 min-w-0 bg-slate-900/5">

          {/* MAIN STREAMING AREA — Unified Container to remove gaps */}
          <div className="flex-1 flex flex-col bg-slate-950 rounded-lg border border-border/40 overflow-hidden min-h-[400px]">
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {isGlobalView ? (
                /* Dynamic Grid Reflow */
                <div
                  className="grid content-start p-2 gap-2"
                  style={{ gridTemplateColumns: `repeat(var(--grid-cols, ${gridSize}), minmax(0, 1fr))` }}
                >
                  <style dangerouslySetInnerHTML={{
                    __html: `
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
                  ) : filteredCameras.slice(cameraOffset, cameraOffset + cameraLimit).map(cam => {
                    const isDisabled = cam.is_active === false;
                    return (
                      <div
                        key={cam.id}
                        onClick={() => { if (!isDisabled) { setActiveCamera(cam.id); setIsGlobalView(false); setLogsOffset(0); setLogs([]); } }}
                        className={`relative bg-slate-900 rounded-lg overflow-hidden border border-white/5 group transition-all aspect-video ${isDisabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]'}`}
                      >
                        {isDisabled ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-white/5 relative">
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)]" />
                            <Settings className="w-8 h-8 text-rose-500 mb-2" />
                            <span className="text-[0.6rem] font-black text-rose-500 uppercase tracking-widest mt-2 z-10 drop-shadow-md">Stream Disabled</span>
                          </div>
                        ) : (
                          <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${cam.id}`} hideOverlay={true} />
                        )}
                        <div className="absolute top-0 left-0 right-0 px-3 py-3 bg-gradient-to-b from-black/80 via-black/20 to-transparent z-10 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isDisabled ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                            <span className="text-[0.65rem] font-bold text-white uppercase tracking-wider truncate max-w-[120px] sm:max-w-[160px]">{cam.name} - CAM {cam.id.toString().padStart(2, '0')}</span>
                          </div>
                          {!isDisabled && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded border border-white/10">
                              <Users className="w-3 h-3 text-white/80" />
                              <span className="text-[0.6rem] font-bold text-white">{cameraCounts[cam.id] || 0}</span>
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded border border-white/5 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-[0.65rem] font-bold text-white/90 font-mono">
                            {currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <button className="text-white/40 hover:text-yellow-400 transition-colors" onClick={(e) => { e.stopPropagation(); /* Add Favorite Logic Here */ }}>
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                </div>
              ) : (
                /* Focus Mode */
                <div className="relative w-full aspect-video max-h-[75vh] flex flex-col items-center justify-center mx-auto bg-black/20 rounded-lg overflow-hidden shadow-2xl border border-white/5">
                  {activeCamera && <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${activeCamera}`} hideOverlay={true} />}
                  <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur border border-white/10 rounded-lg flex items-center gap-3">
                      <button
                        onClick={() => {
                          setIsGlobalView(true);
                          setActiveCamera(null);
                          navigate('/neural-stream', { replace: true });
                        }}
                        className="p-1 hover:bg-white/10 rounded-md transition-colors text-accent border-r border-white/10 pr-3 mr-1"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] font-black text-white/50 uppercase tracking-widest block mb-0.5">Neural Stream Active</span>
                        <span className="text-[1rem] font-bold text-white tracking-tight">
                          {cameras.find(c => c.id === activeCamera)?.name || 'Unknown Zone'}
                        </span>
                      </div>
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

            {/* CAMERA GRID PAGINATION FOOTER (Attached directly to the black container) */}
            {isGlobalView && filteredCameras.length > cameraLimit && (
              <div className="p-3 bg-surface/5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[0.65rem] text-text-gray font-medium">
                  Showing {cameraOffset + 1} to {Math.min(cameraOffset + cameraLimit, filteredCameras.length)} of {filteredCameras.length} cameras
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCameraOffset(prev => Math.max(0, prev - cameraLimit))}
                    disabled={cameraOffset === 0}
                    className="w-7 h-7 flex items-center justify-center bg-transparent border border-white/10 rounded hover:bg-white/5 disabled:opacity-30 transition-all text-white/70"
                  >
                    {'<'}
                  </button>

                  {Array.from({ length: Math.ceil(filteredCameras.length / cameraLimit) }).map((_, idx) => {
                    const pageOffset = idx * cameraLimit;
                    const isActive = cameraOffset === pageOffset;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCameraOffset(pageOffset)}
                        className={`w-7 h-7 flex items-center justify-center border rounded text-[0.7rem] font-bold transition-all ${isActive ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-transparent text-white/70 border-white/10 hover:bg-white/5'}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCameraOffset(prev => prev + cameraLimit)}
                    disabled={cameraOffset + cameraLimit >= filteredCameras.length}
                    className="w-7 h-7 flex items-center justify-center bg-transparent border border-white/10 rounded hover:bg-white/5 disabled:opacity-30 transition-all text-white/70"
                  >
                    {'>'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div> {/* End Unified Neural Hub */}


      {/* FULL-WIDTH INTELLIGENCE & BREAKDOWN SECTION */}
      <div className="flex-1 flex flex-col xl:flex-row gap-4 overflow-hidden">
        {/* LOGS TABLE OVERVIEW */}
        <div className="flex-1 bg-card rounded-lg border border-border shadow-premium flex flex-col overflow-hidden min-w-0">
          {/* LOGS HEADER + FILTERS (SINGLE LINE COMPACT) */}
          <div className="px-3 sm:px-5 py-2 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 bg-surface/10">
            <div className="flex items-center gap-3 shrink-0 min-w-0">
              <div className="p-1.5 bg-accent/10 text-accent rounded-md border border-accent/20">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-black text-text-dark tracking-tight uppercase">Logs</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[0.5rem] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                </div>
                <span className="text-[0.6rem] font-bold text-text-gray uppercase tracking-widest border-l border-border pl-3 hidden xl:block truncate max-w-[150px] 2xl:max-w-[350px]">
                  {isGlobalView ? 'Global' : `CAM-${String(activeCamera).padStart(2, '0')}`} / {activeScenarioLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end">
              {/* Compact Inline Status Message */}
              {currentSummary.status_message && (
                <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border text-[0.6rem] font-black uppercase tracking-tight
         ${currentSummary.threat_level === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' :
                    currentSummary.threat_level === 'Elevated' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                      'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${currentSummary.threat_level === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="truncate max-w-[100px] lg:max-w-none">{currentSummary.status_message}</span>
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

              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`p-1.5 rounded-md text-xs transition-all border shrink-0
         ${showFilterMenu || severityFilter !== 'ALL' ? 'bg-accent text-white border-accent' : 'bg-surface text-text-gray border-border hover:border-accent/40'}`}
                  title="Filter by Severity"
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-premium z-[100] p-2 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[0.6rem] font-black text-text-gray uppercase tracking-widest px-3 py-2 border-b border-border mb-1">Filter Severity</div>
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                      <button
                        key={sev}
                        onClick={() => { setSeverityFilter(sev); setShowFilterMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[0.65rem] font-black transition-all flex items-center justify-between
             ${severityFilter === sev ? 'bg-accent/10 text-accent' : 'text-text-gray hover:bg-surface hover:text-text-dark'}`}
                      >
                        {sev}
                        {severityFilter === sev && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLE HEADER */}
          {/* TABLE HEADER — hidden on mobile, card view instead */}
          <div className="hidden lg:grid grid-cols-12 bg-surface/80 border-y border-border text-[0.65rem] font-black tracking-widest text-text-gray">
            <div className="col-span-1 border-r border-border/30 px-4 py-2.5 text-center">Status</div>
            <div className="col-span-3 border-r border-border/30 px-4 py-2.5">Event Detail</div>
            <div className="col-span-2 border-r border-border/30 px-4 py-2.5">Event ID</div>
            <div className="col-span-1 border-r border-border/30 px-2 py-2.5">Node</div>
            <div className="col-span-1 border-r border-border/30 px-2 py-2.5 text-center">Conf.</div>
            <div className="col-span-1 border-r border-border/30 px-2 py-2.5 text-center">Severity</div>
            <div className="col-span-1 border-r border-border/30 px-4 py-2.5">Timestamp</div>
            <div className="col-span-1 border-r border-border/30 px-4 py-2.5">Elapsed</div>
            <div className="col-span-1 px-4 py-2.5 text-center">Action</div>
          </div>

          {/* LOG ROWS */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingLogs ? (
              <div className="flex flex-col">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-border/30 animate-pulse">
                    <div className="col-span-1 h-8 w-8 bg-surface rounded-lg" />
                    <div className="col-span-2 h-4 bg-surface rounded w-3/4" />
                    <div className="col-span-2 h-4 bg-surface rounded w-1/2" />
                    <div className="col-span-1 h-4 bg-surface rounded w-full" />
                    <div className="col-span-1 h-4 bg-surface rounded w-1/2" />
                    <div className="col-span-1 h-4 bg-surface rounded w-3/4" />
                    <div className="col-span-2 h-4 bg-surface rounded w-2/3" />
                    <div className="col-span-1 h-4 bg-surface rounded w-1/2" />
                    <div className="col-span-1 h-6 bg-surface rounded w-6 mx-auto" />
                  </div>
                ))}
              </div>
            ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`
         /* Desktop: table row */
         lg:grid lg:grid-cols-12 lg:items-stretch
         /* Mobile: card layout */
         flex flex-col gap-2 p-3 sm:p-4 lg:p-0 lg:flex-row
         transition-all duration-200 border-b hover:bg-surface/50 group/row
       ${log.isAlert ? 'bg-rose-500/[0.02] border-rose-500/20 hover:bg-rose-500/[0.05]' : 'border-border/40 even:bg-surface/20'}`}
              >
                {/* Icon or Thumbnail */}
                {/* Status Icon/Thumbnail */}
                <div className="lg:col-span-1 border-r border-border/20 px-4 py-2 flex items-center justify-center gap-3 lg:gap-0 shrink-0">
                  {log.rawLog?.image_base64 ? (
                    <div className="w-10 h-10 lg:w-8 lg:h-8 rounded overflow-hidden border border-border/50 shadow-sm relative group cursor-pointer shrink-0" onClick={() => setSelectedLog(log)}>
                      <img
                        src={`data:image/jpeg;base64,${log.rawLog.image_base64}`}
                        alt="Event"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      {log.isAlert && <div className="absolute inset-0 border border-rose-500 rounded pointer-events-none"></div>}
                    </div>
                  ) : (
                    <div className={`w-10 h-10 lg:w-8 lg:h-8 rounded ${log.bg} flex items-center justify-center border border-border/10 shrink-0`}>
                      <log.icon className={`w-4 h-4 ${log.iconColor}`} />
                    </div>
                  )}
                  {/* Mobile: show event name next to icon */}
                  <div className="lg:hidden flex-1 min-w-0">
                    <span className={`text-[0.75rem] font-extrabold tracking-wide ${log.iconColor} truncate block`}>{log.type}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.6rem] font-mono text-text-gray">{log.camera}</span>
                      <span className={`text-[0.5rem] px-1.5 py-0.5 rounded font-black tracking-tight border ${log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : log.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-blue-500/20 text-blue-500 border-blue-500/30'}`}>{log.severity}</span>
                    </div>
                  </div>
                  {/* Mobile: action button */}
                  <button className="lg:hidden p-2 text-text-gray hover:text-accent hover:bg-accent/10 rounded-lg transition-colors ml-auto shrink-0" onClick={() => setSelectedLog(log)}>
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Desktop-only table columns */}
                <div
                  className="hidden lg:flex col-span-3 border-r border-border/20 px-4 py-2 items-center gap-2 min-w-0 cursor-pointer group/event"
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
                  <span className={`text-[0.7rem] font-extrabold tracking-tight ${log.iconColor} truncate group-hover/event:text-accent transition-colors`}>
                    {log.type}
                  </span>
                  {log.isAlert && (
                    <span className="text-rose-500 text-[0.55rem] font-black animate-pulse tracking-wider shrink-0">Alert</span>
                  )}
                </div>

                <div className="hidden lg:flex col-span-2 border-r border-border/20 px-4 py-2 items-center">
                  <span className="text-[0.6rem] font-mono text-text-gray font-bold tracking-tight">{log.eventId}</span>
                </div>

                <div className="hidden lg:flex col-span-1 border-r border-border/20 px-2 py-2 items-center">
                  <span className="flex items-center gap-1.5 text-[0.65rem] font-bold text-text-dark whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    {log.camera}
                  </span>
                </div>

                <div className="hidden lg:flex col-span-1 border-r border-border/20 px-2 py-2 items-center justify-center">
                  <span className="text-[0.65rem] font-bold text-text-dark">{log.confidence}</span>
                </div>

                <div className="hidden lg:flex col-span-1 border-r border-border/20 px-2 py-2 items-center justify-center">
                  <span className={`inline-block w-full text-center text-[0.55rem] px-1 py-0.5 rounded font-black tracking-tight border ${log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                    log.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                      log.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                        'bg-slate-500/20 text-slate-500 border-slate-500/30'
                    }`}>
                    {log.severity.charAt(0) + log.severity.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="hidden lg:flex col-span-1 border-r border-border/20 px-4 py-2 items-center justify-center">
                  <span className="text-[0.65rem] font-mono text-text-dark font-bold">{log.timestamp}</span>
                </div>

                <div className="hidden lg:flex col-span-1 border-r border-border/20 px-4 py-2 items-center">
                  <span className="text-[0.6rem] text-text-gray font-bold font-mono tracking-tight whitespace-nowrap">{log.timeAgo}</span>
                </div>

                <div className="hidden lg:flex col-span-1 justify-center px-4 py-2 items-center">
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
            <span className="text-[0.65rem] text-text-gray font-bold tracking-tight">
              Showing {currentSummary.count ? logsOffset + 1 : 0}-{Math.min(logsOffset + logs.length, currentSummary.count || 0)} of {currentSummary.count || 0} events
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
                disabled={logsOffset + logs.length >= (currentSummary.count || 0) || loadingLogs}
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
            <p className="text-[0.6rem] font-bold text-text-gray tracking-tight mt-1.5 flex justify-between">
              <span>Total Entities</span>
              <span className="text-accent">{currentSummary.object_breakdown ? Object.values(currentSummary.object_breakdown).reduce((a, b) => a + b, 0) : 0} detected</span>
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
            {(() => {
              const breakdown = currentSummary.object_breakdown || {};
              // Aggregate by friendly name to avoid duplicates like person/Person or machine keys
              const aggregated = {};
              Object.entries(breakdown).forEach(([rawKey, count]) => {
                const normalizedRawKey = rawKey.toLowerCase().trim();
                const registryName = scenarioNameByKey.get(normalizedRawKey);

                // If in registry, use exact registry name. Otherwise format the key.
                const rawName = registryName || rawKey.replace(/_/g, ' ');
                const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
                const groupKey = displayName.toLowerCase().trim();

                if (!aggregated[groupKey]) {
                  aggregated[groupKey] = {
                    count: 0,
                    rawKey,
                    name: displayName
                  };
                }
                aggregated[groupKey].count += count;
              });

              const items = Object.values(aggregated).sort((a, b) => b.count - a.count);

              if (items.length > 0) {
                return (
                  <div className="space-y-1">
                    {items.map((item) => {
                      const scenario = SCENARIO_UI[item.rawKey] || SCENARIO_UI['Default'];
                      return (
                        <div
                          key={item.name}
                          className="flex items-center p-2 rounded-lg hover:bg-surface transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedScenarioKey(item.rawKey);
                            setIsGlobalView(true);
                            setActiveCamera(null);
                            setLogsOffset(0);
                            setLogs([]);
                          }}
                          title={`Filter by ${item.name}`}
                        >
                          <div className={`w-8 h-8 rounded-md ${scenario.bg} flex items-center justify-center border border-border/10 shrink-0`}>
                            <scenario.icon className={`w-3.5 h-3.5 ${scenario.iconColor}`} />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="text-[0.65rem] font-bold text-text-dark truncate tracking-tight group-hover:text-accent transition-colors">
                              {item.name}
                            </div>
                            <div className="w-full bg-border/50 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div className={`h-full ${scenario.bg.replace('/10', '').replace('/15', '')} ${scenario.bg.includes('rose') ? 'bg-rose-500' : scenario.bg.includes('amber') ? 'bg-amber-500' : 'bg-accent'}`} style={{ width: `${Math.min(100, (item.count / Math.max(1, currentSummary.count || 1)) * 100)}%` }}></div>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center justify-center min-w-[2rem]">
                            <span className="text-sm font-black text-text-dark">{item.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              return (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center mb-2">
                    <Target className="w-4 h-4 text-border" />
                  </div>
                  <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest">No detailed analytics</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      {/* SCENARIO-CAMERA MATRIX */}
      {matrixData.scenarios.length > 0 && matrixData.cameras.length > 0 && (
        <div className="w-full bg-card rounded-lg border border-border shadow-premium overflow-hidden">
          <div className="px-3 sm:px-5 py-3 border-b border-border bg-surface/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-accent/10 text-accent rounded-md border border-accent/20">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-black text-text-dark tracking-tight">Camera Wise Status</h2>
                <span className="text-[0.6rem] font-bold text-text-gray tracking-tight">
                  Intelligence overlay for {activeAreaLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[0.6rem] font-bold tracking-tight text-text-gray">
              {matrixData.cameras.length > 10 && (
                <button
                  onClick={() => setShowOnlyActiveCams(!showOnlyActiveCams)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${showOnlyActiveCams ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface border-border text-text-gray'
                    }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${showOnlyActiveCams ? 'bg-accent animate-pulse' : 'bg-text-gray'}`}></div>
                  {showOnlyActiveCams ? 'Showing Active' : 'Showing All'}
                </button>
              )}
              <div className="h-4 w-px bg-border hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-surface border border-border"></span> No events</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> 1-2 Low</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-600"></span> 3-5 Medium</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> &gt;5 High</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {(() => {
              const activeCameraIds = new Set();
              Object.values(matrixData.matrix).forEach(camCounts => {
                Object.keys(camCounts).forEach(cid => {
                  if (camCounts[cid] > 0) activeCameraIds.add(Number(cid));
                });
              });

              const displayedCameras = showOnlyActiveCams && matrixData.cameras.length > 10
                ? matrixData.cameras.filter(c => activeCameraIds.has(c.id))
                : matrixData.cameras;

              const filteredScenarios = matrixData.scenarios.filter(s =>
                selectedScenarioKey === 'all' || s.toLowerCase() === selectedScenarioKey.toLowerCase()
              );

              return (
                <table className="w-full text-[0.6rem] border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface/40">
                      <th className="text-left px-4 py-2 font-bold text-text-dark tracking-tight sticky left-0 bg-surface z-10 min-w-[120px] border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Scenario</th>
                      {displayedCameras.map(cam => (
                        <th key={cam.id} className="text-center px-1 py-2 font-bold tracking-tight min-w-[75px] border-r border-border/40">
                          <div className="flex flex-col items-center">
                            <span className="text-[0.5rem] text-text-gray/70 font-mono">CAM {String(cam.id).padStart(2, '0')}</span>
                            <span className="text-[0.6rem] text-text-dark truncate max-w-[70px] leading-tight">{cam.name}</span>
                          </div>
                        </th>
                      ))}
                      <th className="text-center px-3 py-2 font-bold text-text-dark tracking-tight min-w-[75px]">Total Alerts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios.map((scenario, idx) => {
                      const scenarioUI = SCENARIO_UI[scenario] || SCENARIO_UI['Default'];
                      const Icon = scenarioUI.icon;
                      const rowTotal = matrixData.cameras.reduce((sum, cam) => sum + ((matrixData.matrix[scenario] || {})[cam.id] || 0), 0);
                      return (
                        <tr key={scenario} className={`border-b border-border/40 hover:bg-surface/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface/5'}`}>
                          <td className="px-4 py-2 sticky left-0 bg-card z-10 border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2">
                              <div className={`w-4.5 h-4.5 rounded flex items-center justify-center ${scenarioUI.bg}`}>
                                <Icon className={`w-2.5 h-2.5 ${scenarioUI.color}`} />
                              </div>
                              <span className="font-semibold text-text-dark text-[0.65rem] tracking-tight whitespace-nowrap">
                                {(() => {
                                  const name = scenarioNameByKey.get(scenario.toLowerCase()) || scenario.replace(/_/g, ' ');
                                  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                                })()}
                              </span>
                            </div>
                          </td>
                          {displayedCameras.map(cam => {
                            const count = (matrixData.matrix[scenario] || {})[cam.id] || 0;
                            return (
                              <td key={cam.id} className="text-center px-2 py-2.5 border-r border-border/40">
                                {count > 0 ? (
                                  <span className={`inline-flex items-center justify-center w-8 h-5 rounded text-[0.6rem] font-bold text-white shadow-sm ${count <= 2
                                    ? 'bg-amber-500'
                                    : count <= 5
                                      ? 'bg-amber-600'
                                      : 'bg-rose-500'
                                    }`}>
                                    {count}
                                  </span>
                                ) : (
                                  <span className="text-text-dark/30 text-[0.6rem] font-bold">0</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="text-center px-3 py-2.5">
                            {rowTotal > 0 ? (
                              <span className={`inline-block w-8 py-0.5 rounded text-[0.6rem] font-bold text-white shadow-sm ${rowTotal <= 3 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}>{rowTotal}</span>
                            ) : (
                              <span className="text-text-dark/30 text-[0.6rem] font-bold">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-surface/30">
                      <td className="px-4 py-2.5 font-black text-text-dark tracking-widest text-[0.6rem] sticky left-0 bg-surface z-10 border-r border-border">
                        Total Alerts ({activeAreaLabel})
                      </td>
                      {displayedCameras.map(cam => {
                        const colTotal = filteredScenarios.reduce((sum, sk) => sum + ((matrixData.matrix[sk] || {})[cam.id] || 0), 0);
                        return (
                          <td key={cam.id} className="text-center px-2 py-2.5 border-r border-border/40">
                            {colTotal > 0 ? (
                              <span className="text-[0.65rem] font-black text-accent">{colTotal}</span>
                            ) : (
                              <span className="text-text-dark/30 text-[0.6rem] font-bold">0</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center px-3 py-2.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-accent text-white text-[0.7rem] font-black shadow-sm">
                          {filteredScenarios.reduce((sum, sk) => {
                            return sum + matrixData.cameras.reduce((cSum, cam) => cSum + ((matrixData.matrix[sk] || {})[cam.id] || 0), 0);
                          }, 0)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              );
            })()}
          </div>
        </div>
      )}

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
