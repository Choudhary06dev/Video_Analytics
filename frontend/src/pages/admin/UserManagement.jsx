import React, { useState, useEffect } from 'react';
import { 
 fetchAdminUsers, 
 createUser, 
 updateUser, 
 deleteUser, 
 updateUserStatus,
 fetchRoles,
 fetchAuditLogs 
} from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { 
 Users, 
 Shield, 
 Trash2, 
 Search, 
 Mail, 
 Calendar, 
 MoreVertical,
 Activity,
 ShieldAlert,
 Power,
 RefreshCw,
 Plus,
 Loader2,
 Lock,
 UserCheck,
 Edit2,
 X,
 UserPlus,
 ChevronLeft,
 ChevronRight
} from 'lucide-react';

export default function UserManagement() {
 const { token, user: currentUser } = useAuth();
 const [users, setUsers] = useState([]);
 const [roles, setRoles] = useState([]);
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
 const [selectedUser, setSelectedUser] = useState(null);

 // Form States
 const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role_name: 'operator', is_active: true });
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
  fetchData();
 }, [currentPage]);

 const fetchData = async () => {
  try {
   setLoading(true);
   const skip = (currentPage - 1) * pageSize;
   const [usersResponse, rolesData] = await Promise.all([
    fetchAdminUsers(skip, pageSize),
    fetchRoles()
   ]);
   setUsers(usersResponse.users);
   setTotalItems(usersResponse.total);
   setRoles(rolesData);
  } catch (err) {
   console.error("Failed to fetch data", err);
  } finally {
   setLoading(false);
  }
 };

 const handleCreateUser = async (e) => {
  e.preventDefault();
  try {
   setSubmitting(true);
   await createUser(formData);
   setShowAddModal(false);
   setFormData({ full_name: '', email: '', password: '', role_name: 'operator' });
   fetchData();
  } catch (err) {
   alert(err.message ||"Failed to create user");
  } finally {
   setSubmitting(false);
  }
 };

 const handleEditUser = async (e) => {
  e.preventDefault();
  try {
   setSubmitting(true);
   const dataToSubmit = { ...formData };
   if (!dataToSubmit.password) delete dataToSubmit.password;

   await updateUser(selectedUser.id, dataToSubmit);
   setShowEditModal(false);
   setSelectedUser(null);
   fetchData();
  } catch (err) {
   console.error("Edit error:", err.message);
   alert(err.message ||"Failed to edit user");
  } finally {
   setSubmitting(false);
  }
 };

 const handleDeleteUser = async () => {
  try {
   setSubmitting(true);
   await deleteUser(selectedUser.id);
   setShowDeleteModal(false);
   setSelectedUser(null);
   fetchData();
  } catch (err) {
   alert(err.message ||"Failed to delete user");
  } finally {
   setSubmitting(false);
  }
 };

 const toggleUserStatus = async (userId, currentStatus) => {
  try {
   await updateUserStatus(userId, !currentStatus);
   fetchData();
  } catch (err) {
   console.error("Status toggle error:", err.message);
   alert(err.message ||"Failed to update user status");
  }
 };

 const openEditModal = (user) => {
  setSelectedUser(user);
  setFormData({
   full_name: user.full_name,
   email: user.email,
   password: '',
   role_name: user.role,
   is_active: user.is_active !== false
  });
  setShowEditModal(true);
 };

 const openDeleteModal = (user) => {
  setSelectedUser(user);
  setShowDeleteModal(true);
 };


 const filteredUsers = users.filter(u => 
  u.full_name.toLowerCase().includes(filter.toLowerCase()) || 
  u.email.toLowerCase().includes(filter.toLowerCase())
 );

 if (loading) {
  return (
   <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-accent animate-spin"/>
    <p className="text-[10px] font-black uppercase tracking-widest text-text-gray">Decrypting Identity Matrix...</p>
   </div>
  );
 }

 return (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">
   
   {/* Header Section */}
   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 px-1">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
        <Users className="w-7 h-7 text-accent"/>
      </div>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-text-dark truncate">
          Personnel <span className="text-accent underline decoration-accent/20 underline-offset-4">Matrix</span>
        </h1>
        <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2 truncate">
          Identity Registry // Node Control Protocol
        </p>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative group flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray group-focus-within:text-accent transition-colors"/>
        <input
          type="text"
          placeholder="Search identity..."
          className="w-full sm:w-64 bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <button
        onClick={() => { setFormData({ full_name: '', email: '', password: '', role_name: 'operator', is_active: true }); setShowAddModal(true); }}
        className="flex items-center justify-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0 whitespace-nowrap"
      >
        <Plus className="w-4 h-4"/>
        New Identity
      </button>
    </div>
   </div>

   {/* Stats Summary */}
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-1">
    {[
      { label: 'Total Nodes', val: totalItems, icon: Users, color: 'text-accent' },
      { label: 'Active Sessions', val: users.filter(u => u.is_active !== false).length, icon: Power, color: 'text-success' },
      { label: 'Network Admins', val: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length, icon: Shield, color: 'text-purple-500' },
      { label: 'Threats', val: 0, icon: ShieldAlert, color: 'text-danger' },
    ].map((s, i) => (
      <div key={i} className="bg-card border border-border p-3 sm:p-4 rounded-lg flex items-center justify-between shadow-sm min-w-0 hover:border-accent/30 transition-colors">
        <div className="min-w-0">
          <p className="text-[7px] sm:text-[8px] font-black text-text-gray uppercase tracking-widest mb-1 truncate">{s.label}</p>
          <p className={`text-base sm:text-xl font-black ${s.color} truncate`}>{s.val}</p>
        </div>
        <div className="p-1.5 sm:p-2.5 rounded-lg bg-surface border border-border shrink-0 ml-2">
          <s.icon className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${s.color}`} />
        </div>
      </div>
    ))}
   </div>

   {/* Users Data Table */}
   <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm mx-1">
    <div className="overflow-x-auto custom-scrollbar">
     <table className="w-full text-left border-collapse min-w-[800px]">
      <thead>
       <tr className="bg-surface/50 border-b border-border text-[9px] font-black uppercase tracking-widest text-text-gray">
        <th className="p-4 pl-6">System ID</th>
        <th className="p-4">Personnel Info</th>
        <th className="p-4">Authorization</th>
        <th className="p-4">Node Status</th>
        <th className="p-4">Onboarding</th>
        <th className="p-4 pr-6 text-right">Actions</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-border">
       {filteredUsers.map((user) => (
        <tr key={user.id} className="hover:bg-surface/30 transition-colors group">
         <td className="p-4 pl-6">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-gray bg-surface px-2 py-1 rounded-lg border border-border w-fit font-mono">
            <Activity className="w-3 h-3"/>
            #{user.id}
          </div>
         </td>
         <td className="p-4">
          <div className="flex items-center gap-3">
           <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center border-2 shrink-0
            ${user.is_active !== false ? 'border-accent/10 bg-accent/5' : 'border-danger/10 bg-danger/5'}`}>
            <img src={`https://ui-avatars.com/api/?name=${user.full_name}&background=random&color=fff&bold=true`} className="w-8 h-8 rounded-lg"alt=""/>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${user.is_active !== false ? 'bg-success' : 'bg-danger'}`}></div>
           </div>
           <div className="min-w-0">
            <p className="text-xs font-black text-text-dark uppercase tracking-wide truncate">{user.full_name}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-text-gray font-bold mt-0.5 truncate">
              <Mail className="w-3 h-3 shrink-0"/>
              <span className="truncate">{user.email}</span>
            </div>
           </div>
          </div>
         </td>
         <td className="p-4">
          <div className="flex items-center gap-2">
           <Shield className={`w-3.5 h-3.5 ${user.role === 'super_admin' ? 'text-purple-500' : user.role === 'admin' ? 'text-accent' : 'text-emerald-500'}`} />
           <span className="text-[10px] font-black uppercase tracking-widest text-text-dark">{user.role?.replace('_', ' ')}</span>
          </div>
         </td>
         <td className="p-4">
          <button
            onClick={() => toggleUserStatus(user.id, user.is_active !== false)}
            className={`w-24 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${user.is_active !== false ? 'bg-success/10 text-success border-success/20 hover:bg-success/20' : 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20'}`}
          >
            <Power className="w-3 h-3"/>
            {user.is_active !== false ? 'Active' : 'Suspended'}
          </button>
         </td>
         <td className="p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-gray">
            <Calendar className="w-3 h-3"/>
            {new Date(user.created_at).toLocaleDateString()}
          </div>
         </td>
         <td className="p-4 pr-6">
          <div className="flex items-center justify-end gap-2">
           <button onClick={() => openEditModal(user)} className="p-2 border border-border text-text-gray rounded-lg hover:text-accent hover:border-accent transition-all bg-card"title="Edit Node">
            <Edit2 className="w-3.5 h-3.5"/>
           </button>
           <button onClick={() => openDeleteModal(user)} className="p-2 border border-border text-text-gray rounded-lg hover:text-danger hover:border-danger transition-all bg-card"title="Purge Node">
            <Trash2 className="w-3.5 h-3.5"/>
           </button>
          </div>
         </td>
        </tr>
       ))}
       {filteredUsers.length === 0 && (
        <tr>
          <td colSpan={6} className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-text-gray">
            No identities found matching the criteria
          </td>
        </tr>
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination Bar */}
    <div className="px-4 sm:px-6 py-4 bg-surface/30 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
     <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-gray text-center md:text-left">
      Showing <span className="text-text-dark">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> to <span className="text-text-dark">{Math.min(totalItems, currentPage * pageSize)}</span> of <span className="text-text-dark">{totalItems}</span> personnel records
     </div>
     
     <div className="flex items-center gap-2">
      <button 
       disabled={currentPage === 1}
       onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
       className="p-2 rounded-lg border border-border bg-card text-text-gray hover:text-accent hover:border-accent disabled:opacity-30 disabled:hover:text-text-gray disabled:hover:border-border transition-all"
      >
       <ChevronLeft className="w-3.5 h-3.5"/>
      </button>
      
      <div className="flex items-center gap-1">
       {Array.from({ length: Math.ceil(totalItems / pageSize) }, (_, i) => i + 1)
        .filter(p => p === 1 || p === Math.ceil(totalItems / pageSize) || Math.abs(p - currentPage) <= 1)
        .map((p, i, arr) => (
         <React.Fragment key={p}>
          {i > 0 && p - arr[i-1] > 1 && <span className="text-text-gray px-1 text-xs">...</span>}
          <button
           onClick={() => setCurrentPage(p)}
           className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 rounded-lg text-[9px] sm:text-[10px] font-black transition-all border ${currentPage === p 
            ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
            : 'bg-card text-text-gray border-border hover:border-accent/50 hover:text-accent'}`}
          >
           {p}
          </button>
         </React.Fragment>
        ))}
      </div>

      <button 
       disabled={currentPage >= Math.ceil(totalItems / pageSize)}
       onClick={() => setCurrentPage(prev => prev + 1)}
       className="p-2 rounded-lg border border-border bg-card text-text-gray hover:text-accent hover:border-accent disabled:opacity-30 disabled:hover:text-text-gray disabled:hover:border-border transition-all"
      >
       <ChevronRight className="w-3.5 h-3.5"/>
      </button>
     </div>
    </div>
   </div>

   {/* Add / Edit User Modal */}
   {(showAddModal || showEditModal) && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-lg border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
          <h2 className="text-sm font-black uppercase tracking-widest text-text-dark flex items-center gap-2">
            {showEditModal ? <Edit2 className="w-4 h-4 text-accent"/> : <UserPlus className="w-4 h-4 text-accent"/>}
            {showEditModal ? 'Reconfigure Identity' : 'Authorize New Identity'}
          </h2>
          <button type="button"onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-text-gray hover:text-text-dark p-1">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <form onSubmit={showEditModal ? handleEditUser : handleCreateUser} className="p-6 space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Full Name</label>
            <input type="text"required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                placeholder="Enter full name"/>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Comms Uplink (Email)</label>
            <input type="email"required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                placeholder="Enter email address"/>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Access Protocol (Role)</label>
            <select required value={formData.role_name} onChange={e => setFormData({...formData, role_name: e.target.value})}
                className="w-full bg-surface border border-border rounded-lg pl-4 pr-16 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all cursor-pointer">
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name.replace('_', ' ').toUpperCase()}</option>
              ))}
              {roles.length === 0 && (
                <>
                  <option value="operator">OPERATOR</option>
                  <option value="admin">ADMIN</option>
                  <option value="super_admin">SUPER ADMIN</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Security Key (Password)</label>
            <input type={showEditModal ?"password":"text"} required={!showEditModal} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                placeholder={showEditModal ?"Leave blank to keep unchanged":"Set secure password"} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Node Status</label>
            <div className="flex items-center gap-3">
              <button type="button"onClick={() => setFormData({...formData, is_active: true})}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${formData.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-surface border-border text-text-gray'}`}>
                Active
              </button>
              <button type="button"onClick={() => setFormData({...formData, is_active: false})}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${!formData.is_active ? 'bg-danger/10 text-danger border-danger/20' : 'bg-surface border-border text-text-gray'}`}>
                Suspended
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button"onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
              Cancel
            </button>
            <button type="submit"disabled={submitting}
                className="flex-1 py-2.5 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
              {submitting ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
   )}

   {/* Delete Confirmation Modal */}
   {showDeleteModal && selectedUser && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-lg border border-danger/20 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-danger/20">
            <Trash2 className="w-8 h-8 text-danger"/>
          </div>
          <h2 className="text-lg font-black uppercase tracking-widest text-text-dark">Purge Node?</h2>
          <p className="text-xs font-bold text-text-gray">
            Are you sure you want to permanently delete <span className="text-danger">{selectedUser.full_name}</span>? This action cannot be undone.
          </p>
          <div className="pt-4 flex gap-3">
            <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray hover:text-text-dark transition-all">
              Cancel
            </button>
            <button onClick={handleDeleteUser} disabled={submitting}
                className="flex-1 py-2.5 bg-danger text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
              {submitting ? 'Purging...' : 'Confirm Purge'}
            </button>
          </div>
        </div>
      </div>
    </div>
   )}

  </div>
 );
}
