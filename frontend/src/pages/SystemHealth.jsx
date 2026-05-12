import React, { useState, useEffect, useRef } from 'react';
import {
 Cpu,
 Activity,
 HardDrive,
 Globe,
 ShieldCheck,
 Database,
 Terminal,
 AlertCircle,
 CheckCircle2,
 RefreshCw,
 Search
} from 'lucide-react';
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer
} from 'recharts';
import { fetchHealthStats } from '../services/healthService';

export default function SystemHealth() {
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 const getHealth = async () => {
  try {
   const res = await fetchHealthStats();
   setData(res);
   setLoading(false);
  } catch (err) {
   console.error("Failed to fetch health intel:", err);
  }
 };

 useEffect(() => {
  getHealth();
  const interval = setInterval(getHealth, 5000);
  return () => clearInterval(interval);
 }, []);

 if (loading || !data) {
  return (
   <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-gray animate-pulse">Scanning System Integrity...</p>
   </div>
  );
 }

 const { metrics, cameras, compliance, chart_data } = data;

 return (
  <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
   {/* Page Header */}
   <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 px-2">
    <div className="min-w-0">
     <h2 className="text-xl sm:text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">System Health</h2>
     <div className="text-[0.8rem] sm:text-[0.9rem] text-text-gray font-semibold flex items-center gap-2 flex-wrap">
      Vision Core Diagnostics Matrix
      <span className="hidden sm:block w-1 h-1 bg-text-gray rounded-full opacity-30"/>
      <span className="text-accent">{metrics.uptime} Uptime Observed</span>
     </div>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
     <div className="flex-1 sm:flex-none justify-center bg-success/10 text-success px-4 py-2.5 sm:py-2 rounded-lg text-[0.7rem] sm:text-[0.75rem] font-black shadow-sm flex items-center gap-2 border border-success/20 uppercase tracking-widest">
      <ShieldCheck className="w-4 h-4 shrink-0"/>
      Secure
     </div>
     <button
      onClick={getHealth}
      className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-card text-text-dark border border-border rounded-lg text-[0.7rem] sm:text-[0.75rem] font-bold cursor-pointer hover:border-accent hover:text-accent shadow-sm transition-all"
     >
      <RefreshCw className="w-4 h-4 shrink-0"/>
      Refresh
     </button>
    </div>
   </div>

   {/* HW Stats Row */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
    {[
     { label: 'CPU Load', value: metrics.cpu_load, icon: Cpu, color: 'text-accent', bg: 'bg-accent/10' },
     { label: 'RAM Usage', value: metrics.ram_usage.split(' /')[0], icon: Database, color: 'text-danger', bg: 'bg-danger/10' },
     { label: 'Storage Usage', value: metrics.disk_usage, icon: HardDrive, color: 'text-warning', bg: 'bg-warning/10' },
     { label: 'Nodes Online', value: cameras.ratio, icon: Globe, color: 'text-success', bg: 'bg-success/10' },
    ].map((s, i) => (
     <div key={i} className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-premium flex items-center gap-4 sm:gap-5 hover:-translate-y-1 transition-all group min-w-0">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
       <s.icon className="w-6 h-6 sm:w-7 sm:h-7"/>
      </div>
      <div className="min-w-0">
       <p className="text-2xl sm:text-[1.8rem] font-black text-text-dark mb-0.5 leading-none truncate">{s.value}</p>
       <p className="text-[0.65rem] sm:text-[0.75rem] font-bold text-text-gray uppercase tracking-wider truncate">{s.label}</p>
      </div>
     </div>
    ))}
   </div>

   {/* Chart Row */}
   <div className="w-full">
    <div className="bg-card rounded-lg p-4 sm:p-8 border border-border shadow-premium flex flex-col h-[350px] sm:h-[450px]">
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
      <h3 className="text-lg sm:text-[1.1rem] font-bold text-text-dark m-0 uppercase tracking-tight">Resource Monitoring Matrix</h3>
      <div className="flex gap-4 sm:gap-6 flex-wrap">
       {['CPU', 'Memory', 'Network'].map((t, idx) => (
        <div key={t} className="flex items-center gap-2">
         <div className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${idx === 0 ? 'bg-accent' : idx === 1 ? 'bg-success' : 'bg-warning'}`} />
         <span className="text-[0.6rem] sm:text-[0.65rem] font-extrabold text-text-gray uppercase tracking-wider">{t}</span>
        </div>
       ))}
      </div>
     </div>
     <div className="w-full h-[320px] relative min-w-0">
      <ResponsiveContainer width="100%"height="100%"debounce={50}>
       <AreaChart data={chart_data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <defs>
         <linearGradient id="colorCpu"x1="0"y1="0"x2="0"y2="1">
          <stop offset="5%"stopColor="var(--color-accent)"stopOpacity={0.3} />
          <stop offset="95%"stopColor="var(--color-accent)"stopOpacity={0} />
         </linearGradient>
         <linearGradient id="colorMem"x1="0"y1="0"x2="0"y2="1">
          <stop offset="5%"stopColor="var(--color-success)"stopOpacity={0.3} />
          <stop offset="95%"stopColor="var(--color-success)"stopOpacity={0} />
         </linearGradient>
         <linearGradient id="colorNet"x1="0"y1="0"x2="0"y2="1">
          <stop offset="5%"stopColor="var(--color-warning)"stopOpacity={0.3} />
          <stop offset="95%"stopColor="var(--color-warning)"stopOpacity={0} />
         </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="var(--color-border)"opacity={0.5} />
        <XAxis
         dataKey="time"
         axisLine={false}
         tickLine={false}
         tick={{ fill: 'var(--color-text-gray)', fontSize: 11, fontWeight: 700 }}
        />
        <YAxis
         axisLine={false}
         tickLine={false}
         tick={{ fill: 'var(--color-text-gray)', fontSize: 11, fontWeight: 700 }}
         domain={[0, 100]}
        />
        <Tooltip
         content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
           return (
            <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl scale-105 transition-all">
             <p className="text-[10px] font-black text-text-gray uppercase tracking-widest mb-3 border-b border-border pb-2">{label} Diagnostics</p>
             <div className="space-y-2">
              {payload.map((entry, index) => (
               <div key={index} className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full"style={{ backgroundColor: entry.color }} />
                 <span className="text-[11px] font-bold text-text-gray uppercase">{entry.name}</span>
                </div>
                <span className="text-[12px] font-black text-text-dark">{entry.value}{entry.name === 'network' ? ' MB' : '%'}</span>
               </div>
              ))}
             </div>
            </div>
           );
          }
          return null;
         }}
        />
        <Area type="monotone"dataKey="cpu"stroke="var(--color-accent)"strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)"tension={0.4} />
        <Area type="monotone"dataKey="memory"stroke="var(--color-success)"strokeWidth={3} fillOpacity={1} fill="url(#colorMem)"tension={0.4} />
        <Area type="monotone"dataKey="network"stroke="var(--color-warning)"strokeWidth={3} fillOpacity={1} fill="url(#colorNet)"tension={0.4} />
       </AreaChart>
      </ResponsiveContainer>
     </div>
    </div>
   </div>

   {/* Zone Compliance Grid Row */}
   <div className="bg-card rounded-lg p-4 sm:p-8 border border-border shadow-premium flex flex-col">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
     <div>
      <h3 className="text-lg sm:text-[1.1rem] font-bold text-text-dark uppercase tracking-tight m-0">Zone Compliance Matrix</h3>
      <p className="text-[0.65rem] sm:text-[0.7rem] text-text-gray font-bold uppercase tracking-wider mt-1">Real-time safety integrity per sector (24 Hours)</p>
     </div>

     <div className="relative w-full lg:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray"/>
      <input
       type="text"
       placeholder="Search specific zone..."
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
       className="w-full bg-bg border border-border rounded-lg py-2.5 pl-10 pr-4 text-[0.8rem] sm:text-[0.85rem] font-bold text-text-dark focus:outline-none focus:border-accent transition-all shadow-sm"
      />
     </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
     {compliance
      .filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((sector, i) => (
       <div key={i} className="group p-4 bg-bg/50 rounded-xl border border-border hover:border-accent transition-all duration-300">
        <div className="flex justify-between items-center mb-3">
         <span className="text-[0.75rem] sm:text-[0.8rem] font-black text-text-dark uppercase tracking-tight truncate pr-2">{sector.name}</span>
         <span className={`text-[0.85rem] sm:text-[0.9rem] font-black ${sector.score >= 95 ? 'text-success' : 'text-accent'}`}>{sector.score}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
         <div
          className={`h-full rounded-full transition-all duration-[1.5s] ease-out ${sector.score >= 95 ? 'bg-success' : 'bg-accent'}`}
          style={{ width:`${sector.score}%`}}
         />
        </div>
        <div className="flex justify-between opacity-80">
         <span className="text-[0.55rem] sm:text-[0.6rem] font-bold text-text-gray">📈 {sector.trend}</span>
         <span className={`text-[0.55rem] sm:text-[0.6rem] font-black ${sector.score >= 95 ? 'text-success' : 'text-accent'} uppercase tracking-wider`}>{sector.status}</span>
        </div>
       </div>
      ))}

     {compliance.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
      <div className="col-span-full py-10 text-center">
       <p className="text-[0.8rem] font-bold text-text-gray uppercase tracking-widest">No zones found matching: {searchTerm}</p>
      </div>
     )}
    </div>
   </div>
  </div>
 );
}
