import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Settings, 
  Cpu, 
  Database, 
  ShieldAlert, 
  Eye, 
  Zap, 
  Globe, 
  Lock, 
  Save, 
  RefreshCw, 
  Activity, 
  Server, 
  Cloud, 
  HardDrive, 
  ShieldCheck, 
  Radio, 
  Terminal,
  ChevronRight,
  User,
  Power,
  Layers,
  Monitor
} from 'lucide-react';

export default function SystemSettings() {
  const { addNotification } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  // Consolidated System State
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    debugMode: true,
    publicEnrollment: false,
    clusterSync: true,
    region: 'South Asia (PK-1)',
    confidenceThreshold: 75,
    motionSensitivity: 80,
    neuralOptimizer: true,
    edgeProcessing: true,
    retentionLogs: 90,
    retentionVideo: 30,
    retentionMetadata: 180,
    autoPurge: true,
    mfaRequired: true,
    ipLockdown: false,
    sessionTimeout: 60,
    threatAlerts: true
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setRefreshing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
    
    addNotification({
      type: 'success',
      title: 'Matrix Synchronized',
      message: 'System configurations have been globally deployed.'
    });
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-text-dark">{title}</h3>
        <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.2em]">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Page Header - Matched to SurveillanceConfig style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-text-dark font-sans truncate">
              System <span className="text-accent underline decoration-accent/20 underline-offset-4">Orchestrator</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold text-text-gray uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-1.5 flex items-center gap-2 truncate">
              Global Platform Configuration & AI Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
            <button 
                onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }}
                disabled={refreshing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 bg-surface border border-border text-text-gray px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-black uppercase tracking-widest text-[9px] sm:text-[11px] transition-all hover:bg-border hover:text-text-dark"
            >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Check Health
            </button>
            <button 
                onClick={handleSave}
                disabled={refreshing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 bg-accent text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-black uppercase tracking-widest text-[9px] sm:text-[11px] transition-all shadow-md shadow-accent/20 hover:-translate-y-1 active:translate-y-0"
            >
                {refreshing ? <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                Deploy
            </button>
        </div>
      </div>

      {/* Stats Quick Grid - Matched style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
            { label: 'System Uptime', value: '99.98%', icon: Activity, color: 'text-accent' },
            { label: 'Active Clusters', value: '12/12', icon: Server, color: 'text-emerald-500' },
            { label: 'Neural Load', value: '28%', icon: Cpu, color: 'text-amber-500' },
            { label: 'Storage Node', value: 'Ready', icon: HardDrive, color: 'text-purple-500' },
        ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6 shadow-sm text-center sm:text-left min-w-0">
                <div className={`p-3 sm:p-4 bg-surface border border-border rounded-lg ${stat.color} shrink-0`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-text-gray mb-1 truncate">{stat.label}</p>
                    <p className={`text-lg sm:text-2xl font-black italic ${stat.color} truncate`}>{stat.value}</p>
                </div>
            </div>
        ))}
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Platform Core */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-8 shadow-sm">
          <SectionHeader icon={Globe} title="Platform Core" subtitle="Global Environment Controls" />
          
          <div className="space-y-4">
            {[
              { id: 'maintenanceMode', title: 'Maintenance Mode', desc: 'Disable public access', icon: Power },
              { id: 'debugMode', title: 'Diagnostic Overlays', desc: 'Show neural debug info', icon: Terminal },
              { id: 'publicEnrollment', title: 'Public Enrollment', desc: 'Allow new users to register', icon: User },
              { id: 'clusterSync', title: 'Real-time Cluster Sync', desc: 'Keep all edge nodes in harmony', icon: RefreshCw },
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 bg-surface/30 rounded-xl border border-border group hover:border-accent/30 transition-all">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${settings[item.id] ? 'bg-accent/10 text-accent' : 'bg-card text-text-gray'}`}>
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-black uppercase text-text-dark truncate">{item.title}</p>
                    <p className="text-[8px] sm:text-[9px] font-bold text-text-gray uppercase tracking-wider truncate">{item.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggle(item.id)}
                  className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-all duration-300 shrink-0 ${settings[item.id] ? 'bg-accent' : 'bg-border'}`}>
                  <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings[item.id] ? 'left-5.5 sm:left-7' : 'left-0.5 sm:left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Vision Intelligence */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-8 shadow-sm">
          <SectionHeader icon={Eye} title="Vision Intelligence" subtitle="AI & Neural Configuration" />
          
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-gray">Confidence Threshold</label>
                <span className="text-[11px] sm:text-xs font-black text-accent italic">{settings.confidenceThreshold}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={settings.confidenceThreshold}
                onChange={(e) => setSettings({...settings, confidenceThreshold: parseInt(e.target.value)})}
                className="w-full accent-accent bg-surface h-1.5 sm:h-2 rounded-full appearance-none cursor-pointer" 
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-gray">Motion Sensitivity</label>
                <span className="text-[11px] sm:text-xs font-black text-emerald-500 italic">{settings.motionSensitivity}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={settings.motionSensitivity}
                onChange={(e) => setSettings({...settings, motionSensitivity: parseInt(e.target.value)})}
                className="w-full accent-emerald-500 bg-surface h-1.5 sm:h-2 rounded-full appearance-none cursor-pointer" 
              />
            </div>

            <div className="pt-2 space-y-4">
              {[
                { id: 'neuralOptimizer', title: 'Neural Optimizer', icon: Zap },
                { id: 'edgeProcessing', title: 'Edge Processing', icon: Cpu },
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 bg-surface/30 rounded-xl border border-border">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-text-gray shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase text-text-dark truncate">{item.title}</span>
                  </div>
                  <button 
                    onClick={() => handleToggle(item.id)}
                    className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-all duration-300 shrink-0 ${settings[item.id] ? 'bg-accent' : 'bg-border'}`}>
                    <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings[item.id] ? 'left-5.5 sm:left-7' : 'left-0.5 sm:left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <SectionHeader icon={Database} title="Data Retention" subtitle="Temporal Storage Management" />
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { id: 'retentionLogs', label: 'Audit Logs (Days)', val: settings.retentionLogs },
              { id: 'retentionVideo', label: 'Video Clips (Days)', val: settings.retentionVideo },
            ].map(item => (
              <div key={item.id} className="p-4 bg-surface/50 border border-border rounded-xl">
                <p className="text-[9px] font-black text-text-gray uppercase tracking-widest mb-1">{item.label}</p>
                <input 
                  type="number" 
                  value={item.val}
                  onChange={(e) => setSettings({...settings, [item.id]: parseInt(e.target.value)})}
                  className="bg-transparent text-xl font-black italic text-accent outline-none w-full"
                />
              </div>
            ))}
          </div>

          <div className="p-6 bg-accent/5 rounded-xl border border-accent/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-accent" />
                <p className="text-[11px] font-black uppercase text-text-dark">Auto-Purge Engine</p>
              </div>
              <button 
                onClick={() => handleToggle('autoPurge')}
                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.autoPurge ? 'bg-accent' : 'bg-border'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.autoPurge ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <p className="text-[9px] font-bold text-text-gray uppercase leading-relaxed tracking-wider">
              Automatically decommission data when storage exceeds critical thresholds (90%+).
            </p>
          </div>
        </div>

        {/* Security Matrix */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <SectionHeader icon={ShieldAlert} title="Security Matrix" subtitle="Auth & Access Protocols" />
          
          <div className="space-y-4">
            {[
              { id: 'mfaRequired', title: 'MFA Enforcement', icon: ShieldCheck },
              { id: 'ipLockdown', title: 'Global IP Lockdown', icon: Lock },
              { id: 'threatAlerts', title: 'Threat Notifications', icon: Radio },
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-surface/30 rounded-xl border border-border hover:border-danger/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings[item.id] ? 'bg-danger/10 text-danger' : 'bg-card text-text-gray'}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-text-dark">{item.title}</span>
                </div>
                <button 
                  onClick={() => handleToggle(item.id)}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${settings[item.id] ? 'bg-danger' : 'bg-border'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings[item.id] ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}

            <div className="pt-4 flex items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray ml-1">Session Expiry (Min)</label>
                <input 
                  type="number" 
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-text-dark outline-none focus:border-accent transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="text-center text-[9px] font-black text-text-gray/40 uppercase tracking-[0.5em] pt-10">
        AI Hospital Orchestrator • Global Engine Configuration v4.2
      </div>
    </div>
  );
}
