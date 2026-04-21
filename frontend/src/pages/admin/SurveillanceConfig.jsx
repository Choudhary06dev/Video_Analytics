import React from 'react';
import { 
  Cctv, 
  Plus, 
  Map, 
  Settings2, 
  Cpu, 
  Video,
  Layers,
  Search,
  MoreVertical
} from 'lucide-react';

export default function SurveillanceConfig() {
  const cameras = [
    { id: 1, name: 'Main Entrance - Cam 01', zone: 'Restricted Entry', status: 'Online', source: 'rtsp://192.168.1.10:554/live' },
    { id: 2, name: 'ER Reception - Cam 02', zone: 'High Traffic', status: 'Online', source: 'rtsp://192.168.1.11:554/live' },
    { id: 3, name: 'Pharmacy - Cam 03', zone: 'Secure Storage', status: 'Online', source: 'rtsp://192.168.1.12:554/live' },
    { id: 4, name: 'Main Corridor - Cam 04', zone: 'Public Area', status: 'Reconnecting', source: 'rtsp://192.168.1.13:554/live' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Surveillance <span className="text-accent underline decoration-accent/20 underline-offset-8">Registry</span>
          </h1>
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.4em] mt-3">
            Hardware Abstraction & Zone Mapping
          </p>
        </div>

        <div className="flex gap-4">
            <button className="flex items-center gap-3 bg-white/5 border border-white/10 text-white/60 px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all hover:bg-white/10 hover:text-white">
                <Map className="w-4 h-4" />
                Edit Mapping
            </button>
            <button className="flex items-center gap-3 bg-accent text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-accent/20 hover:-translate-y-1 active:translate-y-0">
                <Plus className="w-4 h-4" />
                Initialize New Feed
            </button>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
            { label: 'Active Streams', value: '4/4', icon: Video, color: 'text-accent' },
            { label: 'Deployed Zones', value: '8', icon: Layers, color: 'text-emerald-400' },
            { label: 'AI Inference Load', value: '62%', icon: Cpu, color: 'text-amber-400' },
        ].map((stat, i) => (
            <div key={i} className="bg-[#0f0f12] border border-white/5 rounded-lg p-6 flex items-center gap-6">
                <div className={`p-4 bg-white/5 border border-white/10 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                </div>
            </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-[#0f0f12] border border-white/5 rounded-lg overflow-hidden shadow-2xl">
         <div className="px-8 py-7 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-white">
               <Cctv className="w-5 h-5 text-accent" />
               Hardware Registry Ledger
            </h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input 
                    type="text" 
                    placeholder="Filter nodes..." 
                    className="bg-black/40 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-accent/40 w-48"
                />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-white/30">Node ID</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-white/30">Feed Designation</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-white/30">Assigned Zone</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-white/30">Stream Source</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-white/30">Status</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.1em] text-white/30 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {cameras.map((cam) => (
                        <tr key={cam.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-all group/row">
                            <td className="py-6 px-8 text-[10px] font-bold text-white/20 italic">#{cam.id.toString().padStart(3, '0')}</td>
                            <td className="py-6 px-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                                        <Video className="w-4 h-4 text-accent" />
                                    </div>
                                    <span className="text-sm font-black text-white">{cam.name}</span>
                                </div>
                            </td>
                            <td className="py-6 px-8">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                                    {cam.zone}
                                </span>
                            </td>
                            <td className="py-6 px-8 text-[10px] font-mono text-white/30">{cam.source}</td>
                            <td className="py-6 px-8">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${cam.status === 'Online' ? 'text-emerald-500' : 'text-amber-500'}`}>{cam.status}</span>
                                </div>
                            </td>
                            <td className="py-6 px-8 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all">
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>

         <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">End of Hardware Registry Ledger</p>
         </div>
      </div>
    </div>
  );
}
