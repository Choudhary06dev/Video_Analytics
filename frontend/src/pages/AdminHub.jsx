import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Users, Server, Activity, Trash2, Loader2, 
  AlertTriangle, UserCheck, Shield, ChevronDown, Plus, X, Pencil 
} from 'lucide-react';

export default function AdminHub() {
  const { token, user: loggedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // {id, type: 'delete'|'role'}

  // Node Modal State (Handles both Create and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null means "Create" mode
  const [formData, setFormData] = useState({ 
    full_name: '', 
    email: '', 
    password: '', 
    role_name: 'operator' 
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError("Network Registry Link Failed. Access Denied.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ full_name: '', email: '', password: '', role_name: 'operator' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({ 
      full_name: targetUser.full_name, 
      email: targetUser.email, 
      password: '', // Password stays empty unless changed
      role_name: targetUser.role 
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("WARNING: Irreversible action. Purge this node from the registry?")) return;
    
    try {
      setActionLoading({ id: userId, type: 'delete' });
      await axios.delete(`http://localhost:8000/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || "Purge failed. Target may be protected.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    // Only block self-change if it's a demotion (handled better in backend, but good for UI)
    try {
      setActionLoading({ id: userId, type: 'role' });
      const response = await axios.put(`http://localhost:8000/admin/users/${userId}/role`, 
        { role_name: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u.id === userId ? { ...u, role: response.data.new_role } : u));
    } catch (err) {
      alert(err.response?.data?.detail || "Role modification failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (editingUser) {
        // UPDATE MODE
        const updatePayload = { ...formData };
        if (!updatePayload.password) delete updatePayload.password; // Don't send empty password

        await axios.put(`http://localhost:8000/admin/users/${editingUser.id}`, 
          updatePayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // CREATE MODE
        await axios.post('http://localhost:8000/admin/users', 
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      await fetchUsers(); // Refresh the list
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Transaction failed. Check network link.");
    } finally {
      setFormLoading(false);
    }
  };

  // KPI Calculations
  const superAdminCount = users.filter(u => u.role === 'super_admin').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const standardCount = users.filter(u => u.role === 'operator').length;

  return (
    <div className="p-8 h-full overflow-y-auto w-full selection:bg-accent/30 text-text-dark bg-bg scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent relative transition-colors duration-300">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border pb-8 relative">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-accent/[0.03] to-transparent pointer-events-none"></div>
         <div className="flex items-center gap-5">
             <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                <Shield className="w-9 h-9 text-accent animate-pulse" />
             </div>
             <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-text-dark">
                   Matrix <span className="text-accent">Admin Hub</span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-accent/80 flex items-center gap-2 mt-1 px-1">
                   <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping"></span>
                   Security Level: Priority Zero // Root Access Enabled
                </p>
             </div>
         </div>

         {/* Authorize Node Button */}
         <button 
            onClick={openCreateModal}
            className="flex items-center gap-3 bg-accent hover:bg-accent/90 text-white px-7 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-premium hover:shadow-[0_10px_25px_rgba(14,165,233,0.3)] hover:-translate-y-1 active:translate-y-0"
         >
             <Plus className="w-4 h-4" strokeWidth={3} />
             Authorize New Node
         </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
         {[
           { label: 'Total Nodes', count: users.length, icon: Users, color: 'text-text-dark' },
           { label: 'Super Admins', count: superAdminCount, icon: ShieldAlert, color: 'text-accent' },
           { label: 'Network Admins', count: adminCount, icon: UserCheck, color: 'text-blue-500' },
           { label: 'Field Operators', count: standardCount, icon: Server, color: 'text-emerald-500' }
         ].map((kpi, i) => (
            <div key={i} className="bg-card border border-border rounded-3xl p-7 relative overflow-hidden group shadow-sm hover:shadow-premium transition-all duration-300">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-gray">{kpi.label}</h3>
                    </div>
                    <p className={`text-4xl font-black ${kpi.color}`}>{kpi.count}</p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
                    <kpi.icon className="w-32 h-32" />
                </div>
            </div>
         ))}
      </div>

      {/* Main Registry Table */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-premium">
         <div className="px-8 py-7 border-b border-border bg-surface/[0.4] flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-text-dark">
               <Activity className="w-5 h-5 text-accent" />
               Live Personnel Ledger
            </h2>
            <p className="text-[10px] font-bold text-text-gray bg-border/50 px-3 py-1 rounded-full">{users.length} Records Detected</p>
         </div>

         {loading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-5">
               <Loader2 className="w-10 h-10 text-accent animate-spin" strokeWidth={3} />
               <p className="text-[11px] font-black uppercase tracking-[0.5em] text-text-gray animate-pulse">Syncing Matrix Ledger...</p>
            </div>
         ) : error ? (
            <div className="p-24 text-center">
               <div className="inline-flex items-center justify-center p-5 bg-danger/10 text-danger rounded-3xl mb-5 border border-danger/20 shadow-lg shadow-danger/5">
                   <AlertTriangle className="w-8 h-8" />
               </div>
               <p className="text-danger font-black uppercase tracking-[0.2em] text-xs">{error}</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                     <tr className="border-b border-border bg-surface/[0.2]">
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">ID</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Full Name</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Email Address</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Role</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray">Created At</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-text-gray text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {users.map((u) => (
                        <tr key={u.id} className="border-b border-border hover:bg-surface/40 transition-all group/row">
                           <td className="py-5 px-8 text-xs font-bold text-text-gray italic">#{u.id.toString().padStart(3, '0')}</td>
                           <td className="py-5 px-8 text-sm font-black text-text-dark">{u.full_name}</td>
                           <td className="py-5 px-8 text-sm font-mono text-text-gray">{u.email}</td>
                           
                           {/* Role Indicator/Editor */}
                           <td className="py-5 px-8">
                              <div className="relative inline-block w-[150px]">
                                 <select 
                                    className={`appearance-none bg-card border rounded-xl py-2 pl-4 pr-10 text-[10px] font-black uppercase tracking-[0.15em] w-full outline-none cursor-pointer transition-all shadow-sm
                                       ${u.role === 'super_admin' ? 'border-accent/30 text-accent bg-accent/[0.04] hover:border-accent' : 
                                         u.role === 'admin' ? 'border-blue-500/30 text-blue-500 bg-blue-500/[0.04] hover:border-blue-500' :
                                         'border-border text-text-gray bg-surface hover:border-text-gray/40'}
                                       ${actionLoading?.id === u.id && actionLoading?.type === 'role' ? 'opacity-40 pointer-events-none' : ''}
                                    `}
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    disabled={actionLoading !== null || (u.id === loggedInUser?.id && u.role === 'super_admin')}
                                    title={u.id === loggedInUser?.id ? "Strict Lock: Own protocol cannot be demoted" : "Modify clearance"}
                                 >
                                    <option value="operator">Operator</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                 </select>
                                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-gray/60">
                                     {actionLoading?.id === u.id && actionLoading?.type === 'role' ? (
                                         <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                                     ) : (
                                         <ChevronDown className="w-3.5 h-3.5" />
                                     )}
                                 </div>
                              </div>
                           </td>
                           
                           <td className="py-5 px-8 text-[11px] text-text-gray font-mono font-semibold">
                              {new Date(u.created_at).toLocaleDateString()}
                           </td>
                           
                           <td className="py-5 px-8 text-right">
                              <div className="flex items-center justify-end gap-3">
                                  {/* Edit Button */}
                                  <button 
                                    onClick={() => openEditModal(u)}
                                    disabled={actionLoading !== null}
                                    className="p-2.5 bg-surface border border-border hover:bg-accent hover:border-accent text-text-gray hover:text-white rounded-xl transition-all shadow-sm hover:shadow-lg hover:shadow-accent/20 active:scale-90"
                                    title="Edit Node Profile"
                                  >
                                      <Pencil className="w-4 h-4" />
                                  </button>

                                  {/* Delete Button */}
                                  {u.id !== loggedInUser?.id ? (
                                    <button 
                                        onClick={() => handleDelete(u.id)}
                                        disabled={actionLoading !== null}
                                        className="p-2.5 bg-danger/[0.03] border border-danger/10 hover:bg-danger hover:border-danger text-danger hover:text-white rounded-xl transition-all shadow-sm hover:shadow-lg hover:shadow-danger/20 active:scale-90"
                                        title="Purge Node Registry"
                                    >
                                        {actionLoading?.id === u.id && actionLoading?.type === 'delete' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                  ) : (
                                      <div className="px-3 py-2 bg-surface rounded-xl text-[9px] font-black uppercase tracking-widest text-text-gray/40 border border-border/50">
                                          Protocols Locked
                                      </div>
                                  )}
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* ------------------------------------- */}
      {/* AUTHORIZE / EDIT MODAL OVERLAY        */}
      {/* ------------------------------------- */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <div 
                className="absolute inset-0 bg-text-dark/40 backdrop-blur-md transition-all duration-300"
                onClick={() => !formLoading && setIsModalOpen(false)}
            ></div>
            
            <div className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.4)] relative z-10 border border-border overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-border bg-surface/[0.5] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                            <Shield className="w-5 h-5 text-accent" />
                        </div>
                        <h3 className="font-black italic uppercase tracking-widest text-text-dark text-xl">
                            {editingUser ? 'Sync Node Credentials' : 'Authorize New Node'}
                        </h3>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(false)} 
                        className="p-2 rounded-xl text-text-gray hover:text-text-dark hover:bg-border transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                    {formError && (
                        <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-gray pl-1">Full Name</label>
                            <input 
                                required
                                type="text"
                                value={formData.full_name}
                                onChange={e => setFormData({...formData, full_name: e.target.value})}
                                className="w-full bg-surface border border-border rounded-2xl px-5 py-4 text-sm font-black text-text-dark outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-gray/40"
                                placeholder="Full Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-gray pl-1">Email Address</label>
                            <input 
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-surface border border-border rounded-2xl px-5 py-4 text-sm font-mono text-text-dark outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                                placeholder="email@nexus.core"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-gray pl-1">
                                {editingUser ? 'New Password (Optional)' : 'Password'}
                            </label>
                            <input 
                                required={!editingUser}
                                type="text"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                className="w-full bg-surface border border-border rounded-2xl px-5 py-4 text-sm font-mono text-text-dark outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-gray/30 placeholder:font-sans"
                                placeholder={editingUser ? "Keep empty to preserve..." : "Strength required"}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-gray pl-1">Role</label>
                            <select 
                                value={formData.role_name}
                                onChange={e => setFormData({...formData, role_name: e.target.value})}
                                className="w-full bg-surface border border-border rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest text-text-dark outline-none focus:border-accent transition-all cursor-pointer shadow-sm"
                            >
                                <option value="operator">Operator</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-4 border border-border hover:bg-surface text-text-gray rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                        >
                            Abort
                        </button>
                        <button 
                            type="submit"
                            disabled={formLoading}
                            className="flex-1 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-premium hover:shadow-accent/30 flex items-center justify-center gap-3 active:scale-95"
                        >
                            {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? <Shield className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {editingUser ? 'Save Protocol' : 'Instantiate Node'}
                        </button>
                    </div>
                </form>
            </div>
         </div>
      )}
    </div>
  );
}
