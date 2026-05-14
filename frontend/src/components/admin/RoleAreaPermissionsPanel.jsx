import React, { useState, useEffect } from 'react';
import { fetchRoleAreaPermissions, updateRoleAreaPermissions } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function RoleAreaPermissionsPanel({ roleId, onUpdated }) {
  const { token } = useAuth();
  const [areas, setAreas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAreas();
  }, [roleId]);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const data = await fetchRoleAreaPermissions(roleId);
      setAreas(data);
    } catch (err) {
      console.error("Failed to fetch areas for role", err);
      setMessage({ type: 'error', text: "Failed to load area permissions." });
    } finally {
      setLoading(false);
    }
  };

  const toggleAreaAccess = (areaId) => {
    setAreas(prev => {
      const existingIdx = prev.findIndex(a => a.area_id === areaId);
      if (existingIdx === -1) return prev;

      const newCanView = !prev[existingIdx].can_view;
      const updated = [...prev];

      // Recursive helper to update children
      const updateChildrenRecursively = (parentId, value) => {
        updated.forEach((a, idx) => {
          if (a.parent_id === parentId) {
            updated[idx] = { ...a, can_view: value };
            updateChildrenRecursively(a.area_id, value);
          }
        });
      };

      // Update the target area
      updated[existingIdx] = {
        ...updated[existingIdx],
        can_view: newCanView
      };

      // Cascade to all children
      updateChildrenRecursively(areaId, newCanView);

      return updated;
    });
  };

  const setAllPermissions = (enabled) => {
    setAreas(prev => prev.map(a => ({ ...a, can_view: enabled })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = areas.map((area) => ({
        area_id: area.area_id,
        can_view: area.can_view
      }));

      await updateRoleAreaPermissions(roleId, payload);
      setMessage({ type: 'success', text: "Area protocols updated successfully." });
      onUpdated?.();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Critical failure during protocol sync." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 gap-4">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-gray">Fetching Area Links...</p>
      </div>
    );
  }

  // Helper to build tree structure
  const buildTree = (items) => {
    const rootItems = items.filter(item => !item.parent_id);
    const getChildren = (parentId) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: getChildren(item.area_id)
        }));
    };

    return rootItems.map(item => ({
      ...item,
      children: getChildren(item.area_id)
    }));
  };

  const areaTree = buildTree(areas);

  const renderAreaRow = (area, depth = 0) => {
    const enabled = area.can_view;
    const hasChildren = area.children && area.children.length > 0;
    
    return (
      <React.Fragment key={area.area_id}>
        <div 
          className={`relative flex items-center transition-all duration-300`}
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          {/* Connector Line for nested items */}
          {depth > 0 && (
            <div 
              className="absolute left-0 border-l-2 border-accent/20 rounded-bl-lg" 
              style={{ 
                left: `${(depth - 1) * 24 + 12}px`, 
                top: '-12px', 
                height: '28px', 
                width: '12px',
                borderBottom: '2px solid rgba(14, 165, 233, 0.2)'
              }} 
            />
          )}

          <div 
            className={`flex-1 bg-card border rounded-lg p-2 flex items-center justify-between group hover:border-accent/40 transition-all shadow-sm
              ${depth === 0 ? 'border-border/80 bg-surface/5' : 'border-border/40 bg-card'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded flex items-center justify-center border transition-all
                ${depth === 0 
                  ? 'bg-accent/10 border-accent/20 text-accent group-hover:bg-accent group-hover:text-white' 
                  : 'bg-surface border-border text-text-gray group-hover:bg-accent/80 group-hover:text-white group-hover:border-accent/50'}
              `}>
                <MapPin className={`${depth === 0 ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
              </div>
              <div>
                <h4 className={`font-black uppercase tracking-tight transition-colors
                  ${depth === 0 ? 'text-[10px] text-text-dark group-hover:text-accent' : 'text-[9px] text-text-gray group-hover:text-text-dark'}
                `}>
                  {area.area_name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-bold text-text-gray/60 uppercase">ID: {area.area_id}</span>
                  {hasChildren && (
                    <span className="text-[8px] font-black text-accent/60 uppercase px-1.5 py-0.5 bg-accent/5 rounded border border-accent/10">Parent Zone</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-1">
                 <span className={`text-[8px] font-black uppercase tracking-widest ${enabled ? 'text-success' : 'text-text-gray opacity-50'}`}>
                  {enabled ? 'Visible' : 'Hidden'}
                </span>
                <button
                  onClick={() => toggleAreaAccess(area.area_id)}
                  className={`w-9 h-4.5 rounded-full relative transition-all cursor-pointer ${enabled ? 'bg-success' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm ${enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
        {area.children && area.children.length > 0 && (
          <div className="space-y-3 mt-3 mb-3">
            {area.children.map(child => renderAreaRow(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border animate-in slide-in-from-top-2 duration-300
            ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {areas.length === 0 ? (
            <div className="text-center p-8 text-text-gray text-xs font-bold">No areas found in the system.</div>
        ) : (
          areaTree.map(rootArea => renderAreaRow(rootArea))
        )}
      </div>

      <div className="pt-6 border-t border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAllPermissions(true)}
            disabled={saving || areas.length === 0}
            className="px-4 py-2 border border-success/30 text-success rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-success/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            Allow All
          </button>
          <button
            onClick={() => setAllPermissions(false)}
            disabled={saving || areas.length === 0}
            className="px-4 py-2 border border-border text-text-gray rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-danger/40 hover:text-danger transition-all disabled:opacity-50 cursor-pointer"
          >
            Clear All
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-accent text-white px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {saving ? 'Syncing...' : 'Commit Area Changes'}
        </button>
      </div>
    </div>
  );
}
