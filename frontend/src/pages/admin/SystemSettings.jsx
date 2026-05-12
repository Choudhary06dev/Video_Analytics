import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useSystem } from '../../context/SystemContext';
import { fetchSystemSettings, updateSystemSettings } from '../../services/settingsService';
import {
  Settings,
  Globe,
  Terminal,
  User,
  RefreshCw,
  ShieldAlert,
  Activity,
  Save,
  Zap,
  RefreshCcw,
  Power,
  Database
} from 'lucide-react';

export default function SystemSettings() {
  const { addNotification } = useNotifications();
  const { refreshSettings } = useSystem();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Consolidated System State
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    publicEnrollment: true,
    clusterSync: true,
    sessionTimeout: 60,
    retentionLogs: 30,
    retentionVideo: 7,
    autoPurge: true
  });

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const settingsData = await fetchSystemSettings();
      if (settingsData) {
        setSettings({
          maintenanceMode: settingsData.maintenance_mode ?? settingsData.maintenanceMode ?? false,
          debugMode: settingsData.debug_mode ?? settingsData.debugMode ?? false,
          publicEnrollment: settingsData.public_enrollment ?? settingsData.publicEnrollment ?? true,
          clusterSync: settingsData.cluster_sync ?? settingsData.clusterSync ?? true,
          sessionTimeout: settingsData.session_timeout ?? settingsData.sessionTimeout ?? 60,
          retentionLogs: settingsData.retention_logs ?? settingsData.retentionLogs ?? 30,
          retentionVideo: settingsData.retention_video ?? settingsData.retentionVideo ?? 7,
          autoPurge: settingsData.auto_purge ?? settingsData.autoPurge ?? true
        });
      }
    } catch (err) {
      console.error("Settings fetch failed:", err);
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Could not load system configurations.'
      });
    }
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setRefreshing(true);
      await updateSystemSettings(settings);
      await refreshSettings();

      addNotification({
        type: 'success',
        title: 'Matrix Synchronized',
        message: 'System configurations have been globally deployed.'
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Deployment Failed',
        message: 'Failed to broadcast settings to cluster nodes.'
      });
    } finally {
      setRefreshing(false);
    }
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

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-gray animate-pulse">Syncing Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-text-dark font-sans truncate">
              System <span className="text-accent underline decoration-accent/20 underline-offset-4">Orchestrator</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold text-text-gray uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-1.5 flex items-center gap-2 truncate">
              Global Platform Configuration & AI Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 bg-surface border border-border text-text-gray px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-black uppercase tracking-widest text-[9px] sm:text-[11px] transition-all hover:bg-border hover:text-text-dark"
          >
            <RefreshCcw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
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
                  onChange={(e) => setSettings({ ...settings, [item.id]: parseInt(e.target.value) })}
                  className="bg-transparent text-xl font-black text-accent outline-none w-full"
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

        {/* Security & Access */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <SectionHeader icon={ShieldAlert} title="Security & Access" subtitle="Active Session Policies" />

          <div className="space-y-6">
            <div className="p-5 sm:p-6 bg-surface/50 border border-border rounded-xl group hover:border-accent/20 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
                    <Activity className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-text-dark">Neural Session Expiry</p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                    className="w-24 bg-card border-2 border-border focus:border-accent rounded-lg px-4 py-2 text-sm font-black text-center text-accent outline-none transition-all shadow-sm"
                  />
                  <span className="text-[10px] font-black text-text-gray uppercase tracking-widest">Minutes</span>
                </div>
              </div>
              <div className="flex items-start gap-2 pl-1">
                <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0 animate-pulse"></div>
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-widest leading-relaxed opacity-60">
                  Automatically terminate neural link and clear local cache after inactivity period.
                </p>
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
