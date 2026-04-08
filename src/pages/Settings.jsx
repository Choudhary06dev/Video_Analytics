import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">Platform Settings</h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            System Configuration & Credentials
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            Global V4.2
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl text-[0.85rem] font-bold cursor-pointer hover:opacity-90 shadow-premium transition-all">
          <Save className="w-4.5 h-4.5" />
          Synchronize Changes
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group
                ${activeTab === tab.id 
                  ? 'bg-card text-accent shadow-premium border border-border' 
                  : 'text-text-gray hover:bg-card/50 hover:text-text-dark'}`}
            >
              <div className="flex items-center gap-4">
                <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-accent' : 'text-text-gray group-hover:text-text-dark'}`} />
                <span className="text-[0.88rem] font-bold">{tab.title}</span>
              </div>
              <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity ${activeTab === tab.id && 'opacity-100'}`} />
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-[28px] border border-border shadow-premium overflow-hidden min-h-[500px]">
            {activeTab === 'profile' && (
              <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="flex items-center gap-8 border-b border-border pb-10">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center text-white font-black text-3xl shadow-xl border-4 border-card group-hover:scale-[1.02] transition-transform">
                      AD
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2.5 bg-card border border-border text-text-dark rounded-xl shadow-lg hover:text-accent transition-all">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-[1.2rem] font-black text-text-dark uppercase tracking-tight">System Administrator</h3>
                    <p className="text-[0.85rem] text-text-gray font-bold">Master Operator • Full Access Credentials</p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-lg text-[0.65rem] font-black uppercase tracking-widest border border-success/20">
                      <Shield className="w-3 h-3" /> Identity Verified
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] font-black text-text-gray uppercase tracking-widest ml-1">Supervisor Full Name</label>
                    <input type="text" defaultValue="Admin User" className="bg-bg border border-border focus:border-accent rounded-xl px-5 py-3.5 text-[0.85rem] font-bold text-text-dark outline-none transition-all shadow-inner" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] font-black text-text-gray uppercase tracking-widest ml-1">Email Terminal</label>
                    <input type="email" defaultValue="admin@sentinel.ai" className="bg-bg border border-border focus:border-accent rounded-xl px-5 py-3.5 text-[0.85rem] font-bold text-text-dark outline-none transition-all shadow-inner" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] font-black text-text-gray uppercase tracking-widest ml-1">Assigned Division</label>
                    <input type="text" readOnly defaultValue="Global Security Operations" className="bg-bg/50 border border-border text-text-gray/60 rounded-xl px-5 py-3.5 text-[0.85rem] font-bold outline-none cursor-not-allowed italic" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] font-black text-text-gray uppercase tracking-widest ml-1">Regional Matrix</label>
                    <select className="bg-bg border border-border focus:border-accent rounded-xl px-5 py-3.5 text-[0.85rem] font-bold text-text-dark outline-none transition-all appearance-none cursor-pointer shadow-inner">
                      <option>Pacific Sector (UTC-8)</option>
                      <option>European Cluster (UTC+1)</option>
                      <option>Asian Hub (UTC+8)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'camera' && (
              <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="grid gap-4">
                  {[
                    { title: 'Neural Stream 4K', desc: 'Enable Ultra-HD AI analysis on supported optics', icon: Monitor, enabled: true },
                    { title: 'Edge Redundancy', desc: 'Secure local storage during network latency spikes', icon: Database, enabled: true },
                    { title: 'Public Web Broadcast', desc: 'Allow encrypted streaming to authorized external nodes', icon: Globe, enabled: false },
                    { title: 'Privacy Shielding', desc: 'Auto-mask faces in archive except during crisis alerts', icon: Lock, enabled: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-bg/40 rounded-3xl border border-border hover:bg-bg transition-colors group">
                      <div className="flex gap-5 items-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm
                          ${item.enabled ? 'bg-accent/10 text-accent' : 'bg-card text-text-gray'}`}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[0.95rem] font-black text-text-dark tracking-tight">{item.title}</p>
                          <p className="text-[0.75rem] text-text-gray font-bold line-clamp-1 opacity-70">{item.desc}</p>
                        </div>
                      </div>
                      <button className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner
                        ${item.enabled ? 'bg-accent' : 'bg-border'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300
                          ${item.enabled ? 'left-7 shadow-md' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab !== 'profile' && activeTab !== 'camera' && (
              <div className="py-32 text-center flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center text-text-gray/20 border border-border shadow-inner">
                  <Zap className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-[1.1rem] font-black text-text-dark uppercase tracking-tight">Configuration Module</p>
                  <p className="text-[0.85rem] text-text-gray font-bold italic">Detailed tuning for "{tabs.find(t => t.id === activeTab).title}" is initializing...</p>
                </div>
                <button className="mt-4 px-6 py-2.5 bg-bg border border-border rounded-xl text-[0.75rem] font-black uppercase text-accent hover:border-accent transition-all">
                   Prioritize Build
                </button>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-accent/10 to-transparent p-6 rounded-[24px] border border-accent/20 flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-black text-sm">AI</div>
              <div>
                <p className="text-[0.85rem] font-black text-text-dark">Auto-Optimization Matrix</p>
                <p className="text-[0.65rem] text-text-gray font-bold uppercase tracking-widest">System is self-tuning based on usage</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[0.8rem] font-extrabold text-accent">
               Enabled <Check className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
