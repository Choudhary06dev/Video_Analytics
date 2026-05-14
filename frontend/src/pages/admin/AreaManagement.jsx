import React, { useState, useEffect } from 'react';
import {
 fetchAdminAreas,
 createArea,
 updateArea,
 deleteArea
} from '../../services/cameraService';
import {
 Map,
 Plus,
 Search,
 Loader2,
 Edit2,
 Trash2,
 X,
 Layers,
 Building2,
 GitBranch,
 FolderTree,
 MapPin,
 ChevronLeft,
 ChevronRight
} from 'lucide-react';

export default function AreaManagement() {
 const [areas, setAreas] = useState([]);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('');

 // Pagination State
 const [currentPage, setCurrentPage] = useState(1);
 const [pageSize] = useState(10);
 const [totalItems, setTotalItems] = useState(0);

 // Modal States
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [selectedArea, setSelectedArea] = useState(null);

 // Form States
 const [formData, setFormData] = useState({ name: '', description: '', parent_id: null });
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
  fetchData();
 }, [currentPage]);

 const fetchData = async () => {
  try {
   setLoading(true);
   const skip = (currentPage - 1) * pageSize;
   const response = await fetchAdminAreas(skip, pageSize);
   setAreas(response.areas || []);
   setTotalItems(response.total || 0);
  } catch (err) {
   console.error("Failed to fetch areas", err);
  } finally {
   setLoading(false);
  }
 };

 const handleCreateArea = async (e) => {
  e.preventDefault();
  try {
   setSubmitting(true);
   const payload = { ...formData };
   if (!payload.parent_id) payload.parent_id = null;
   else payload.parent_id = parseInt(payload.parent_id);
   await createArea(payload);
   setShowAddModal(false);
   setFormData({ name: '', description: '', parent_id: null });
   fetchData();
  } catch (err) {
   alert(err.message ||"Failed to create area");
  } finally {
   setSubmitting(false);
  }
 };

 const handleEditArea = async (e) => {
  e.preventDefault();
  try {
   setSubmitting(true);
   const payload = { ...formData };
   if (!payload.parent_id) payload.parent_id = null;
   else payload.parent_id = parseInt(payload.parent_id);
   await updateArea(selectedArea.id, payload);
   setShowEditModal(false);
   setSelectedArea(null);
   fetchData();
  } catch (err) {
   alert(err.message ||"Failed to update area");
  } finally {
   setSubmitting(false);
  }
 };

 const handleDeleteArea = async () => {
  try {
   setSubmitting(true);
   await deleteArea(selectedArea.id);
   setShowDeleteModal(false);
   setSelectedArea(null);
   fetchData();
  } catch (err) {
   alert(err.message ||"Failed to delete area. It may have sub-areas or cameras assigned.");
  } finally {
   setSubmitting(false);
  }
 };

 const openEditModal = (area) => {
  setSelectedArea(area);
  setFormData({
   name: area.name,
   description: area.description || '',
   parent_id: area.parent_id || ''
  });
  setShowEditModal(true);
 };

 const openDeleteModal = (area) => {
  setSelectedArea(area);
  setShowDeleteModal(true);
 };

 const getParentName = (parentId) => {
  if (!parentId) return '—';
  const parent = areas.find(a => a.id === parentId);
  return parent ? parent.name :`#${parentId}`;
 };

 const rootAreas = areas.filter(a => !a.parent_id);
 const childAreas = areas.filter(a => a.parent_id);

 const filteredAreas = areas.filter(a =>
  a.name.toLowerCase().includes(filter.toLowerCase()) ||
  (a.description || '').toLowerCase().includes(filter.toLowerCase())
 );

 if (loading) {
  return (
   <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-accent animate-spin"/>
    <p className="text-[10px] font-black uppercase tracking-widest text-text-gray">Mapping Zone Topology...</p>
   </div>
  );
 }

 return (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">

   {/* Header Section */}
   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
    <div className="flex items-center gap-4">
     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 shrink-0">
      <Map className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500"/>
     </div>
     <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-text-dark truncate">
       Zone <span className="text-emerald-500 underline decoration-emerald-500/20 underline-offset-4">Topology</span>
      </h1>
      <p className="text-[8px] sm:text-[9px] font-bold text-text-gray uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 sm:mt-1.5 flex items-center gap-2 truncate">
       Spatial Registry // Area Mapping Protocol
      </p>
     </div>
    </div>

    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
     <div className="relative group flex-1 sm:flex-none">
      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray group-focus-within:text-emerald-500 transition-colors"/>
      <input
       type="text"
       placeholder="Search zones..."
       className="w-full sm:w-64 bg-card border border-border rounded-lg pl-10 pr-4 py-2 sm:py-2.5 text-xs font-bold text-text-dark outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
       value={filter}
       onChange={(e) => setFilter(e.target.value)}
      />
     </div>
     <button
      onClick={() => { setFormData({ name: '', description: '', parent_id: '' }); setShowAddModal(true); }}
      className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0"
     >
      <Plus className="w-4 h-4"/>
      New Zone
     </button>
    </div>
   </div>

   {/* Stats Summary */}
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {[
     { label: 'Total Zones', val: areas.length, icon: Layers, color: 'text-emerald-500' },
     { label: 'Root Zones', val: rootAreas.length, icon: Building2, color: 'text-accent' },
     { label: 'Sub Zones', val: childAreas.length, icon: GitBranch, color: 'text-purple-500' },
     { label: 'Zone Depth', val: childAreas.length > 0 ? '2+' : '1', icon: FolderTree, color: 'text-amber-500' },
    ].map((s, i) => (
     <div key={i} className="bg-card border border-border p-2.5 sm:p-3 rounded-lg flex items-center justify-between shadow-sm min-w-0">
      <div className="min-w-0">
       <p className="text-[7px] font-black text-text-gray uppercase tracking-widest mb-0.5 truncate">{s.label}</p>
       <p className={`text-base sm:text-lg font-black ${s.color} truncate`}>{s.val}</p>
      </div>
      <div className="p-1.5 sm:p-2 rounded flex items-center justify-center bg-surface border border-border shrink-0">
       <s.icon className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${s.color}`} />
      </div>
     </div>
    ))}
   </div>

   {/* Areas Data Table */}
   <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
    <div className="overflow-x-auto no-scrollbar">
     <table className="w-full text-left border-collapse min-w-[800px]">
      <thead>
       <tr className="bg-surface/50 border-b border-border text-[8px] font-black uppercase tracking-widest text-text-gray">
        <th className="p-2.5 pl-6">Zone ID</th>
        <th className="p-2.5">Zone Name</th>
        <th className="p-2.5">Description</th>
        <th className="p-2.5">Parent Zone</th>
        <th className="p-2.5 pr-6 text-right">Actions</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-border">
       {filteredAreas.map((area) => (
        <tr key={area.id} className="hover:bg-surface/30 transition-colors group">
         <td className="p-2.5 pl-6">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-gray bg-surface px-1.5 py-0.5 rounded border border-border w-fit">
           <MapPin className="w-2.5 h-2.5"/>
           #{area.id}
          </div>
         </td>
         <td className="p-2.5">
          <div className="flex items-center gap-2.5">
           <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${area.parent_id ? 'border-purple-500/10 bg-purple-500/5' : 'border-emerald-500/10 bg-emerald-500/5'}`}>
            {area.parent_id ? <GitBranch className="w-4 h-4 text-purple-500"/> : <Building2 className="w-4 h-4 text-emerald-500"/>}
           </div>
           <div>
            <p className="text-[11px] font-black text-text-dark uppercase tracking-tight leading-none">{area.name}</p>
            <p className="text-[9px] text-text-gray font-bold mt-1">{area.parent_id ? 'Sub-Zone' : 'Root Zone'}</p>
           </div>
          </div>
         </td>
         <td className="p-2.5">
          <p className="text-[10px] font-bold text-text-gray max-w-[200px] truncate">{area.description || '—'}</p>
         </td>
         <td className="p-2.5">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${area.parent_id ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-surface text-text-gray border-border'}`}>
           {getParentName(area.parent_id)}
          </span>
         </td>
         <td className="p-2.5 pr-6">
          <div className="flex items-center justify-end gap-1.5">
           <button onClick={() => openEditModal(area)} className="p-1.5 border border-border text-text-gray rounded hover:text-emerald-500 hover:border-emerald-500 transition-all bg-card" title="Edit Zone">
            <Edit2 className="w-3 h-3"/>
           </button>
           <button onClick={() => openDeleteModal(area)} className="p-1.5 border border-border text-text-gray rounded hover:text-danger hover:border-danger transition-all bg-card" title="Delete Zone">
            <Trash2 className="w-3 h-3"/>
           </button>
          </div>
         </td>
        </tr>
       ))}
       {filteredAreas.length === 0 && (
        <tr>
         <td colSpan={5} className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-text-gray">
          No zones found matching the criteria
         </td>
        </tr>
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination Bar */}
    <div className="px-4 sm:px-6 py-4 bg-surface/30 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
     <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-gray text-center md:text-left">
      Showing <span className="text-text-dark">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> to <span className="text-text-dark">{Math.min(totalItems, currentPage * pageSize)}</span> of <span className="text-text-dark">{totalItems}</span> zone records
     </div>
     
     <div className="flex items-center gap-2">
      <button 
       disabled={currentPage === 1}
       onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
       className="p-2 rounded-lg border border-border bg-card text-text-gray hover:text-emerald-500 hover:border-emerald-500 disabled:opacity-30 disabled:hover:text-text-gray disabled:hover:border-border transition-all"
      >
       <ChevronLeft className="w-3.5 h-3.5"/>
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
            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
            : 'bg-card text-text-gray border-border hover:border-emerald-500/50 hover:text-emerald-500'}`}
          >
           {p}
          </button>
         </React.Fragment>
        ))}
      </div>

      <button 
       disabled={currentPage >= Math.ceil(totalItems / pageSize)}
       onClick={() => setCurrentPage(prev => prev + 1)}
       className="p-2 rounded-lg border border-border bg-card text-text-gray hover:text-emerald-500 hover:border-emerald-500 disabled:opacity-30 disabled:hover:text-text-gray disabled:hover:border-border transition-all"
      >
       <ChevronRight className="w-3.5 h-3.5"/>
      </button>
     </div>
    </div>
   </div>

   {/* Add / Edit Area Modal */}
   {(showAddModal || showEditModal) && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
     <div className="bg-card w-full max-w-md rounded-lg border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
       <h2 className="text-sm font-black uppercase tracking-widest text-text-dark flex items-center gap-2">
        {showEditModal ? <Edit2 className="w-4 h-4 text-emerald-500"/> : <Plus className="w-4 h-4 text-emerald-500"/>}
        {showEditModal ? 'Reconfigure Zone' : 'Initialize New Zone'}
       </h2>
       <button type="button"onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-text-gray hover:text-text-dark p-1">
        <X className="w-5 h-5"/>
       </button>
      </div>
      <form onSubmit={showEditModal ? handleEditArea : handleCreateArea} className="p-6 space-y-4">

       <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Zone Name</label>
        <input type="text"required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
         className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
         placeholder="e.g. ICU Block A, Floor 3"/>
       </div>

       <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Description</label>
        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
         className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none h-20"
         placeholder="Brief description of this zone..."/>
       </div>

       <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Parent Zone (Optional)</label>
        <select value={formData.parent_id || ''} onChange={e => setFormData({ ...formData, parent_id: e.target.value || null })}
         className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all cursor-pointer">
         <option value="">None (Root Zone)</option>
         {areas.filter(a => !showEditModal || a.id !== selectedArea?.id).map(a => (
          <option key={a.id} value={a.id}>{a.name}</option>
         ))}
        </select>
       </div>

       <div className="pt-4 flex gap-3">
        <button type="button"onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
         className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
         Cancel
        </button>
        <button type="submit"disabled={submitting}
         className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
         {submitting ? 'Processing...' : 'Confirm'}
        </button>
       </div>
      </form>
     </div>
    </div>
   )}

   {/* Delete Confirmation Modal */}
   {showDeleteModal && selectedArea && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
     <div className="bg-card w-full max-w-sm rounded-lg border border-danger/20 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="p-6 text-center space-y-4">
       <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-danger/20">
        <Trash2 className="w-8 h-8 text-danger"/>
       </div>
       <h2 className="text-lg font-black uppercase tracking-widest text-text-dark">Delete Zone?</h2>
       <p className="text-xs font-bold text-text-gray">
        Are you sure you want to permanently delete <span className="text-danger">{selectedArea.name}</span>? Areas with sub-zones or cameras cannot be deleted.
       </p>
       <div className="pt-4 flex gap-3">
        <button onClick={() => setShowDeleteModal(false)}
         className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
         Cancel
        </button>
        <button onClick={handleDeleteArea} disabled={submitting}
         className="flex-1 py-2.5 bg-danger text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
         {submitting ? 'Deleting...' : 'Confirm Delete'}
        </button>
       </div>
      </div>
     </div>
    </div>
   )}

  </div>
 );
}
