import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Server, Activity, Trash2, Loader2, AlertTriangle, UserCheck } from 'lucide-react';

export default function AdminHub() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

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
      setError("Failed to fetch node registry. System access denied.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("WARNING: Irreversible action. Purge this node from the registry?")) return;
    
    try {
      setDeleteLoading(userId);
      await axios.delete(`http://localhost:8000/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || "Purge failed. Target may be protected.");
    } finally {
      setDeleteLoading(null);
    }
  };

  // KPI Calculations
  const superAdminCount = users.filter(u => u.role === 'super_admin').length;
  const standardCount = users.filter(u => u.role === 'operator').length;

  return (
    <div className="p-8 h-full overflow-y-auto w-full selection:bg-danger/30 text-white">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-10 border-b border-danger/20 pb-6 relative">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-danger/10 to-transparent pointer-events-none"></div>
         <div className="w-14 h-14 bg-danger/10 rounded-2xl flex items-center justify-center border border-danger/30 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-8 h-8 text-danger animate-pulse" />
         </div>
         <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">
               Nexer <span className="text-danger">Admin Hub</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-danger/70 flex items-center gap-2 mt-1">
               <span className="w-1.5 h-1.5 bg-danger rounded-full"></span>
               System Supervisor Clearance Protocol Active
            </p>
         </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users className="w-32 h-32 text-white" />
            </div>
            <div className="flex items-center gap-3 mb-4">
               <Users className="w-5 h-5 text-accent" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Total Nodes</h3>
            </div>
            <p className="text-5xl font-black">{users.length}</p>
         </div>

         <div className="bg-danger/[0.02] border border-danger/10 rounded-2xl p-6 relative overflow-hidden group shadow-[inset_0_0_30px_rgba(244,63,94,0.02)]">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <UserCheck className="w-32 h-32 text-danger" />
            </div>
            <div className="flex items-center gap-3 mb-4">
               <ShieldAlert className="w-5 h-5 text-danger" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-danger/70">Super Admins</h3>
            </div>
            <p className="text-5xl font-black text-danger">{superAdminCount}</p>
         </div>

         <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Server className="w-32 h-32 text-accent" />
            </div>
            <div className="flex items-center gap-3 mb-4">
               <Activity className="w-5 h-5 text-emerald-400" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Operators Active</h3>
            </div>
            <p className="text-5xl font-black">{standardCount}</p>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
         <div className="p-6 border-b border-white/10 bg-white/[0.02]">
            <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
               <AlertTriangle className="w-5 h-5 text-danger" />
               Registered Personnel Access Ledger
            </h2>
         </div>

         {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-8 h-8 text-danger animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Decrypting Ledger...</p>
            </div>
         ) : error ? (
            <div className="p-20 text-center">
               <p className="text-danger font-bold">{error}</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-white/10 bg-white/[0.04]">
                        <th className="py-4 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">ID</th>
                        <th className="py-4 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Operator Identity</th>
                        <th className="py-4 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Network Node</th>
                        <th className="py-4 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Security Role</th>
                        <th className="py-4 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Timestamp</th>
                        <th className="py-4 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                           <td className="py-4 px-6 text-sm font-bold text-white/60">#{u.id}</td>
                           <td className="py-4 px-6 text-sm font-bold">{u.full_name}</td>
                           <td className="py-4 px-6 text-sm font-mono text-white/60">{u.email}</td>
                           <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                 u.role === 'super_admin' 
                                 ? 'bg-danger/20 text-danger border border-danger/30'
                                 : 'bg-white/10 text-white/70 border border-white/10'
                              }`}>
                                 {u.role.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="py-4 px-6 text-xs text-white/40 font-mono">
                              {new Date(u.created_at).toLocaleString()}
                           </td>
                           <td className="py-4 px-6 text-right">
                              {u.id !== user?.id && (
                                 <button 
                                    onClick={() => handleDelete(u.id)}
                                    disabled={deleteLoading === u.id}
                                    className="p-2 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    title="Purge Node"
                                 >
                                    {deleteLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                 </button>
                              )}
                           </td>
                        </tr>
                     ))}
                     {users.length === 0 && (
                        <tr>
                           <td colSpan="6" className="py-10 text-center text-white/30 text-sm font-bold uppercase tracking-widest">
                              Registry Empty
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  );
}
