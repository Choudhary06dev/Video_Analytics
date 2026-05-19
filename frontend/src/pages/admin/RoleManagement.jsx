import React, { useState, useEffect } from 'react';
import { fetchRoles as apiFetchRoles, createRole, updateRole } from '../../services/userService';
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
 X,
 Search
} from 'lucide-react';
import RolePermissionsPanel from '../../components/admin/RolePermissionsPanel';
import RoleAreaPermissionsPanel from '../../components/admin/RoleAreaPermissionsPanel';

export default function RoleManagement() {
 const { token } = useAuth();
 const [roles, setRoles] = useState([]);
 const [selectedRole, setSelectedRole] = useState(null);
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [showRoleModal, setShowRoleModal] = useState(false);
 const [editingRole, setEditingRole] = useState(null);
 const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });
 const [activeTab, setActiveTab] = useState('modules'); // 'modules' or 'areas'
 const [roleSearch, setRoleSearch] = useState('');

 useEffect(() => {
  fetchRoles();
 }, []);

 const fetchRoles = async () => {
  try {
   setLoading(true);
   const data = await apiFetchRoles();
   setRoles(data);
   if (data.length > 0 && !selectedRole) {
    setSelectedRole(data[0]);
   }
   if (selectedRole) {
    const updatedSelectedRole = data.find(r => r.id === selectedRole.id);
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
    await updateRole(editingRole.id, roleFormData);
   } else {
    await createRole(roleFormData);
   }

   setShowRoleModal(false);
   setEditingRole(null);
   setRoleFormData({ name: '', description: '' });
   await fetchRoles();
  } catch (err) {
   alert(err.message ||"Failed to save role");
  } finally {
   setSubmitting(false);
  }
 };

 if (loading) {
  return (
   <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-accent animate-spin"/>
    <p className="text-[8px] font-black uppercase tracking-widest text-text-gray">Accessing Role Hierarchy...</p>
   </div>
  );
 }

 return (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-20">

   {/* Header (Scaled Down) */}
   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
    <div className="flex items-center gap-4">
     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
      <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-accent"/>
     </div>
     <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-text-dark truncate">
       Access <span className="text-accent underline decoration-accent/20 underline-offset-4">Authority</span>
      </h1>
      <p className="text-[8px] sm:text-[9px] font-bold text-text-gray uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 sm:mt-1.5 flex items-center gap-2 truncate">
       Permission Control // Role Synchronization Matrix
      </p>
     </div>
    </div>

    <div className="flex items-center gap-2">
     <button
      onClick={openCreateRoleModal}
      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-[8px] font-black uppercase tracking-widest text-text-gray hover:bg-surface hover:text-text-dark transition-all"
     >
      <Plus className="w-4 h-4"/>
      Define Role
     </button>
     <button
      onClick={fetchRoles}
      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all"
     >
      <RefreshCw className="w-3.5 h-3.5"/>
      Reload
     </button>
    </div>
   </div>

   {/* Roles Navigator (Top Box) */}
   <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-premium relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
     <ShieldCheck className="w-32 h-32"/>
    </div>

    <div className="flex flex-col gap-4 relative z-10">
     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
      <div className="flex items-center gap-3">
       <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
        <Activity className="w-4 h-4 text-accent"/>
       </div>
       <div className="min-w-0">
        <h3 className="text-[11px] font-bold tracking-tight text-accent">Access Hierarchy</h3>
        <p className="text-[8px] font-medium text-text-gray uppercase tracking-widest mt-0.5">{roles.length} Profiles Registered</p>
       </div>
      </div>
      
      <div className="relative w-full sm:w-64">
       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-gray"/>
       <input 
        type="text"
        value={roleSearch}
        onChange={(e) => setRoleSearch(e.target.value)}
        placeholder="Filter roles..."
        className="w-full bg-surface/50 border border-border rounded-lg py-1.5 pl-8 pr-4 text-[11px] font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
       />
      </div>
     </div>

     <div className="max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex flex-wrap items-center gap-2">
       {roles.filter(r => r.name.toLowerCase().includes(roleSearch.toLowerCase())).map((role) => (
        <div
         key={role.id}
         onClick={() => setSelectedRole(role)}
         className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 group/btn relative cursor-pointer
                 ${selectedRole?.id === role.id
          ? 'bg-accent/10 border-accent/30 text-accent shadow-sm'
          : 'border-border bg-surface/50 hover:bg-card text-text-gray hover:text-text-dark hover:border-accent/30'}`}
        >
         <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedRole?.id === role.id ? 'bg-accent animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'bg-text-gray/20'}`} />
         <div className="text-left min-w-0">
          <p className={`text-[11.5px] font-bold tracking-tight leading-none truncate ${selectedRole?.id === role.id ? 'text-accent' : 'text-text-dark'}`}>
           {role.name.replace('_', ' ')}
          </p>
         </div>

         {selectedRole?.id === role.id && (
          <button
           type="button"
           onClick={(e) => { e.stopPropagation(); openEditRoleModal(role); }}
           className="p-1 bg-accent text-white rounded hover:scale-110 transition-transform ml-1 shrink-0"
          >
           <Edit2 className="w-2.5 h-2.5"/>
          </button>
         )}
        </div>
       ))}
       {roles.filter(r => r.name.toLowerCase().includes(roleSearch.toLowerCase())).length === 0 && (
        <p className="text-[10px] font-bold text-text-gray italic py-4">No roles matching your search...</p>
       )}
      </div>
     </div>
    </div>
   </div>

   {/* Permissions Workspace */}
   <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700">


    {selectedRole ? (
     <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-4 sm:p-6 border-b border-border bg-surface/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
       <div className="flex items-center gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 dark:bg-card rounded-lg flex items-center justify-center border border-border shrink-0">
         <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-accent"/>
        </div>
        <div className="min-w-0">
         <h3 className="text-xs sm:text-sm font-bold tracking-tight text-text-dark truncate">Modify: <span className="text-accent">{selectedRole.name.replace('_', ' ')}</span></h3>
         <p className="text-[9px] sm:text-[10px] font-medium text-text-gray mt-1 truncate">Granular Control Matrix</p>
        </div>
       </div>
       <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 border border-success/20 rounded-lg shrink-0">
         <Activity className="w-3 h-3 text-success"/>
         <span className="text-[9px] sm:text-[10px] font-bold text-success">Node Link Active</span>
        </div>
       </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-surface/10 px-4 sm:px-6 pt-4 gap-4 sm:gap-6">
       <button
        onClick={() => setActiveTab('modules')}
        className={`pb-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
         activeTab === 'modules'
          ? 'text-accent border-b-2 border-accent'
          : 'text-text-gray hover:text-text-dark'
        }`}
       >
        Module Access
       </button>
       <button
        onClick={() => setActiveTab('areas')}
        className={`pb-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
         activeTab === 'areas'
          ? 'text-accent border-b-2 border-accent'
          : 'text-text-gray hover:text-text-dark'
        }`}
       >
        Area Permissions
       </button>
      </div>

      <div className="p-6">
       {activeTab === 'modules' ? (
        <RolePermissionsPanel
         roleId={selectedRole.id}
         initialPermissions={selectedRole.permissions}
         onUpdated={fetchRoles}
        />
       ) : (
        <RoleAreaPermissionsPanel
         roleId={selectedRole.id}
         onUpdated={fetchRoles}
        />
       )}
      </div>
     </div>
    ) : (
     <div className="h-full bg-card border border-border border-dashed rounded-lg flex flex-col items-center justify-center p-12 text-center">
      <ShieldAlert className="w-12 h-12 text-text-gray/20 mb-4"/>
      <h3 className="text-sm font-bold tracking-tight text-text-gray mb-2">Select a profile to reconfigure</h3>
      <p className="text-[11px] font-medium text-text-gray/60">Role-based access requires active session selection</p>
     </div>

    )}
   </div>

   {showRoleModal && (

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
     <div className="bg-card w-full max-w-md rounded-lg border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
       <h2 className="text-sm font-black uppercase tracking-widest text-text-dark flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-accent"/>
        {editingRole ? 'Edit Access Role' : 'Create Access Role'}
       </h2>
       <button
        type="button"
        onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
        className="text-text-gray hover:text-text-dark p-1"
       >
        <X className="w-5 h-5"/>
       </button>
      </div>
      <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
       <div className="space-y-1.5">
        <label className="text-[8px] font-black uppercase tracking-widest text-text-gray ml-1">Role Name</label>
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
        <label className="text-[8px] font-black uppercase tracking-widest text-text-gray ml-1">Description</label>
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
         className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[8px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all"
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
