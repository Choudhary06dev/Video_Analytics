import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Shield, 
  Trash2, 
  UserPlus, 
  Search, 
  Mail, 
  Calendar, 
  MoreVertical,
  Activity,
  ShieldCheck,
  Power,
  RefreshCw,
  Plus,
  Loader2,
  Lock,
  UserCheck
} from 'lucide-react';

export default function UserManagement() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${BASE}/admin/users/${userId}/status`, 
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-gray">Decrypting Identity Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
      
      {/* Header Section (Scaled Down) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
                <Users className="w-7 h-7 text-accent" />
            </div>
            <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark">
                    Personnel <span className="text-accent underline decoration-accent/20 underline-offset-4">Matrix</span>
                </h1>
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                    Identity Registry // Node Control Protocol
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray group-focus-within:text-accent transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search identity..." 
                    className="bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all w-64"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <button className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0">
                <Plus className="w-4 h-4" />
                New Identity
            </button>
        </div>
      </div>

      {/* Stats Summary (Scaled Down) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
            { label: 'Total Nodes', val: users.length, icon: Users, color: 'text-accent' },
            { label: 'Active Sessions', val: users.filter(u => u.is_active).length, icon: Power, color: 'text-success' },
            { label: 'Network Admins', val: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length, icon: Shield, color: 'text-purple-500' },
            { label: 'Security Threats', val: 0, icon: ShieldAlert, color: 'text-danger' },
        ].map((s, i) => (
            <div key={i} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
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

      {/* Users Grid (Scaled Down Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className={`bg-card border transition-all duration-300 rounded-xl overflow-hidden group shadow-sm flex flex-col h-full
               ${user.is_active ? 'border-border hover:border-accent/30' : 'border-danger/10 opacity-75'}`}
          >
            {/* Card Header */}
            <div className={`h-1.5 w-full ${user.role === 'super_admin' ? 'bg-purple-500' : user.role === 'admin' ? 'bg-accent' : 'bg-emerald-500'}`}></div>
            
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-5">
                    <div className="relative">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 
                            ${user.is_active ? 'border-accent/10 bg-accent/5' : 'border-danger/10 bg-danger/5'}`}>
                            <img src={`https://ui-avatars.com/api/?name=${user.full_name}&background=random&color=fff&bold=true`} 
                                 className="w-10 h-10 rounded-lg" alt="" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card
                            ${user.is_active ? 'bg-success' : 'bg-danger'}`}></div>
                    </div>
                    
                    <div className="flex gap-1.5">
                        <button 
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className={`p-2 rounded-lg border transition-all
                            ${user.is_active 
                                ? 'border-danger/20 text-danger hover:bg-danger/10' 
                                : 'border-success/20 text-success hover:bg-success/10'}`}
                        >
                            <Power className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-2 border border-border text-text-gray rounded-lg hover:bg-surface transition-all">
                            <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="mb-5">
                    <h3 className="text-sm font-black text-text-dark uppercase tracking-tight truncate">{user.full_name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-text-gray font-bold mt-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                    </div>
                </div>

                <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-accent" />
                            <span className="text-[9px] font-black text-text-dark uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border
                            ${user.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                            {user.is_active ? 'Active' : 'Suspended'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-bold text-text-gray px-1">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-accent" />
                            ID: #{user.id}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="px-5 py-3 bg-surface/50 border-t border-border flex gap-2">
                <button className="flex-1 py-1.5 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-text-gray hover:text-accent hover:border-accent transition-all">
                    Identity View
                </button>
                <button className="flex-1 py-1.5 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-text-gray hover:text-danger hover:border-danger transition-all">
                    Purge Node
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
