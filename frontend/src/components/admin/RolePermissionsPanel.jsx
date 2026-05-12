import React, { useState, useEffect } from 'react';
import { fetchModules as apiFetchModules, updateRolePermissions } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Activity,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layout,
  Cpu
} from 'lucide-react';

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  live_monitoring: 'Neural Stream',
  scenarios: 'AI Scenarios',

  vault: 'Activity Vault',
  health: 'System Health',
  training: 'AI Training',
  alerts: 'Crisis Alerts',
  admin_hub: 'Admin Control',
  admin_dashboard: 'Dashboard',
  users: 'Users',
  roles: 'Roles',
  cameras: 'Cameras',
  areas: 'Areas',
  intelligence_registry: 'AI Scenarios',
  scenario_orchestration: 'Scenario Control',
  audit: 'Audit Protocols',
  settings: 'Settings'
};

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
      const data = await apiFetchModules();
      setModules(data);
    } catch (err) {
      console.error("Failed to fetch modules", err);
    }
  };

  const findPermission = (moduleId) => {
    return permissions.find(p => p.module_id === moduleId) || { can_view: false, can_edit: false, can_delete: false };
  };

  const hasModuleAccess = (perm) => !!(perm.can_view || perm.can_edit || perm.can_delete);

  const toggleModuleAccess = (moduleId) => {
    setPermissions(prev => {
      const existingIdx = prev.findIndex(p => p.module_id === moduleId);
      if (existingIdx > -1) {
        const enabled = !hasModuleAccess(prev[existingIdx]);
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          can_view: enabled,
          can_edit: enabled,
          can_delete: enabled
        };
        return updated;
      } else {
        return [...prev, { role_id: roleId, module_id: moduleId, can_view: true, can_edit: true, can_delete: true }];
      }
    });
  };

  const setAllPermissions = (enabled) => {
    setPermissions(
      modules.map((mod) => ({
        role_id: roleId,
        module_id: mod.id,
        can_view: enabled,
        can_edit: enabled,
        can_delete: enabled
      }))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = modules.map((mod) => {
        const perm = findPermission(mod.id);
        const enabled = hasModuleAccess(perm);
        return {
          module_key: mod.key,
          can_view: enabled,
          can_edit: enabled,
          can_delete: enabled
        };
      });

      await updateRolePermissions(roleId, payload);
      setMessage({ type: 'success', text: "Access protocols updated successfully." });
      onUpdated?.();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Critical failure during protocol sync." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border animate-in slide-in-from-top-2 duration-300
            ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      {/* Module Groups (2-Column Grid) */}
      <div className="grid lg:grid-cols-2 gap-10">
        {[
          {
            title: "MAIN SIDEBAR",
            icon: Layout,
            description: "Same modules shown in the main application sidebar.",
            categoryKeys: ["dashboard", "live_monitoring", "scenarios", "vault", "health", "training", "alerts", "admin_hub"]
          },
          {
            title: "ADMIN SIDEBAR",
            icon: Cpu,
            description: "Same modules shown in the admin control sidebar.",
            categoryKeys: ["admin_dashboard", "users", "roles", "cameras", "areas", "intelligence_registry", "scenario_orchestration", "audit", "settings"]
          }


        ].map((group) => {
          const groupModules = modules.filter(m => group.categoryKeys.includes(m.key));
          if (groupModules.length === 0) return null;

          return (
            <div key={group.title} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <group.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-dark">{group.title}</h3>
                  <p className="text-[9px] font-bold text-text-gray uppercase tracking-widest mt-1.5">{group.description}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {groupModules.map((mod) => {
                  const perm = findPermission(mod.id);
                  const enabled = hasModuleAccess(perm);
                  return (
                    <div key={mod.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between group hover:border-accent/40 transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center border border-border group-hover:bg-accent group-hover:border-accent transition-all">
                          <Activity className="w-5 h-5 text-text-gray group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dark group-hover:text-accent transition-colors">
                            {MODULE_LABELS[mod.key] || mod.name}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${enabled ? 'text-success' : 'text-text-gray opacity-50'}`}>
                          {enabled ? 'Access On' : 'Access Off'}
                        </span>
                        <button
                          onClick={() => toggleModuleAccess(mod.id)}
                          className={`w-12 h-6 rounded-full relative transition-all ${enabled ? 'bg-success' : 'bg-slate-700'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>




      <div className="pt-6 border-t border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAllPermissions(true)}
            disabled={saving || modules.length === 0}
            className="px-4 py-2 border border-success/30 text-success rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-success/10 transition-all disabled:opacity-50"
          >
            Allow All
          </button>
          <button
            onClick={() => setAllPermissions(false)}
            disabled={saving || modules.length === 0}
            className="px-4 py-2 border border-border text-text-gray rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-danger/40 hover:text-danger transition-all disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-accent text-white px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {saving ? 'Syncing...' : 'Commit Protocol Changes'}
        </button>
      </div>
    </div>
  );
}
