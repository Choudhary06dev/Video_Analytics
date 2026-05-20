import React, { useState, useEffect } from 'react';
import {
  fetchAdminCameras,
  fetchCameraScenarios,
  syncCameraScenarios,
  getStreamUrl
} from '../../services/cameraService';
import {
  BrainCircuit,
  Search,
  Loader2,
  Cctv,
  Zap,
  CheckCircle2,
  X,
  ChevronRight,
  Activity,
  LayoutGrid,
  MousePointer2,
  Brain
} from 'lucide-react';

const UNAUTHORIZED_ENTRY_KEY = "UNAUTHORIZED_ENTRY_INTO_RESTRICTED_AREAS";

function getRestrictedZonePoints(config = {}) {
  if (Array.isArray(config.restricted_zone)) return config.restricted_zone;
  if (Array.isArray(config.restricted_zones?.[0])) return config.restricted_zones[0];
  return [];
}

function RestrictedZoneEditor({ camera, points = [], onChange }) {
  const handleCanvasClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    onChange([...points, {
      x: Number(Math.max(0, Math.min(1, x)).toFixed(4)),
      y: Number(Math.max(0, Math.min(1, y)).toFixed(4)),
    }]);
  };

  const pointString = points.map(point => `${point.x * 100},${point.y * 100}`).join(' ');

  return (
    <div className="mt-3 pt-3 border-t border-accent/10" onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-accent/80 flex items-center gap-1.5">
          <MousePointer2 className="w-3 h-3" />
          Restricted Zone
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(points.slice(0, -1))}
            disabled={!points.length}
            className="text-[8px] font-black uppercase tracking-widest text-text-gray hover:text-accent disabled:opacity-30"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={!points.length}
            className="text-[8px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 disabled:opacity-30"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        onClick={handleCanvasClick}
        className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-accent/20 cursor-crosshair"
      >
        <img
          src={getStreamUrl(camera.id)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {points.length >= 3 && (
            <polygon points={pointString} fill="rgba(239,68,68,0.28)" stroke="rgb(239,68,68)" strokeWidth="0.7" />
          )}
          {points.length === 2 && (
            <polyline points={pointString} fill="none" stroke="rgb(239,68,68)" strokeWidth="0.7" />
          )}
          {points.map((point, index) => (
            <circle key={`${point.x}-${point.y}-${index}`} cx={point.x * 100} cy={point.y * 100} r="1.8" fill="rgb(239,68,68)" stroke="white" strokeWidth="0.4" />
          ))}
        </svg>
        {!points.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="px-3 py-1 rounded bg-black/70 text-white text-[8px] font-black uppercase tracking-widest">
              Click 3+ points
            </span>
          </div>
        )}
      </div>

      <p className="mt-2 text-[8px] font-bold uppercase tracking-widest text-text-gray">
        Person feet inside this polygon will trigger the restricted-area alert.
      </p>
    </div>
  );
}

export default function ScenarioOrchestration() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Selection States
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [scenarioData, setScenarioData] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminCameras();
      setCameras(data.cameras || data || []);
    } catch (err) {
      console.error("Failed to load cameras", err);
    } finally {
      setLoading(false);
    }
  };

  const openOrchestrator = async (camera) => {
    setSelectedCamera(camera);
    setShowConfigModal(true);
    setLoadingScenarios(true);
    try {
      const data = await fetchCameraScenarios(camera.id);
      setScenarioData(data);
    } catch (err) {
      console.error("Failed to load scenarios", err);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const handleSaveScenarios = async () => {
    const enabledIds = scenarioData.filter(s => s.is_enabled).map(s => s.id);
    const configs = {};
    scenarioData.forEach(s => {
      if (s.is_enabled && s.config) {
        configs[s.key] = s.config;
      }
    });

    try {
      setSubmitting(true);
      await syncCameraScenarios(selectedCamera.id, enabledIds, configs);
      setShowConfigModal(false);
      loadCameras(); // Refresh counts
    } catch (err) {
      alert(err.message || "Failed to sync scenarios");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleScenarioInState = (id) => {
    setScenarioData(prev => prev.map(s =>
      s.id === id ? { ...s, is_enabled: !s.is_enabled } : s
    ));
  };

  const updateScenarioConfig = (id, key, value) => {
    setScenarioData(prev => prev.map(s =>
      s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s
    ));
  };

  const updateRestrictedZone = (id, points) => {
    setScenarioData(prev => prev.map(s => {
      if (s.id !== id) return s;
      const nextConfig = { ...(s.config || {}), restricted_zone: points };
      delete nextConfig.restricted_zones;
      return { ...s, config: nextConfig };
    }));
  };

  const toggleAllScenarios = (enable) => {
    setScenarioData(prev => prev.map(s => ({ ...s, is_enabled: enable })));
  };

  const filteredCameras = cameras.filter(cam =>
    cam.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 bg-slate-50">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 font-sans">Initializing Neural Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans pb-20">

      {/* Header Section - Aligned with other pages */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
            <BrainCircuit className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-text-dark truncate">
              Scenario <span className="text-accent underline decoration-accent/20 underline-offset-4">Orchestration</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold text-text-gray uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-1.5 flex items-center gap-2 truncate">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
              Neural Path Mapping & Model Deployment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group w-full lg:w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="FILTER NODES..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-11 pr-6 py-2.5 bg-card border border-border rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-accent transition-all w-full shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid View - Aligned Corners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCameras.map((camera) => (
          <div
            key={camera.id}
            onClick={() => openOrchestrator(camera)}
            className="group bg-card border border-border rounded-xl p-6 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 cursor-pointer overflow-hidden relative"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center border border-border group-hover:bg-accent group-hover:border-accent transition-all duration-300">
                <Cctv className="w-6 h-6 text-text-gray group-hover:text-white transition-all" />
              </div>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-all
        ${camera.is_active
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${camera.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {camera.is_active ? 'Active Node' : 'Offline'}
              </div>



            </div>

            <div className="mb-8">
              <h3 className="text-sm font-black text-text-dark uppercase tracking-tight group-hover:text-accent transition-colors">{camera.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="w-3 h-3 text-text-gray" />
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-widest opacity-60 truncate">{camera.source_url.split('@').pop()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-text-gray uppercase tracking-[2px] mb-1">Intelligence</span>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-accent text-white rounded font-black text-[11px] shadow-sm">
                    {camera.scenario_count || '0'}
                  </div>
                  <span className="text-[8px] font-bold text-text-gray uppercase tracking-widest">Active Models</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border group-hover:bg-accent group-hover:text-white transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Landscape Modal - Consistent Corners */}
      {showConfigModal && selectedCamera && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-[1100px] rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col h-auto max-h-[85vh] animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/5 rounded-xl flex items-center justify-center border border-accent/10 shadow-sm shrink-0">
                  <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight text-text-dark leading-none truncate">
                    Intelligence <span className="text-accent">Configuration</span>
                  </h2>
                  <p className="text-[8px] sm:text-[9px] font-black text-text-gray uppercase tracking-[2px] sm:tracking-[3px] mt-1.5 sm:mt-2 truncate">
                    NODE: <span className="text-accent">{selectedCamera.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-surface hover:bg-rose-500/10 hover:text-rose-600 flex items-center justify-center text-text-gray transition-all border border-border shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-hidden flex flex-col">
              {loadingScenarios ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[5px] text-text-gray">Retrieving Scenario Registry...</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 bg-surface/50 p-3 rounded-lg border border-border gap-3">
                    <div className="flex items-center gap-3 text-text-gray">
                      <LayoutGrid className="w-4 h-4" />
                      <h3 className="text-[9px] font-black uppercase tracking-[2px] sm:tracking-[3px]">Scenario Selection Matrix</h3>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => toggleAllScenarios(true)}
                        className="text-[9px] font-black uppercase tracking-[2px] sm:tracking-[3px] text-accent hover:brightness-95 font-bold transition-all"
                      >
                        Select All
                      </button>
                      <div className="w-px h-3 bg-border my-auto"></div>
                      <button
                        onClick={() => toggleAllScenarios(false)}
                        className="text-[9px] font-black uppercase tracking-[2px] sm:tracking-[3px] text-text-gray hover:text-text-dark font-bold transition-all"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-2 custom-scrollbar max-h-[380px]">
                    {scenarioData.map(scenario => (
                      <div
                        key={scenario.id}
                        className={`group flex flex-col p-4 rounded-lg border transition-all duration-200
             ${scenario.is_enabled
                            ? 'bg-accent/5 border-accent/20 shadow-sm'
                            : 'bg-card border-border hover:border-accent/30 hover:bg-surface'}
             ${scenario.is_enabled && scenario.key === UNAUTHORIZED_ENTRY_KEY ? 'md:col-span-2 xl:col-span-2' : ''}`}
                      >
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleScenarioInState(scenario.id)}>
                          <div className="flex items-center gap-3 max-w-[85%]">
                            {scenario.is_enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-border group-hover:border-accent/30 shrink-0" />
                            )}
                            <span className={`text-[11px] font-black uppercase tracking-tight truncate 
                ${scenario.is_enabled ? 'text-accent font-bold' : 'text-text-gray'}`}>
                              {scenario.name}
                            </span>
                          </div>
                          {scenario.is_enabled && <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />}
                        </div>

                        {/* Config Input */}
                        {scenario.is_enabled && scenario.name === "Visitor Count Limit Exceeded" && (
                          <div className="mt-3 pt-3 border-t border-accent/10 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent/80">Max Limit:</span>
                            <input
                              type="number"
                              min="1"
                              value={scenario.config?.limit || 2}
                              onChange={(e) => updateScenarioConfig(scenario.id, 'limit', parseInt(e.target.value) || 2)}
                              className="w-16 bg-white border border-accent/20 rounded px-2 py-1 text-[11px] font-bold text-accent outline-none focus:border-accent/40 text-center shadow-sm"
                            />
                          </div>
                        )}

                        {scenario.is_enabled && scenario.key === UNAUTHORIZED_ENTRY_KEY && (
                          <>
                            <div className="mt-3 pt-3 border-t border-accent/10 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                              <span className="text-[10px] font-black uppercase tracking-widest text-accent/80">Dwell Time (Seconds):</span>
                              <input
                                type="number"
                                min="0"
                                value={scenario.config?.dwell_time || 0}
                                onChange={(e) => updateScenarioConfig(scenario.id, 'dwell_time', parseInt(e.target.value) || 0)}
                                className="w-16 bg-white border border-accent/20 rounded px-2 py-1 text-[11px] font-bold text-accent outline-none focus:border-accent/40 text-center shadow-sm"
                              />
                            </div>
                            <RestrictedZoneEditor
                              camera={selectedCamera}
                              points={getRestrictedZonePoints(scenario.config)}
                              onChange={(points) => updateRestrictedZone(scenario.id, points)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-text-gray mb-1">Engine Load</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] sm:text-[11px] font-black text-text-dark uppercase">Core Stable</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-text-gray mb-1">Selected</span>
                        <span className="text-base sm:text-lg font-black text-accent tracking-tighter leading-none">
                          {scenarioData.filter(s => s.is_enabled).length} <span className="text-[9px] font-black text-text-gray ml-1">MODELS</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                      <button
                        onClick={() => setShowConfigModal(false)}
                        className="flex-1 md:flex-none px-6 sm:px-8 py-2.5 bg-surface hover:bg-slate-200 text-text-dark rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-border"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveScenarios}
                        disabled={submitting}
                        className="flex-1 md:flex-none px-8 sm:px-12 py-2.5 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-accent/20 hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      >
                        {submitting ? 'DEPLOYING...' : 'SAVE CONFIG'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
  `}} />
    </div>
  );
}
