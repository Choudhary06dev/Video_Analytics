import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Eye, 
  Settings, 
  Activity, 
  Lock, 
  Unlock, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function RolePermissionsPanel({ roleId, initialPermissions, onUpdated }) {
  const { token } = useAuth();
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState(initialPermissions || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    setPermissions(initialPermissions || []);
  }, [initialPermissions]);

  const fetchModules = async () => {
    try {
      const res = await axios.get(`${BASE}/admin/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModules(res.data);
    } catch (err) {
      console.error("Failed to fetch modules", err);
    }
  };

  const findPermission = (moduleId) => {
    return permissions.find(p => p.module_id === moduleId) || { can_view: false, can_edit: false };
  };

  const togglePermission = (moduleId, field) => {
    setPermissions(prev => {
      const existingIdx = prev.findIndex(p => p.module_id === moduleId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], [field]: !updated[existingIdx][field] };
        return updated;
      } else {
        return [...prev, { role_id: roleId, module_id: moduleId, can_view: field === 'can_view', can_edit: field === 'can_edit' }];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(`${BASE}/admin/roles/${roleId}/permissions`, 
        { permissions: permissions.map(p => ({ module_id: p.module_id, can_view: p.can_view, can_edit: p.can_edit })) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: "Access protocols updated successfully." });
      onUpdated?.();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: "Critical failure during protocol sync." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top-2 duration-300
            ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      <div className="grid gap-3">
        {modules.map((mod) => {
          const perm = findPermission(mod.id);
          return (
            <div key={mod.id} className="bg-surface/50 border border-border rounded-xl p-4 flex items-center justify-between group hover:border-accent/30 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border shadow-sm">
                        <Activity className="w-5 h-5 text-text-gray group-hover:text-accent transition-colors" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dark">{mod.name.replace('_', ' ')}</h4>
                        <p className="text-[9px] font-bold text-text-gray uppercase tracking-tight mt-0.5">Control Group: {mod.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-gray mr-2">Visible</span>
                        <button 
                            onClick={() => togglePermission(mod.id, 'can_view')}
                            className={`w-10 h-5 rounded-full relative transition-all ${perm.can_view ? 'bg-accent' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${perm.can_view ? 'right-0.5' : 'left-0.5'}`}></div>
                        </button>
                    </div>

                    <div className="w-[1px] h-6 bg-border mx-2"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-gray mr-2">Editable</span>
                        <button 
                            onClick={() => togglePermission(mod.id, 'can_edit')}
                            className={`w-10 h-5 rounded-full relative transition-all ${perm.can_edit ? 'bg-success' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${perm.can_edit ? 'right-0.5' : 'left-0.5'}`}></div>
                        </button>
                    </div>
                </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-border flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-accent text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {saving ? 'Syncing...' : 'Commit Protocol Changes'}
        </button>
      </div>
    </div>
  );
}
