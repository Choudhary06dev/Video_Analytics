import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { updateUser } from '../services/userService';
import { 
 User, 
 Camera, 
 Key, 
 HardDrive, 
 Bell, 
 Check,
 Shield,
 Monitor,
 Database,
 Globe,
 Lock,
 Zap,
 Save,
 ChevronRight,
 Eye,
 EyeOff
} from 'lucide-react';

export default function Settings() {
 const { user, updateProfile } = useAuth();
 const { addNotification } = useNotifications();
 const [activeTab, setActiveTab] = useState('profile');
 
 // Local state for all settings
 const [profileData, setProfileData] = useState({
  name: user?.name || '',
  email: user?.email || ''
 });

 const [cameraSettings, setCameraSettings] = useState({
  neuralStream: true,
  edgeRedundancy: true,
  publicBroadcast: false,
  privacyShield: true
 });

 const [storageSettings, setStorageSettings] = useState({
  retentionDays: 30,
  storageLimit: 500,
  autoPurge: true,
  compression: 'high'
 });

 const [alertSettings, setAlertSettings] = useState({
  emailAlerts: true,
  desktopPush: true,
  audioCues: false,
  criticalOnly: false
 });

 const [showPasswords, setShowPasswords] = useState({
  current: false,
  new: false,
  confirm: false
 });

 const [passwordData, setPasswordData] = useState({
  current: '',
  new: '',
  confirm: ''
 });

 const togglePassword = (field) => {
  setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
 };

 const handlePasswordUpdate = async () => {
  if (!passwordData.new || !passwordData.confirm) {
   addNotification({ type: 'error', title: 'Invalid Matrix', message: 'Please enter a new password.' });
   return;
  }

  if (passwordData.new !== passwordData.confirm) {
   addNotification({ type: 'error', title: 'Sync Error', message: 'New passwords do not match.' });
   return;
  }

  if (passwordData.new.length < 6) {
   addNotification({ type: 'error', title: 'Weak Encryption', message: 'Password must be at least 6 characters.' });
   return;
  }

  try {
   setRefreshing(true);
   await updateUser(user.id, { password: passwordData.new });
   
   addNotification({ 
    type: 'success', 
    title: 'Security Updated', 
    message: 'Your matrix password has been re-encrypted successfully.' 
   });
   
   // Clear fields
   setPasswordData({ current: '', new: '', confirm: '' });
  } catch (err) {
   addNotification({ 
    type: 'Critical', 
    title: 'Update Failed', 
    message: 'Could not update password. Check your permissions.' 
   });
  } finally {
   setRefreshing(false);
  }
 };

 const [refreshing, setRefreshing] = useState(false);

 const handleSave = async () => {
  try {
   setRefreshing(true);
   // Update backend (simulated for complex settings)
   await updateUser(user.id, { full_name: profileData.name, email: profileData.email });
   
   // Update global state
   updateProfile({ name: profileData.name, email: profileData.email });
   
   addNotification({
    type: 'success', 
    title: 'Matrix Synchronized', 
    message: 'All platform configurations have been saved and applied.'
   });
  } catch (err) {
   addNotification({
    type: 'Critical', 
    title: 'Sync Failed', 
    message: 'Failed to update matrix. Ensure core services are reachable.'
   });
  } finally {
   setRefreshing(false);
  }
 };

 const tabs = [
  { id: 'profile', title: 'Admin Profile', icon: User },
  { id: 'camera', title: 'Camera Config', icon: Camera },
  { id: 'security', title: 'Security & Auth', icon: Key },
  { id: 'storage', title: 'AI & Storage', icon: HardDrive },
  { id: 'notifications', title: 'Alert Prefs', icon: Bell },
 ];

 return (
  <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
   {/* Page Header */}
   <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 px-2">
    <div className="min-w-0">
     <h2 className="text-xl sm:text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">Platform Settings</h2>
     <div className="text-[0.8rem] sm:text-[0.9rem] text-text-gray font-semibold flex items-center gap-2 flex-wrap">
      System Configuration & Credentials
      <span className="hidden sm:block w-1 h-1 bg-text-gray rounded-full opacity-30"/>
      <span className="text-accent/80">Global V4.2</span>
     </div>
    </div>
    <button 
     onClick={handleSave}
     disabled={refreshing}
     className={`w-full lg:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-accent text-white rounded-xl text-[0.8rem] sm:text-[0.85rem] font-black uppercase tracking-widest cursor-pointer hover:opacity-90 shadow-premium transition-all shrink-0
      ${refreshing ? 'opacity-50 cursor-wait' : ''}`}
    >
     {refreshing ? <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-spin"/> : <Save className="w-4 h-4 sm:w-4.5 sm:h-4.5"/>}
     Synchronize Matrix
    </button>
   </div>

   <div className="grid lg:grid-cols-4 gap-8">
    {/* Navigation Sidebar */}
    {/* Navigation - Sidebar on desktop, Scrollable strip on mobile */}
    <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
     {tabs.map((tab) => (
      <button
       key={tab.id}
       onClick={() => setActiveTab(tab.id)}
       className={`flex-1 min-w-[140px] lg:min-w-0 flex items-center justify-between px-4 lg:px-6 py-3 lg:py-5 rounded-xl transition-all group shrink-0
        ${activeTab === tab.id 
         ? 'bg-card text-accent shadow-premium border border-border lg:scale-[1.02]' 
         : 'text-text-gray hover:bg-card/40 hover:text-text-dark'}`}
      >
       <div className="flex items-center gap-3 lg:gap-4">
        <tab.icon className={`w-4 h-4 lg:w-5 lg:h-5 transition-colors ${activeTab === tab.id ? 'text-accent' : 'text-text-gray group-hover:text-text-dark'}`} />
        <span className="text-[0.8rem] lg:text-[0.9rem] font-bold whitespace-nowrap">{tab.title}</span>
       </div>
       <ChevronRight className={`hidden lg:block w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity ${activeTab === tab.id && 'opacity-100'}`} />
      </button>
     ))}
    </div>

    {/* Content Section */}
    <div className="lg:col-span-3 space-y-6">
     <div className="bg-card rounded-2xl border border-border shadow-premium overflow-hidden min-h-[600px] flex flex-col">
      
      {activeTab === 'profile' && (
       <div className="p-6 sm:p-10 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 border-b border-border pb-8 sm:pb-10">
         <div className="relative group">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl border-4 border-card group-hover:scale-[1.02] transition-transform">
           {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
          </div>
         </div>
         <div className="text-center sm:text-left">
          <h3 className="text-lg sm:text-[1.3rem] font-black text-text-dark uppercase tracking-tight">{user?.role ? user.role.replace('_', ' ').toUpperCase() : 'System Administrator'}</h3>
          <p className="text-[0.75rem] sm:text-[0.85rem] text-text-gray font-bold">Terminal Identity: #{user?.id || '1024'}</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-lg text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-widest border border-success/20">
           <Shield className="w-3 h-3"/> Matrix Verified
          </div>
         </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-x-10 sm:gap-y-8">
         <div className="flex flex-col gap-2">
          <label className="text-[0.6rem] sm:text-[0.65rem] font-black text-text-gray uppercase tracking-widest ml-1">Supervisor Full Name</label>
          <input 
           type="text"
           placeholder="Enter full name"
           value={profileData.name} 
           onChange={(e) => setProfileData({...profileData, name: e.target.value})}
           className="bg-bg/50 border border-border focus:border-accent rounded-xl px-4 sm:px-5 py-3 sm:py-4 text-[0.85rem] sm:text-[0.9rem] font-bold text-text-dark outline-none transition-all focus:bg-card focus:shadow-premium"
          />
         </div>
         <div className="flex flex-col gap-2">
          <label className="text-[0.6rem] sm:text-[0.65rem] font-black text-text-gray uppercase tracking-widest ml-1">Secure Email Node</label>
          <input 
           type="email"
           placeholder="admin@matrix.local"
           value={profileData.email} 
           onChange={(e) => setProfileData({...profileData, email: e.target.value})}
           className="bg-bg/50 border border-border focus:border-accent rounded-xl px-4 sm:px-5 py-3 sm:py-4 text-[0.85rem] sm:text-[0.9rem] font-bold text-text-dark outline-none transition-all focus:bg-card focus:shadow-premium"
          />
         </div>
        </div>
       </div>
      )}

      {activeTab === 'security' && (
       <div className="p-6 sm:p-10 space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-400 flex flex-col items-center">
        <div className="text-center space-y-2 border-b border-border pb-6 sm:pb-8 w-full max-w-lg">
         <h3 className="text-lg sm:text-[1.4rem] font-black text-text-dark uppercase tracking-tight">Access Credentials</h3>
         <p className="text-[0.75rem] sm:text-[0.85rem] text-text-gray font-bold">Update your secure matrix password and authentication nodes.</p>
        </div>

        <div className="w-full max-w-md space-y-6 sm:space-y-8">
         <div className="flex flex-col gap-2 sm:gap-3">
          <label className="text-[0.65rem] sm:text-[0.7rem] font-black text-text-gray uppercase tracking-widest ml-1">Current Password</label>
          <div className="relative group">
           <input 
            type={showPasswords.current ?"text":"password"} 
            placeholder="••••••••••••"
            value={passwordData.current}
            onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
            className="w-full bg-bg/50 border border-border focus:border-accent rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4.5 text-[0.9rem] sm:text-[0.95rem] font-bold text-text-dark outline-none transition-all focus:bg-card focus:shadow-premium pr-14"
           />
           <button 
            onClick={() => togglePassword('current')}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-text-gray/40 hover:text-accent transition-colors"
           >
            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
           </button>
          </div>
         </div>

         <div className="flex flex-col gap-3">
          <label className="text-[0.7rem] font-black text-text-gray uppercase tracking-widest ml-1">New Secure Password</label>
          <div className="relative group">
           <input 
            type={showPasswords.new ?"text":"password"} 
            placeholder="Min. 8 characters"
            value={passwordData.new}
            onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
            className="w-full bg-bg/50 border border-border focus:border-accent rounded-2xl px-6 py-4.5 text-[0.95rem] font-bold text-text-dark outline-none transition-all focus:bg-card focus:shadow-premium pr-14"
           />
           <button 
            onClick={() => togglePassword('new')}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-text-gray/40 hover:text-accent transition-colors"
           >
            {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
           </button>
          </div>
         </div>

         <div className="flex flex-col gap-3">
          <label className="text-[0.7rem] font-black text-text-gray uppercase tracking-widest ml-1">Confirm New Password</label>
          <div className="relative group">
           <input 
            type={showPasswords.confirm ?"text":"password"} 
            placeholder="Repeat new password"
            value={passwordData.confirm}
            onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
            className="w-full bg-bg/50 border border-border focus:border-accent rounded-2xl px-6 py-4.5 text-[0.95rem] font-bold text-text-dark outline-none transition-all focus:bg-card focus:shadow-premium pr-14"
           />
           <button 
            onClick={() => togglePassword('confirm')}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-text-gray/40 hover:text-accent transition-colors"
           >
            {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
           </button>
          </div>
         </div>

         <button 
          onClick={handlePasswordUpdate}
          disabled={refreshing}
          className={`w-full py-4 sm:py-5 bg-accent text-white rounded-2xl text-[0.85rem] sm:text-[0.9rem] font-black uppercase tracking-widest hover:opacity-90 shadow-premium transition-all mt-4 sm:mt-6
           ${refreshing ? 'opacity-50 cursor-wait' : ''}`}
         >
          {refreshing ? 'Updating Matrix...' : 'Update Password'}
         </button>
        </div>
       </div>
      )}

      {activeTab === 'camera' && (
       <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
        <div className="border-b border-border pb-4 sm:pb-6">
         <h3 className="text-lg sm:text-[1.1rem] font-black text-text-dark uppercase tracking-tight mb-1">Visual Intelligence</h3>
         <p className="text-[0.75rem] sm:text-[0.8rem] text-text-gray font-bold">Configure how AI models interact with raw camera streams.</p>
        </div>
        <div className="grid gap-3 sm:gap-4">
         {[
          { id: 'neuralStream', title: 'Neural Stream 4K', desc: 'Enable Ultra-HD AI analysis on supported optics', icon: Monitor },
          { id: 'edgeRedundancy', title: 'Edge Redundancy', desc: 'Secure local storage during network latency spikes', icon: Database },
          { id: 'publicBroadcast', title: 'Public Web Broadcast', desc: 'Allow encrypted streaming to authorized external nodes', icon: Globe },
          { id: 'privacyShield', title: 'Privacy Shielding', desc: 'Auto-mask faces in archive except during crisis alerts', icon: Lock },
         ].map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 sm:p-6 bg-bg/40 rounded-xl border border-border hover:bg-bg transition-colors group">
           <div className="flex gap-4 sm:gap-5 items-center min-w-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0
             ${cameraSettings[item.id] ? 'bg-accent/10 text-accent' : 'bg-card text-text-gray'}`}>
             <item.icon className="w-5 h-5 sm:w-6 sm:h-6"/>
            </div>
            <div className="min-w-0">
             <p className="text-[0.9rem] sm:text-[1rem] font-black text-text-dark tracking-tight truncate">{item.title}</p>
             <p className="text-[0.7rem] sm:text-[0.75rem] text-text-gray font-bold truncate opacity-70">{item.desc}</p>
            </div>
           </div>
           <button 
            onClick={() => setCameraSettings({...cameraSettings, [item.id]: !cameraSettings[item.id]})}
            className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full relative transition-all duration-300 shadow-inner shrink-0
            ${cameraSettings[item.id] ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all duration-300
             ${cameraSettings[item.id] ? 'left-5 sm:left-7 shadow-md' : 'left-1'}`} />
           </button>
          </div>
         ))}
        </div>
       </div>
      )}

      {activeTab === 'storage' && (
       <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
        <div className="border-b border-border pb-6">
         <h3 className="text-[1.1rem] font-black text-text-dark uppercase tracking-tight mb-1">Archive & Data Storage</h3>
         <p className="text-[0.8rem] text-text-gray font-bold">Manage detection history and server storage capacity.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
         <div className="space-y-4">
          <label className="text-[0.65rem] font-black text-text-gray uppercase tracking-widest ml-1">Event Retention Period</label>
          <div className="flex items-center gap-4">
           <input 
            type="range"min="1"max="365"
            value={storageSettings.retentionDays}
            onChange={(e) => setStorageSettings({...storageSettings, retentionDays: parseInt(e.target.value)})}
            className="flex-1 accent-accent"
           />
           <span className="text-[0.9rem] font-black text-accent min-w-[60px] text-right">{storageSettings.retentionDays} Days</span>
          </div>
         </div>

         <div className="space-y-4">
          <label className="text-[0.65rem] font-black text-text-gray uppercase tracking-widest ml-1">Archive Compression</label>
          <div className="grid grid-cols-3 gap-2">
           {['low', 'medium', 'high'].map(lvl => (
            <button 
             key={lvl}
             onClick={() => setStorageSettings({...storageSettings, compression: lvl})}
             className={`py-2.5 rounded-lg border text-[0.7rem] font-black uppercase tracking-wider transition-all
              ${storageSettings.compression === lvl ? 'bg-accent text-white border-accent shadow-premium' : 'bg-bg text-text-gray border-border hover:border-text-gray'}`}
            >
             {lvl}
            </button>
           ))}
          </div>
         </div>
        </div>

        <div className="p-6 bg-accent/5 rounded-xl border border-accent/10 space-y-4">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
           <Database className="w-5 h-5 text-accent"/>
           <p className="text-[0.9rem] font-bold text-text-dark">Auto-Purge Matrix</p>
          </div>
          <button 
           onClick={() => setStorageSettings({...storageSettings, autoPurge: !storageSettings.autoPurge})}
           className={`w-12 h-6 rounded-full relative transition-all duration-300
           ${storageSettings.autoPurge ? 'bg-accent' : 'bg-border'}`}>
           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300
            ${storageSettings.autoPurge ? 'left-7' : 'left-1'}`} />
          </button>
         </div>
         <p className="text-[0.75rem] text-text-gray font-semibold">Automatically clear data when storage exceeds 90% capacity to maintain neural performance.</p>
        </div>
       </div>
      )}

      {activeTab === 'notifications' && (
       <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
        <div className="border-b border-border pb-4 sm:pb-6">
         <h3 className="text-lg sm:text-[1.1rem] font-black text-text-dark uppercase tracking-tight mb-1">Alert Preferences</h3>
         <p className="text-[0.75rem] sm:text-[0.8rem] text-text-gray font-bold">Control how you receive critical system notifications.</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
         {[
          { id: 'emailAlerts', title: 'Secure Email Alerts', icon: Globe },
          { id: 'desktopPush', title: 'Desktop Matrix Notifications', icon: Monitor },
          { id: 'audioCues', title: 'Audio Neural Cues', icon: Zap },
          { id: 'criticalOnly', title: 'Critical Severity Only', icon: Shield },
         ].map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 sm:p-5 bg-bg/30 rounded-xl border border-border group hover:bg-bg/50 transition-all">
           <div className="flex items-center gap-3 sm:gap-4">
            <item.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-text-gray group-hover:text-accent transition-colors shrink-0"/>
            <span className="text-[0.85rem] sm:text-[0.9rem] font-bold text-text-dark">{item.title}</span>
           </div>
           <button 
            onClick={() => setAlertSettings({...alertSettings, [item.id]: !alertSettings[item.id]})}
            className={`w-9 sm:w-10 h-4.5 sm:h-5 rounded-full relative transition-all duration-300 shrink-0
            ${alertSettings[item.id] ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-3.5 sm:w-4 h-3.5 sm:h-4 bg-white rounded-full transition-all duration-300
             ${alertSettings[item.id] ? 'left-5 sm:left-5.5' : 'left-0.5'}`} />
           </button>
          </div>
         ))}
        </div>
       </div>
      )}
     </div>

     <div className="bg-gradient-to-r from-accent/10 to-transparent p-4 sm:p-6 rounded-2xl border border-accent/20 flex flex-col sm:flex-row justify-between items-center gap-4 group">
      <div className="flex items-center gap-4 w-full sm:w-auto">
       <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-black text-sm shrink-0">AI</div>
       <div>
        <p className="text-[0.8rem] sm:text-[0.85rem] font-black text-text-dark">Auto-Optimization Matrix</p>
        <p className="text-[0.6rem] sm:text-[0.65rem] text-text-gray font-bold uppercase tracking-widest">System is self-tuning based on usage</p>
       </div>
      </div>
      <div className="flex items-center gap-2 text-[0.75rem] sm:text-[0.8rem] font-extrabold text-accent self-end sm:self-center">
        Enabled <Check className="w-4 h-4"/>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}
