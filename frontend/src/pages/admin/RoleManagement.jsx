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
  Loader2
} from 'lucide-react';
import RolePermissionsPanel from '../../components/admin/RolePermissionsPanel';

export default function RoleManagement() {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error("Failed to fetch roles", err);
    } finally {
      setLoading(false);
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
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-text-gray hover:bg-surface hover:text-text-dark transition-all">
                <Plus className="w-4 h-4" />
                Define Role
            </button>
            <button 
                onClick={fetchRoles}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all"
            >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload
            </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Roles Navigator (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-text-gray mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Available Profiles
                </h3>
                
                <div className="space-y-2">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group
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
                            <ChevronRight className={`w-4 h-4 transition-transform ${selectedRole?.id === role.id ? 'translate-x-1 text-accent' : 'opacity-0 group-hover:opacity-100'}`} />
                        </button>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-accent/5 rounded-xl border border-accent/10">
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
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="p-6 border-b border-border bg-surface/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 dark:bg-card rounded-xl flex items-center justify-center border border-border">
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
                <div className="h-full bg-card border border-border border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                    <ShieldAlert className="w-12 h-12 text-text-gray/20 mb-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-gray mb-2">Select a profile to reconfigure</h3>
                    <p className="text-[10px] font-bold text-text-gray/60 uppercase">Role-based access requires active session selection</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
