import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  ChevronRight, 
  Lock, 
  Settings, 
  Activity,
  Plus,
  RefreshCw,
  Loader2,
  Edit2,
  X
} from 'lucide-react';
import RolePermissionsPanel from '../../components/admin/RolePermissionsPanel';

export default function RoleManagement() {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE}/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(res.data);
      if (res.data.length > 0 && !selectedRole) {
        setSelectedRole(res.data[0]);
      }
      if (selectedRole) {
        const updatedSelectedRole = res.data.find(r => r.id === selectedRole.id);
        if (updatedSelectedRole) {
          setSelectedRole(updatedSelectedRole);
        }
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleFormData({ name: '', description: '' });
    setShowRoleModal(true);
  };

  const openEditRoleModal = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name || '',
      description: role.description || ''
    });
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingRole) {
        await axios.put(`${BASE}/admin/roles/${editingRole.id}`, roleFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE}/admin/roles`, roleFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowRoleModal(false);
      setEditingRole(null);
      setRoleFormData({ name: '', description: '' });
      await fetchRoles();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save role");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-gray">Accessing Role Hierarchy...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-20">
      
      {/* Header (Scaled Down) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
                <ShieldCheck className="w-7 h-7 text-accent" />
            </div>
            <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark">
                    Access <span className="text-accent underline decoration-accent/20 underline-offset-4">Authority</span>
                </h1>
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                    Permission Control // Role Synchronization Matrix
                </p>
            </div>
        </div>

        <div className="flex gap-2">
            <button
                onClick={openCreateRoleModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-text-gray hover:bg-surface hover:text-text-dark transition-all"
            >
                <Plus className="w-4 h-4" />
                Define Role
            </button>
            <button 
                onClick={fetchRoles}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all"
            >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload
            </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Roles Navigator (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-text-gray mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Available Profiles
                </h3>
                
                <div className="space-y-2">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between group
                                ${selectedRole?.id === role.id 
                                    ? 'bg-accent/10 border-accent/20 border-l-4 border-l-accent' 
                                    : 'border-transparent bg-surface hover:bg-white/50 dark:hover:bg-card-hover text-text-gray hover:text-text-dark'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg border transition-all
                                    ${selectedRole?.id === role.id ? 'bg-accent text-white border-accent' : 'bg-card border-border'}`}>
                                    <Lock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className={`text-[11px] font-black uppercase tracking-tight ${selectedRole?.id === role.id ? 'text-accent' : 'text-text-dark'}`}>{role.name.replace('_', ' ')}</p>
                                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Role ID: #{role.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openEditRoleModal(role); }}
                                    className="p-1.5 rounded-md border border-border text-text-gray hover:text-accent hover:border-accent transition-all"
                                    title="Edit role"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedRole?.id === role.id ? 'translate-x-1 text-accent' : 'opacity-0 group-hover:opacity-100'}`} />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-accent/5 rounded-lg border border-accent/10">
                    <div className="flex items-center gap-3 mb-2">
                        <Info className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-dark">Inheritance logic</span>
                    </div>
                    <p className="text-[9px] font-bold text-text-gray leading-relaxed">
                        Permissions are applied instantly and propagate through all active network nodes associated with the profile.
                    </p>
                </div>
            </div>
        </div>

        {/* Permissions Panel (Right Column) */}
        <div className="lg:col-span-8">
            {selectedRole ? (
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="p-6 border-b border-border bg-surface/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 dark:bg-card rounded-lg flex items-center justify-center border border-border">
                                <Settings className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2rem] text-text-dark">Modify: <span className="text-accent italic">{selectedRole.name.replace('_', ' ')}</span></h3>
                                <p className="text-[9px] font-bold text-text-gray uppercase tracking-widest mt-1">Granular Control Matrix</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 border border-success/20 rounded-lg">
                                <Activity className="w-3 h-3 text-success" />
                                <span className="text-[9px] font-black text-success uppercase">Node Link Active</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <RolePermissionsPanel 
                            roleId={selectedRole.id} 
                            initialPermissions={selectedRole.permissions}
                            onUpdated={fetchRoles}
                        />
                    </div>
                </div>
            ) : (
                <div className="h-full bg-card border border-border border-dashed rounded-lg flex flex-col items-center justify-center p-12 text-center">
                    <ShieldAlert className="w-12 h-12 text-text-gray/20 mb-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-gray mb-2">Select a profile to reconfigure</h3>
                    <p className="text-[10px] font-bold text-text-gray/60 uppercase">Role-based access requires active session selection</p>
                </div>
            )}
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-lg border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-text-dark flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                {editingRole ? 'Edit Access Role' : 'Create Access Role'}
              </h2>
              <button
                type="button"
                onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
                className="text-text-gray hover:text-text-dark p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={roleFormData.name}
                  onChange={e => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  placeholder="e.g. shift_supervisor"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Description</label>
                <textarea
                  rows={3}
                  value={roleFormData.description}
                  onChange={e => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all resize-none"
                  placeholder="Define this role's access purpose"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
                  className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {submitting ? 'Processing...' : (editingRole ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
