import React, { useState, useEffect } from 'react';
import { 
  UserX, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Activity, 
  ShieldAlert, 
  Calendar, 
  Image as ImageIcon,
  MoreVertical,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Upload,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import blacklistService from '../../services/blacklistService';

// Action colors for severity
const severityColors = {
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
  HIGH: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  LOW: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
};

export default function BlacklistManagement() {
  const { user: currentUser } = useAuth();
  const [blacklist, setBlacklist] = useState([]);
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
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Form States
  const [formData, setFormData] = useState({ 
    full_name: '', 
    reason: '', 
    severity: 'HIGH', 
    image_file: null,
    image_preview: '',
    image_fit: 'cover', // 'cover' or 'contain'
    notes: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await blacklistService.getAll();
      setBlacklist(data);
      setTotalItems(data.length);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch blacklist data", err);
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          image_file: file, 
          image_preview: reader.result 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newEntry = await blacklistService.create(formData);
      setBlacklist([newEntry, ...blacklist]);
      setTotalItems(totalItems + 1);
      setShowAddModal(false);
      setFormData({ full_name: '', reason: '', severity: 'HIGH', image_file: null, image_preview: '', image_fit: 'cover', notes: '' });
    } catch (err) {
      alert("Failed to register identity");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEntry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await blacklistService.update(selectedPerson.id, formData);
      setBlacklist(blacklist.map(p => p.id === selectedPerson.id ? updated : p));
      setShowEditModal(false);
      setSelectedPerson(null);
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async () => {
    setSubmitting(true);
    try {
      await blacklistService.delete(selectedPerson.id);
      setBlacklist(blacklist.filter(p => p.id !== selectedPerson.id));
      setTotalItems(totalItems - 1);
      setShowDeleteModal(false);
      setSelectedPerson(null);
    } catch (err) {
      alert("Failed to remove identity");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (person) => {
    setSelectedPerson(person);
    setFormData({
      full_name: person.full_name,
      reason: person.reason,
      severity: person.severity,
      image_file: null,
      image_preview: person.image_preview,
      notes: person.notes || ''
    });
    setShowEditModal(true);
  };

  const filteredBlacklist = blacklist.filter(p => 
    p.full_name.toLowerCase().includes(filter.toLowerCase()) || 
    p.reason.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-gray">Syncing Neural Blacklist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                <UserX className="w-7 h-7 text-red-500" />
            </div>
            <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark">
                    Blacklist <span className="text-red-500 underline decoration-red-500/20 underline-offset-4">Intelligence</span>
                </h1>
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                    Biometric Threat Registry // Neural Alert Protocol
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray group-focus-within:text-red-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search by name or reason..."
                    className="bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all w-64"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <button
                onClick={() => { setFormData({ full_name: '', reason: '', severity: 'HIGH', image_file: null, image_preview: '', notes: '' }); setShowAddModal(true); }}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
                <Plus className="w-4 h-4" />
                Add To Blacklist
            </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
            { label: 'Total Tracked', val: totalItems, icon: UserX, color: 'text-red-500' },
            { label: 'Critical Threats', val: blacklist.filter(p => p.severity === 'CRITICAL').length, icon: ShieldAlert, color: 'text-red-600' },
            { label: 'High Priority', val: blacklist.filter(p => p.severity === 'HIGH').length, icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'Recently Spotted', val: 0, icon: Camera, color: 'text-blue-500' },
        ].map((s, i) => (
            <div key={i} className="bg-card border border-border p-4 rounded-lg flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-[8px] font-black text-text-gray uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-xl font-black italic ${s.color}`}>{s.val}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-surface border border-border">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
            </div>
        ))}
      </div>

      {/* Blacklist Data Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 border-b border-border text-[9px] font-black uppercase tracking-widest text-text-gray">
                <th className="p-4 pl-6 text-center">Neural ID</th>
                <th className="p-4">Identity & Biometrics</th>
                <th className="p-4">Primary Reason</th>
                <th className="p-4">Threat Level</th>
                <th className="p-4">Registration</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBlacklist.map((person, index) => (
                <tr key={person.id} className="hover:bg-surface/30 transition-colors group">
                  <td className="p-4 pl-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-text-gray bg-surface px-2 py-1 rounded-lg border border-border w-12 h-8 mx-auto">
                        #{(index + 1).toString().padStart(3, '0')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg flex items-center justify-center border-2 border-red-500/10 bg-red-500/5 overflow-hidden">
                        {person.image_preview ? (
                          <img src={person.image_preview} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-text-gray/40" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-text-dark uppercase tracking-wide">{person.full_name}</p>
                        <p className="text-[10px] text-text-gray font-bold mt-0.5 uppercase tracking-tighter">Biometric Match Ready</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-[11px] font-bold text-text-dark max-w-[200px] truncate">{person.reason}</p>
                  </td>
                  <td className="p-4">
                    <div className={`w-24 text-center px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${severityColors[person.severity] || severityColors.MEDIUM}`}>
                      {person.severity}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-gray">
                        <Calendar className="w-3 h-3" />
                        {person.created_at ? new Date(person.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(person)} className="p-2 border border-border text-text-gray rounded-lg hover:text-red-500 hover:border-red-500 transition-all bg-card" title="Edit Profile">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setSelectedPerson(person); setShowDeleteModal(true); }} className="p-2 border border-border text-text-gray rounded-lg hover:text-red-600 hover:border-red-600 transition-all bg-card" title="Remove from Blacklist">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBlacklist.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-text-gray">
                        No blacklisted identities found matching the criteria
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-surface/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-text-gray">
            Showing <span className="text-text-dark">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> to <span className="text-text-dark">{Math.min(totalItems, currentPage * pageSize)}</span> of <span className="text-text-dark">{totalItems}</span> identities
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 rounded-lg border border-border bg-card text-text-gray hover:text-red-500 hover:border-red-500 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={currentPage >= Math.ceil(totalItems / pageSize) || totalItems === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-lg border border-border bg-card text-text-gray hover:text-red-500 hover:border-red-500 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Blacklist Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`bg-card w-full ${showEditModal ? 'max-w-2xl' : 'max-w-md'} rounded-lg border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200`}>
                <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
                    <h2 className="text-sm font-black uppercase tracking-widest text-text-dark flex items-center gap-2">
                        {showEditModal ? <Edit2 className="w-4 h-4 text-red-500" /> : <UserX className="w-4 h-4 text-red-500" />}
                        {showEditModal ? 'Update Threat Profile' : 'Register New Threat'}
                    </h2>
                    <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-text-gray hover:text-text-dark p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={showEditModal ? handleEditEntry : handleCreateEntry} className="p-6 space-y-5">
                    
                    {/* Conditional Layout: Grid for Edit, Stack for Add */}
                    <div className={showEditModal ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "space-y-4"}>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Full Name / Alias</label>
                            <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                                placeholder="e.g. Unknown Subject" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Threat Level (Severity)</label>
                            <select required value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}
                                    className="w-full bg-surface border border-border rounded-lg pl-4 pr-16 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all cursor-pointer">
                                <option value="CRITICAL">CRITICAL</option>
                                <option value="HIGH">HIGH</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="LOW">LOW</option>
                            </select>
                        </div>
                    </div>

                    <div className={showEditModal ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "space-y-4"}>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Primary Reason for Listing</label>
                            <textarea required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}
                                    className={`w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all resize-none ${showEditModal ? 'h-[124px]' : 'h-20'}`}
                                    placeholder="Describe the incident or reason..." />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray">Biometric Evidence (Image)</label>
                                {formData.image_preview && (
                                    <div className="flex bg-surface border border-border rounded-lg p-0.5">
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, image_fit: 'cover'})}
                                            className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${formData.image_fit === 'cover' ? 'bg-accent text-white' : 'text-text-gray hover:text-text-dark'}`}
                                        >
                                            Fill
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, image_fit: 'contain'})}
                                            className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${formData.image_fit === 'contain' ? 'bg-accent text-white' : 'text-text-gray hover:text-text-dark'}`}
                                        >
                                            Fit
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className={`flex flex-col items-center gap-4 p-4 border-2 border-dashed border-border rounded-xl bg-surface/50 hover:bg-surface hover:border-red-500/30 transition-all group relative cursor-pointer overflow-hidden justify-center ${showEditModal ? 'h-[124px]' : 'h-32'}`}>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleImageChange}
                                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                {formData.image_preview ? (
                                    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-black/20">
                                        <img 
                                            src={formData.image_preview} 
                                            className={`w-full h-full transition-all duration-300 ${formData.image_fit === 'cover' ? 'object-cover' : 'object-contain'}`} 
                                            alt="Preview" 
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="w-5 h-5 text-red-500 mb-2" />
                                        <p className="text-[9px] font-black text-text-gray uppercase tracking-widest text-center">Click to Upload</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                                className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">
                            {submitting ? 'Processing...' : (showEditModal ? 'Update Registry' : 'Sync Registry')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-sm rounded-lg border border-red-500/20 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                        <UserCheck className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-text-dark">Remove from Blacklist?</h2>
                    <p className="text-xs font-bold text-text-gray">
                        Are you sure you want to remove <span className="text-red-500">{selectedPerson.full_name}</span> from the neural blacklist? This person will no longer trigger alerts.
                    </p>
                    <div className="pt-4 flex gap-3">
                        <button onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
                            Cancel
                        </button>
                        <button onClick={handleDeleteEntry} disabled={submitting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">
                            {submitting ? 'Updating...' : 'Confirm Removal'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
