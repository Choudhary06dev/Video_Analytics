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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const SYSTEM_CHART_DATA = [
  { time: '00:00', cpu: 45, memory: 52, network: 8 },
  { time: '04:00', cpu: 38, memory: 48, network: 6 },
  { time: '08:00', cpu: 68, memory: 62, network: 12 },
  { time: '12:00', cpu: 65, memory: 58, network: 11 },
  { time: '16:00', cpu: 62, memory: 60, network: 13 },
  { time: '20:00', cpu: 48, memory: 52, network: 7 },
  { time: '24:00', cpu: 52, memory: 54, network: 8 },
];

const SECTOR_COMPLIANCE = [
  { name: 'ICU-West Wing', score: 98.2, trend: '+2.1%', status: 'excellent' },
  { name: 'Emergency Bay', score: 96.8, trend: '+1.4%', status: 'excellent' },
  { name: 'Main Reception', score: 94.5, trend: '+0.8%', status: 'good' },
  { name: 'Ward Sector A', score: 91.2, trend: '-0.6%', status: 'good' },
  { name: 'Research Lab', score: 89.7, trend: '+1.9%', status: 'good' },
  { name: 'Staff Lounge', score: 87.3, trend: '-1.2%', status: 'warning' },
];

const KERNEL_LOGS = [
  "> Initializing CUDA context...",
  "> Found NVIDIA A100-SXM4-80GB",
  "> Memory: 81920 MiB",
  "> Loading weights: yolov8s.pt",
  "> Optimization level: TensorRT-FP16",
  "> Starting inference cycle...",
  "> Syncing neural stream...",
  "> Monitoring 6 camera nodes",
  "> API Gateway: Connected"
];

export default function SystemHealth() {
  const [logs, setLogs] = useState(KERNEL_LOGS);
  const logEndRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const batch = Math.floor(Math.random() * 168);
      const boxLoss = (0.12 + Math.random() * 0.01).toFixed(4);
      const newLog = `> [${time}] [Batch ${batch}/168] box_loss: ${boxLoss} | sync_ok`;

      setLogs(prev => {
        const next = [...prev, newLog];
        if (next.length > 20) next.shift();
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">System Health</h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            Vision Core Diagnostics Matrix
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            99.9% Uptime
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-success text-white px-4 py-2 rounded-lg text-[0.75rem] font-bold shadow-md flex items-center gap-2 border border-success">
            <ShieldCheck className="w-4 h-4" />
            SECURE DEPLOYMENT
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-card text-text-dark border border-border rounded-lg text-[0.75rem] font-bold cursor-pointer hover:border-accent hover:text-accent shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Relaunch Kernels
          </button>
        </div>
      </div>

      {/* HW Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'CPU Load', value: '42%', icon: Cpu, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'GPU Temp', value: '58°C', icon: Activity, color: 'text-danger', bg: 'bg-danger/10' },
          { label: 'I/O Rate', value: '1.2 GB/s', icon: HardDrive, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Nodes Online', value: '18/18', icon: Globe, color: 'text-success', bg: 'bg-success/10' },
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
              <LineChart data={SYSTEM_CHART_DATA} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-gray)', fontSize: 13, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-gray)', fontSize: 13, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                />
                <Line type="monotone" dataKey="cpu" stroke="var(--color-accent)" strokeWidth={4} dot={false} tension={0.4} />
                <Line type="monotone" dataKey="memory" stroke="var(--color-success)" strokeWidth={4} dot={false} tension={0.4} />
                <Line type="monotone" dataKey="network" stroke="var(--color-warning)" strokeWidth={4} dot={false} tension={0.4} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-card rounded-lg p-8 border border-border shadow-premium flex flex-col">
          <h3 className="text-[1.1rem] font-bold text-text-dark mb-8 uppercase tracking-tight">Zone Compliance</h3>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-none">
            {SECTOR_COMPLIANCE.map((sector, i) => (
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
