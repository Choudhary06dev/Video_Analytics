import React, { useState, useEffect } from 'react';
import {
  fetchAdminCameras,
  fetchCameraScenarios,
  syncCameraScenarios
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
    try {
      setSubmitting(true);
      await syncCameraScenarios(selectedCamera.id, enabledIds);
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

  const toggleAllScenarios = (enable) => {
    setScenarioData(prev => prev.map(s => ({ ...s, is_enabled: enable })));
  };

  const filteredCameras = cameras.filter(cam =>
    cam.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 bg-slate-50">
        <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 font-sans">Initializing Neural Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans pb-20">

      {/* Header Section - Aligned with other pages */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-600/10 rounded-lg flex items-center justify-center border border-violet-600/20">
            <BrainCircuit className="w-7 h-7 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark">
              Scenario <span className="text-violet-600 underline decoration-violet-600/20 underline-offset-4">Orchestration</span>
            </h1>
            <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Neural Path Mapping & Model Deployment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray group-focus-within:text-violet-500 transition-colors" />
            <input
              type="text"
              placeholder="FILTER NODES..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-11 pr-6 py-2.5 bg-card border border-border rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-violet-500 transition-all w-full md:w-[300px] shadow-sm"
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
            className="group bg-card border border-border rounded-xl p-6 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 cursor-pointer overflow-hidden relative"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center border border-border group-hover:bg-violet-600 group-hover:border-violet-600 transition-all duration-300">
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
              <h3 className="text-sm font-black text-text-dark uppercase tracking-tight group-hover:text-violet-600 transition-colors">{camera.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="w-3 h-3 text-text-gray" />
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-widest opacity-60 truncate">{camera.source_url.split('@').pop()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-text-gray uppercase tracking-[2px] mb-1">Intelligence</span>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-violet-600 text-white rounded font-black text-[11px] shadow-sm">
                    {camera.scenario_count || '0'}
                  </div>
                  <span className="text-[8px] font-bold text-text-gray uppercase tracking-widest">Active Models</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border group-hover:bg-violet-600 group-hover:text-white transition-all">
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
            <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-200">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-text-dark leading-none">
                    Intelligence <span className="text-violet-600">Configuration</span>
                  </h2>
                  <p className="text-[9px] font-black text-text-gray uppercase tracking-[3px] mt-2">
                    NODE: <span className="text-violet-600">{selectedCamera.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-10 h-10 rounded-lg bg-surface hover:bg-rose-500/10 hover:text-rose-600 flex items-center justify-center text-text-gray transition-all border border-border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-hidden flex flex-col">
              {loadingScenarios ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[5px] text-text-gray">Retrieving Scenario Registry...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6 bg-surface/50 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3 text-text-gray">
                        <LayoutGrid className="w-4 h-4" />
                        <h3 className="text-[9px] font-black uppercase tracking-[3px]">Scenario Selection Matrix</h3>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => toggleAllScenarios(true)}
                            className="text-[9px] font-black uppercase tracking-[3px] text-violet-600 hover:text-violet-700 font-bold transition-all"
                        >
                            Select All
                        </button>
                        <div className="w-px h-3 bg-border my-auto"></div>
                        <button 
                            onClick={() => toggleAllScenarios(false)}
                            className="text-[9px] font-black uppercase tracking-[3px] text-text-gray hover:text-text-dark font-bold transition-all"
                        >
                            Clear All
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-2 custom-scrollbar max-h-[380px]">
                    {scenarioData.map(scenario => (
                      <div
                        key={scenario.id}
                        onClick={() => toggleScenarioInState(scenario.id)}
                        className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer
                          ${scenario.is_enabled
                            ? 'bg-violet-600 border-violet-600 shadow-lg shadow-violet-100'
                            : 'bg-card border-border hover:border-violet-500/30 hover:bg-surface'}`}
                      >
                        <div className="flex items-center gap-3 max-w-[85%]">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all shrink-0
                            ${scenario.is_enabled ? 'bg-white border-white scale-110' : 'bg-transparent border-border group-hover:border-violet-500/30'}`} />
                          <span className={`text-[11px] font-black uppercase tracking-tight truncate 
                              ${scenario.is_enabled ? 'text-white' : 'text-text-gray'}`}>
                            {scenario.name}
                          </span>
                        </div>
                        {scenario.is_enabled && <Zap className="w-3.5 h-3.5 text-white animate-pulse" />}
                      </div>
                    ))}
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-8 pt-8 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-text-gray mb-1">Engine Load</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[11px] font-black text-text-dark uppercase">Core Stable</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-text-gray mb-1">Selected</span>
                        <span className="text-lg font-black text-violet-600 tracking-tighter leading-none">
                          {scenarioData.filter(s => s.is_enabled).length} <span className="text-[9px] font-black text-text-gray ml-1">MODELS</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowConfigModal(false)}
                        className="px-8 py-2.5 bg-surface hover:bg-slate-200 text-text-dark rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-border"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveScenarios}
                        disabled={submitting}
                        className="px-12 py-2.5 bg-violet-600 text-white rounded-lg text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-violet-200 hover:bg-violet-700 hover:-translate-y-0.5 transition-all disabled:opacity-50"
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
