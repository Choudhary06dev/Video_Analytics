import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Activity, 
  Zap, 
  Database, 
  Cpu, 
  Terminal, 
  Play, 
  Square, 
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { fetchTrainingStats, toggleTraining, resetWeights } from '../services/trainingService';

export default function AITraining() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getStats = async () => {
    try {
      const res = await fetchTrainingStats();
      setData(res);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch training intel:", err);
    }
  };

  useEffect(() => {
    getStats();
    const interval = setInterval(getStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    try {
      await toggleTraining();
      getStats();
    } catch (err) {
      console.error("Failed to toggle training state:", err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all training weights? This action cannot be undone.")) return;
    try {
      await resetWeights();
      getStats();
    } catch (err) {
      console.error("Failed to reset training weights:", err);
    }
  };

  if (loading || !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-gray animate-pulse">Syncing Neural Weights...</p>
      </div>
    );
  }

  const { metrics, current_epoch, total_epochs, history, classes, logs, hardware, is_training } = data;

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">Training Hub</h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            Model Optimization Matrix
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            Epoch {current_epoch}/{total_epochs}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggle}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-all shadow-premium border
              ${is_training ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20' : 'bg-success/10 text-success border-success/20 hover:bg-success/20'}`}
          >
            {is_training ? <Square className="w-4 h-4 fill-danger" /> : <Play className="w-4 h-4 fill-success" />}
            {is_training ? 'Interrupt Training' : 'Resume Training'}
          </button>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-card text-text-dark border border-border rounded-lg text-[0.75rem] font-bold cursor-pointer hover:border-accent hover:text-accent shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Weights
          </button>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Current mAP', value: `${(metrics.mAP * 100).toFixed(1)}%`, trend: '+2.4%', icon: Award, color: 'text-accent', bg: 'bg-accent-soft' },
          { label: 'Train Loss', value: metrics.loss.toFixed(3), trend: '-0.042', icon: TrendingDown, color: 'text-danger', bg: 'bg-danger/10' },
          { label: 'Precision', value: `${(metrics.precision * 100).toFixed(1)}%`, trend: '+1.1%', icon: Target, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Recall', value: `${(metrics.recall * 100).toFixed(1)}%`, trend: '+0.5%', icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-lg p-6 border border-border shadow-premium flex flex-col justify-between hover:-translate-y-1 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div className={`text-[0.65rem] font-extrabold px-2 py-1 rounded-lg ${s.trend.startsWith('+') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {s.trend}
              </div>
            </div>
            <div>
              <p className="text-[1.8rem] font-black text-text-dark mb-0.5">{s.value}</p>
              <p className="text-[0.7rem] font-bold text-text-gray uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Analysis Chart Row */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-lg p-6 md:p-8 border border-border shadow-premium flex flex-col h-[520px]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Training Convergence</h3>
              <p className="text-[0.75rem] text-text-gray font-semibold mt-1">mAP @ .5 vs Train/Val Loss</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-[0.65rem] font-extrabold text-text-gray uppercase tracking-wider">mAP Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-danger rounded-full" />
                <span className="text-[0.65rem] font-extrabold text-text-gray uppercase tracking-wider">Loss Value</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[400px] relative min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <ComposedChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                  dataKey="epoch" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--color-text-gray)', fontSize: 11, fontWeight: 700}} 
                  label={{ value: 'TOTAL TRAINING EPOCHS', position: 'bottom', offset: 10, fontSize: 10, fontWeight: 900, fill: 'var(--color-text-gray)', letterSpacing: '1px' }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  domain={[0, 100]}
                  tick={{fill: 'var(--color-text-gray)', fontSize: 11, fontWeight: 700}} 
                  tickFormatter={v => `${v}%`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--color-text-gray)', fontSize: 13, fontWeight: 600}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="map" 
                  fill="var(--color-accent-soft)" 
                  stroke="var(--color-accent)" 
                  strokeWidth={4} 
                  animationDuration={2000}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="trainLoss" 
                  stroke="var(--color-danger)" 
                  strokeWidth={3} 
                  strokeDasharray="5 5" 
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="valLoss" 
                  stroke="var(--color-warning)" 
                  strokeWidth={2} 
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dataset Distribution */}
        <div className="lg:col-span-1 bg-card rounded-lg p-8 border border-border shadow-premium flex flex-col h-[520px] overflow-hidden">
          <h3 className="text-[1.1rem] font-bold text-text-dark mb-2">Class Distribution</h3>
          <p className="text-[0.75rem] text-text-gray font-semibold mb-8">Training Set Sample Balance</p>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classes}
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {classes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full mt-6">
              {classes.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-[0.65rem] font-bold text-text-gray uppercase truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Training Console Row */}
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-[#0f172a] rounded-lg p-8 shadow-2xl border border-white/5 font-mono relative overflow-hidden group h-[380px] flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-accent" />
              <span className="text-white text-[0.8rem] font-bold uppercase tracking-widest opacity-80">Vision Kernel Training Log</span>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/40 text-[0.6rem] font-bold uppercase tracking-widest">
                Proc: GPU_0
              </div>
              <div className="px-3 py-1 bg-accent/20 border border-accent/20 rounded-lg text-accent text-[0.6rem] font-bold uppercase tracking-widest">
                Live
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto text-accent/90 text-[0.85rem] leading-8 custom-scrollbar relative z-10 flex flex-col-reverse">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-white/60 select-none">[{i+482}]</span>
                <p className="animate-in fade-in slide-in-from-left-2 duration-300 transition-all group-hover:text-white/80">{log}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-card rounded-lg p-6 border border-border shadow-premium flex flex-col gap-4 h-[380px] overflow-hidden">
            <h3 className="text-[1rem] font-black text-text-dark uppercase tracking-tight">Resource Usage</h3>
            {[
                { label: 'System CPU Load', value: hardware.cpu, icon: Cpu, color: 'text-accent' },
                { label: 'Active RAM', value: hardware.ram, icon: Database, color: 'text-success' },
                { label: 'Storage Usage', value: hardware.disk, icon: Activity, color: 'text-danger' },
                { label: 'Network I/O', value: hardware.network, icon: Zap, color: 'text-warning' },
            ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-bg rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        <span className="text-[0.7rem] font-bold text-text-gray uppercase">{stat.label}</span>
                    </div>
                    <span className="text-[1rem] font-black text-text-dark">{stat.value}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
