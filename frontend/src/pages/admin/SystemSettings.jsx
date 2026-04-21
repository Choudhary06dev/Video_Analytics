import React, { useState } from 'react';
import { 
  Settings, 
  Cpu, 
  Bell, 
  Database, 
  ShieldAlert, 
  Eye, 
  Zap, 
  Globe, 
  Lock, 
  Save, 
  RefreshCw,
  Sliders
} from 'lucide-react';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('platform');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500); // Simulated save
  };

  const SectionHeader = ({ icon: Icon, title, desc }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
            <Icon className="w-5 h-5 text-accent" />
        </div>
        <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-text-dark">{title}</h3>
            <p className="text-[9px] font-bold text-text-gray uppercase tracking-widest mt-0.5">{desc}</p>
        </div>
    </div>
  );

  const Toggle = ({ label, desc, enabled }) => (
    <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg group hover:border-accent/30 transition-all shadow-sm">
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-dark">{label}</p>
            <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest mt-0.5">{desc}</p>
        </div>
        <button className={`w-10 h-5 rounded-full transition-all relative ${enabled ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-700'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${enabled ? 'right-0.5' : 'left-0.5'}`}></div>
        </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pb-20">
      
      {/* Page Header (Scaled Down) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
                <Sliders className="w-7 h-7 text-accent font-black" />
            </div>
            <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark">
                    Engine <span className="text-accent underline decoration-accent/20 underline-offset-4">Console</span>
                </h1>
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                    Global Parameters // Architecture Control
                </p>
            </div>
        </div>

        <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-accent text-white px-8 py-3 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Syncing...' : 'Sync Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar (Scaled Down) */}
        <div className="lg:col-span-3 space-y-1.5">
            {[
                { id: 'platform', name: 'Platform Core', icon: Globe },
                { id: 'vision', name: 'Vision Engine', icon: Eye },
                { id: 'storage', name: 'Temporal Grid', icon: Database },
                { id: 'security', name: 'Security Protocol', icon: Lock },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left group
                        ${activeTab === tab.id 
                            ? 'bg-accent/10 border-accent/20 text-accent font-bold' 
                            : 'bg-card border-border text-text-gray hover:bg-surface hover:text-text-dark'}`}
                >
                    <tab.icon className={`w-4.5 h-4.5 transition-transform group-hover:scale-110`} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.name}</span>
                </button>
            ))}
        </div>

        {/* Content Area (Scaled Down) */}
        <div className="lg:col-span-9 bg-card border border-border rounded-lg p-8 shadow-sm">
            {activeTab === 'platform' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <SectionHeader icon={Globe} title="Regional Distribution" desc="Manage global edge nodes and deployment regions" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Toggle label="Maintenance Mode" desc="Enable global redirect" enabled={false} />
                        <Toggle label="Debug Overlays" desc="Show internal metrics" enabled={true} />
                        <Toggle label="Public Enrollment" desc="Allow self-service identity" enabled={false} />
                        <Toggle label="Cluster Sync" desc="Automated DB replication" enabled={true} />
                    </div>
                    
                    <div className="space-y-3 pt-6 border-t border-border">
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-gray">Primary Engine Region</label>
                        <select className="w-full bg-surface border border-border rounded-lg px-5 py-3 text-[11px] font-bold text-text-dark outline-none focus:border-accent transition-all appearance-none tracking-widest">
                            <option>NORTH AMERICAN NEXUS // 01</option>
                            <option>EUROPEAN GRID // 02</option>
                            <option>ASIAN PERIMETER // 03</option>
                        </select>
                    </div>
                </div>
            )}

            {activeTab === 'vision' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <SectionHeader icon={Eye} title="Neural Perception" desc="Fine-tune AI inference thresholds" />
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[9px] font-black tracking-widest text-text-gray uppercase">
                                <span>Global Confidence Threshold</span>
                                <span className="text-accent">65%</span>
                            </div>
                            <div className="h-1.5 bg-surface rounded-full">
                                <div className="h-full w-[65%] bg-accent rounded-full transition-all duration-1000"></div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[9px] font-black tracking-widest text-text-gray uppercase">
                                <span>Motion Sensitivity Alpha</span>
                                <span className="text-accent">82%</span>
                            </div>
                            <div className="h-1.5 bg-surface rounded-full">
                                <div className="h-full w-[82%] bg-accent rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(14,165,233,0.3)]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'storage' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <SectionHeader icon={Database} title="Storage Lifecycle" desc="Archive management" />
                    <div className="p-6 bg-surface border border-border rounded-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-dark">Cleanup: Daily @ 03:00</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Audit Logs', val: '90D' },
                                { label: 'Video Clips', val: '14D' },
                                { label: 'Metadata', val: '30D' },
                            ].map((s, i) => (
                                <div key={i} className="text-center p-3 border border-border/50 rounded-lg bg-card">
                                    <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest mb-1">{s.label}</p>
                                    <p className="text-xs font-black italic text-text-dark">{s.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <SectionHeader icon={Lock} title="Priority Protocols" desc="Auth rules" />
                    <div className="grid grid-cols-1 gap-3">
                        <Toggle label="Force Multi-Factor" desc="Required for all admins" enabled={true} />
                        <Toggle label="IP Restriction Table" desc="Authorized range only" enabled={false} />
                        <Toggle label="Session Hardening" desc="Auto-terminate after 15m" enabled={true} />
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
