import React, { useState, useEffect } from 'react';
import { 
  fetchAdminCameras, 
  fetchAdminAreas, 
  createCamera, 
  updateCamera, 
  deleteCamera,
  fetchCameraScenarios,
  syncCameraScenarios,
  fetchSystemHealth
} from '../../services/cameraService';

import { 
  Cctv, 
  Plus, 
  Map, 
  Settings2, 
  Cpu, 
  Video,
  Layers,
  Search,
  MoreVertical,
  Loader2,
  Edit2,
  Trash2,
  X,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function SurveillanceConfig() {
  const [cameras, setCameras] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [health, setHealth] = useState({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const navigate = useNavigate();

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const [formData, setFormData] = useState({ name: '', source_url: '', area_id: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);

  // AI Scenario States
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [scenarioData, setScenarioData] = useState([]);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * pageSize;
      const [camResponse, areaData, healthData] = await Promise.all([
        fetchAdminCameras(skip, pageSize),
        fetchAdminAreas(),
        fetchSystemHealth()
      ]);
      setCameras(camResponse.cameras || []);
      setTotalItems(camResponse.total || 0);
      setAreas(areaData.areas || areaData || []);
      setHealth(healthData);
    } catch (err) {
      console.error("Failed to load surveillance data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCamera = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createCamera(formData);
      setShowAddModal(false);
      setFormData({ name: '', source_url: '', area_id: '', is_active: true });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to create camera");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCamera = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateCamera(selectedCamera.id, formData);
      setShowEditModal(false);
      setSelectedCamera(null);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to update camera");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCamera = async () => {
    try {
      setSubmitting(true);
      await deleteCamera(selectedCamera.id);
      setShowDeleteModal(false);
      setSelectedCamera(null);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete camera");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (camera) => {
    setSelectedCamera(camera);
    setFormData({
      name: camera.name,
      source_url: camera.source_url,
      area_id: camera.area_id,
      is_active: camera.is_active !== false
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (camera) => {
    setSelectedCamera(camera);
    setShowDeleteModal(true);
  };

  const openScenarioModal = async (camera) => {
    setSelectedCamera(camera);
    setShowScenarioModal(true);
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
      setShowScenarioModal(false);
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
    cam.name.toLowerCase().includes(filter.toLowerCase()) || 
    (cam.source_url && cam.source_url.toLowerCase().includes(filter.toLowerCase()))
  );

  if (loading) {
      return (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-text-gray">Indexing Neural Hubs...</p>
          </div>
      );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
            <Video className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-text-dark font-sans truncate">
              Surveillance <span className="text-accent underline decoration-accent/20 underline-offset-4">Registry</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold text-text-gray uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-1.5 flex items-center gap-2 truncate">
              Hardware Abstraction & Zone Mapping
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            <button 
                onClick={() => navigate('/admin/areas')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-surface border border-border text-text-gray px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] sm:text-[11px] transition-all hover:bg-border hover:text-text-dark"
            >
                <Map className="w-4 h-4" />
                Edit Mapping
            </button>
            <button 
                onClick={() => {
                  setFormData({ name: '', source_url: '', area_id: areas.length > 0 ? areas[0].id : '', is_active: true });
                  setShowAddModal(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-accent text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] sm:text-[11px] transition-all shadow-md shadow-accent/20 hover:-translate-y-1 active:translate-y-0"
            >
                <Plus className="w-4 h-4" />
                Initialize Feed
            </button>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
            { label: 'Active Streams', value: `${cameras.filter(c => c.is_active !== false).length}/${cameras.length}`, icon: Video, color: 'text-accent' },
            { label: 'Deployed Zones', value: areas.length, icon: Layers, color: 'text-emerald-500' },
            { label: 'AI Inference Load', value: health?.metrics?.cpu_load || '0%', icon: Cpu, color: 'text-amber-500' },
        ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 sm:p-6 flex items-center gap-4 sm:gap-6 shadow-sm min-w-0">
                <div className={`p-3 sm:p-4 bg-surface border border-border rounded-lg ${stat.color} shrink-0`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-gray mb-1 truncate">{stat.label}</p>
                    <p className={`text-xl sm:text-2xl font-black italic ${stat.color} truncate`}>{stat.value}</p>
                </div>
            </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
         <div className="px-4 sm:px-8 py-5 sm:py-7 border-b border-border bg-surface/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-text-dark">
               <Cctv className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
               Hardware Registry Ledger
            </h2>
            <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-gray" />
                <input 
                    type="text" 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter nodes..." 
                    className="bg-surface border border-border rounded-lg py-2 pl-9 pr-4 text-[10px] font-black uppercase tracking-widest text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all w-full"
                />
            </div>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="border-b border-border bg-surface/30">
                        <th className="py-5 px-6 sm:px-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Node ID</th>
                        <th className="py-5 px-6 sm:px-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Feed Designation</th>
                        <th className="py-5 px-6 sm:px-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Assigned Zone</th>
                        <th className="py-5 px-6 sm:px-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Stream Source</th>
                        <th className="py-5 px-6 sm:px-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Status</th>
                        <th className="py-5 px-6 sm:px-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-text-gray text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {filteredCameras.map((cam) => {
                        const area = areas.find(a => a.id === cam.area_id);
                        return (
                            <tr key={cam.id} className="hover:bg-surface/30 transition-all group/row font-sans">
                                <td className="py-6 px-8 text-[10px] font-bold text-text-gray italic">#{cam.id.toString().padStart(3, '0')}</td>
                                <td className="py-6 px-8">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${cam.is_active !== false ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-surface border-border text-text-gray'}`}>
                                            <Video className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-black text-text-dark">{cam.name}</span>
                                    </div>
                                </td>
                                <td className="py-6 px-8">
                                    <span className="px-3 py-1 rounded-full bg-surface border border-border text-[10px] font-black uppercase tracking-widest text-text-gray">
                                        {area ? area.name : `Area-${cam.area_id}`}
                                    </span>
                                </td>
                                <td className="py-6 px-8 text-[10px] font-mono text-text-gray truncate max-w-[200px]" title={cam.source_url}>
                                    {cam.source_url}
                                </td>
                                <td className="py-6 px-8">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${cam.is_active !== false ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-danger animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${cam.is_active !== false ? 'text-success' : 'text-danger'}`}>
                                            {cam.is_active !== false ? 'Online' : 'Disabled'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-6 px-8 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openScenarioModal(cam)} className="p-2 border border-border text-accent rounded-lg hover:bg-accent hover:text-white transition-all bg-card" title="AI Model Configuration">
                                            <BrainCircuit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openEditModal(cam)} className="p-2 border border-border text-text-gray rounded-lg hover:text-accent hover:border-accent transition-all bg-card" title="Configure Stream">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openDeleteModal(cam)} className="p-2 border border-border text-text-gray rounded-lg hover:text-danger hover:border-danger transition-all bg-card" title="Decommission Node">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                </td>
                            </tr>
                        );
                    })}
                    {filteredCameras.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-8 px-8 text-center text-[10px] font-black uppercase tracking-widest text-text-gray">
                                No hardware nodes found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="px-4 sm:px-8 py-4 bg-surface/30 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-gray text-center md:text-left">
              Showing <span className="text-text-dark">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> to <span className="text-text-dark">{Math.min(totalItems, currentPage * pageSize)}</span> of <span className="text-text-dark">{totalItems}</span> hardware nodes
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-lg border border-border bg-card text-text-gray hover:text-accent hover:border-accent disabled:opacity-30 disabled:hover:text-text-gray disabled:hover:border-border transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(totalItems / pageSize) }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === Math.ceil(totalItems / pageSize) || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && p - arr[i-1] > 1 && <span className="text-text-gray px-1 text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 rounded-lg text-[9px] sm:text-[10px] font-black transition-all border ${currentPage === p 
                          ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                          : 'bg-card text-text-gray border-border hover:border-accent/50 hover:text-accent'}`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button 
                disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg border border-border bg-card text-text-gray hover:text-accent hover:border-accent disabled:opacity-30 disabled:hover:text-text-gray disabled:hover:border-border transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      {/* Add / Edit Camera Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-lg border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-text-dark flex items-center gap-2">
                {showEditModal ? <Edit2 className="w-4 h-4 text-accent" /> : <Plus className="w-4 h-4 text-accent" />}
                {showEditModal ? 'Reconfigure Feed' : 'Initialize Feed'}
              </h2>
              <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-text-gray hover:text-text-dark p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={showEditModal ? handleEditCamera : handleCreateCamera} className="p-6 space-y-4">

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Camera Designation</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  placeholder="e.g. ICU Corridor North" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Stream Source (RTSP/URL)</label>
                <input type="text" required value={formData.source_url} onChange={e => setFormData({ ...formData, source_url: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  placeholder="rtsp://admin:pass@ip:port/stream" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Assigned Zone</label>
                <select required value={formData.area_id} onChange={e => setFormData({ ...formData, area_id: parseInt(e.target.value) })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all cursor-pointer">
                  <option value="" disabled>Select a Zone</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Node Status</label>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFormData({...formData, is_active: true})}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${formData.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-surface border-border text-text-gray'}`}>
                        Online
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, is_active: false})}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${!formData.is_active ? 'bg-danger/10 text-danger border-danger/20' : 'bg-surface border-border text-text-gray'}`}>
                        Disabled
                    </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCamera && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-lg border border-danger/20 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-danger/20">
                <Trash2 className="w-8 h-8 text-danger" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-text-dark">Decommission Node?</h2>
              <p className="text-xs font-bold text-text-gray">
                Are you sure you want to permanently delete feed <span className="text-danger">{selectedCamera.name}</span>? This will break any existing AI scenarios linked to it.
              </p>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteCamera} disabled={submitting}
                  className="flex-1 py-2.5 bg-danger text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                  {submitting ? 'Decommissioning...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Orchestrator Modal */}
      {showScenarioModal && selectedCamera && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-lg border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
                  <BrainCircuit className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-text-dark">AI Intelligence Config</h2>
                  <p className="text-[9px] font-bold text-text-gray uppercase tracking-widest">Managing models for: <span className="text-accent">{selectedCamera.name}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => setShowScenarioModal(false)} className="text-text-gray hover:text-text-dark p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {loadingScenarios ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-gray">Mapping Neural Paths...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 bg-surface/50 p-2.5 rounded-lg border border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-gray">Scenario Selection Matrix</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => toggleAllScenarios(true)}
                            className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-accent/80 px-2 py-1 rounded hover:bg-accent/5 transition-all"
                        >
                            Select All
                        </button>
                        <div className="w-px h-3 bg-border my-auto"></div>
                        <button 
                            onClick={() => toggleAllScenarios(false)}
                            className="text-[9px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark px-2 py-1 rounded hover:bg-surface transition-all"
                        >
                            Clear All
                        </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {scenarioData.map(scenario => (
                      <div 
                        key={scenario.id} 
                        onClick={() => toggleScenarioInState(scenario.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer group
                          ${scenario.is_enabled ? 'bg-accent/5 border-accent/30 shadow-sm' : 'bg-surface border-border hover:border-accent/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${scenario.is_enabled ? 'bg-accent animate-pulse' : 'bg-border'}`} />
                          <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${scenario.is_enabled ? 'text-accent' : 'text-text-gray group-hover:text-text-dark'}`}>
                            {scenario.name}
                          </span>
                        </div>
                        {scenario.is_enabled && <CheckCircle2 className="w-4 h-4 text-accent" />}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-text-gray">
                      <span className="text-accent">{scenarioData.filter(s => s.is_enabled).length}</span> Models Selected
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowScenarioModal(false)}
                        className="px-6 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
                        Discard
                      </button>
                      <button onClick={handleSaveScenarios} disabled={submitting}
                        className="px-8 py-2.5 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">
                        {submitting ? 'Syncing...' : 'Deploy Models'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

