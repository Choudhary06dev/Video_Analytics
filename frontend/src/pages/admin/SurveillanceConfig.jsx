import React, { useState, useEffect } from 'react';
import { 
  fetchAdminCameras, 
  fetchAdminAreas, 
  createCamera, 
  updateCamera, 
  deleteCamera 
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
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SurveillanceConfig() {
  const [cameras, setCameras] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Form States
  const [formData, setFormData] = useState({ name: '', source_url: '', area_id: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [camData, areaData] = await Promise.all([
        fetchAdminCameras(),
        fetchAdminAreas()
      ]);
      setCameras(camData || []);
      setAreas(areaData || []);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
            <Video className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark font-sans">
              Surveillance <span className="text-accent underline decoration-accent/20 underline-offset-4">Registry</span>
            </h1>
            <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
              Hardware Abstraction & Zone Mapping
            </p>
          </div>
        </div>

        <div className="flex gap-4">
            <button 
                onClick={() => navigate('/admin/areas')}
                className="flex items-center gap-3 bg-surface border border-border text-text-gray px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all hover:bg-border hover:text-text-dark"
            >
                <Map className="w-4 h-4" />
                Edit Mapping
            </button>
            <button 
                onClick={() => {
                  setFormData({ name: '', source_url: '', area_id: areas.length > 0 ? areas[0].id : '', is_active: true });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-3 bg-accent text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all shadow-md shadow-accent/20 hover:-translate-y-1 active:translate-y-0"
            >
                <Plus className="w-4 h-4" />
                Initialize Feed
            </button>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
            { label: 'Active Streams', value: `${cameras.filter(c => c.is_active !== false).length}/${cameras.length}`, icon: Video, color: 'text-accent' },
            { label: 'Deployed Zones', value: areas.length, icon: Layers, color: 'text-emerald-500' },
            { label: 'AI Inference Load', value: '42%', icon: Cpu, color: 'text-amber-500' },
        ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 flex items-center gap-6 shadow-sm">
                <div className={`p-4 bg-surface border border-border rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-gray mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black italic ${stat.color}`}>{stat.value}</p>
                </div>
            </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
         <div className="px-8 py-7 border-b border-border bg-surface/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-text-dark">
               <Cctv className="w-5 h-5 text-accent" />
               Hardware Registry Ledger
            </h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-gray" />
                <input 
                    type="text" 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter nodes..." 
                    className="bg-surface border border-border rounded-lg py-2 pl-9 pr-4 text-[10px] font-black uppercase tracking-widest text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all w-full md:w-64"
                />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                    <tr className="border-b border-border bg-surface/30">
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Node ID</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Feed Designation</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Assigned Zone</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Stream Source</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Status</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray text-right">Actions</th>
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

         <div className="p-8 border-t border-border bg-surface/30 flex justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-text-gray/50">End of Hardware Registry Ledger</p>
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

    </div>
  );
}
