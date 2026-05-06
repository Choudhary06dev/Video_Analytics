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
  RefreshCw
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
  const [logs, setLogs] = useState([
      "> Initializing CUDA context...",
      "> Found NVIDIA hardware profile",
      "> Syncing neural stream nodes...",
      "> API Gateway: Connected"
  ]);
  const logEndRef = useRef(null);

  const getHealth = async () => {
    try {
      const res = await fetchHealthStats();
      setData(res);
      setLoading(false);
      
      // Simulate real-time logs based on actual status
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newLog = `> [${time}] HEALTH_CHECK: CPU ${res.metrics.cpu_load} | CAM_ONLINE ${res.cameras.ratio} | OK`;
      
      setLogs(prev => {
        const next = [...prev, newLog];
        if (next.length > 15) next.shift();
        return next;
      });
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">System Health</h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            Vision Core Diagnostics Matrix
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            {metrics.uptime} Uptime
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-success text-white px-4 py-2 rounded-lg text-[0.75rem] font-bold shadow-md flex items-center gap-2 border border-success">
            <ShieldCheck className="w-4 h-4" />
            SECURE DEPLOYMENT
          </div>
          <button 
            onClick={getHealth}
            className="flex items-center gap-2 px-4 py-2 bg-card text-text-dark border border-border rounded-lg text-[0.75rem] font-bold cursor-pointer hover:border-accent hover:text-accent shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            AI Sync Core
          </button>
        </div>
      </div>

      {/* HW Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'CPU Load', value: metrics.cpu_load, icon: Cpu, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'RAM Usage', value: metrics.ram_usage.split(' /')[0], icon: Database, color: 'text-danger', bg: 'bg-danger/10' },
          { label: 'Storage Usage', value: metrics.disk_usage, icon: HardDrive, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Nodes Online', value: cameras.ratio, icon: Globe, color: 'text-success', bg: 'bg-success/10' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-lg p-6 border border-border shadow-premium flex items-center gap-5 hover:-translate-y-1 transition-all">
            <div className={`w-14 h-14 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
              <s.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[1.8rem] font-black text-text-dark mb-0.5">{s.value}</p>
              <p className="text-[0.75rem] font-bold text-text-gray uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart and Compliance Row */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-lg p-6 md:p-8 border border-border shadow-premium flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Resource Monitoring Matrix</h3>
            <div className="flex gap-6">
              {['CPU', 'Memory', 'Network'].map((t, idx) => (
                <div key={t} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-accent' : idx === 1 ? 'bg-success' : 'bg-warning'}`} />
                  <span className="text-[0.65rem] font-extrabold text-text-gray uppercase tracking-wider">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full h-[320px] relative min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={chart_data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
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
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
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
                <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    name="cpu"
                    stroke="var(--color-accent)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCpu)" 
                    tension={0.4}
                />
                <Area 
                    type="monotone" 
                    dataKey="memory" 
                    name="memory"
                    stroke="var(--color-success)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMem)" 
                    tension={0.4}
                />
                <Area 
                    type="monotone" 
                    dataKey="network" 
                    name="network"
                    stroke="var(--color-warning)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorNet)" 
                    tension={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-card rounded-lg p-8 border border-border shadow-premium flex flex-col">
          <h3 className="text-[1.1rem] font-bold text-text-dark mb-8 uppercase tracking-tight">Zone Compliance</h3>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-none">
            {compliance.map((sector, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[0.85rem] font-bold text-text-gray">{sector.name}</span>
                  <span className={`text-[0.95rem] font-black ${sector.score >= 95 ? 'text-success' : 'text-accent'}`}>{sector.score}%</span>
                </div>
                <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
                  <div
                    className={`h-full rounded-full transition-all duration-[1.5s] ease-out ${sector.score >= 95 ? 'bg-success' : 'bg-accent'}`}
                    style={{ width: `${sector.score}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 opacity-70">
                  <span className="text-[0.65rem] font-bold text-text-gray italic">📈 {sector.trend}</span>
                  <span className={`text-[0.65rem] font-bold ${sector.score >= 95 ? 'text-success' : 'text-accent'} uppercase`}>{sector.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kernel Log Row */}
      <div className="bg-black rounded-lg p-8 shadow-2xl overflow-hidden border border-text-dark/50 font-mono">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="w-5 h-5 text-accent" />
          <span className="text-white text-[0.8rem] font-bold uppercase tracking-widest opacity-80">Vision Core Kernel Log</span>
          <div className="flex gap-1 ml-auto">
            <div className="w-3 h-3 rounded-full bg-danger/30" />
            <div className="w-3 h-3 rounded-full bg-warning/30" />
            <div className="w-3 h-3 rounded-full bg-success/30" />
          </div>
        </div>
        <div className="h-[250px] overflow-y-auto text-accent/80 text-[0.85rem] leading-7 custom-scrollbar lowercase">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-white/60 select-none">[{i + 102}]</span>
              <p className="animate-in fade-in slide-in-from-left-2 duration-300">{log}</p>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
