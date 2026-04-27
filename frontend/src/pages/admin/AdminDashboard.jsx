import React, { useState, useEffect } from 'react';
import { fetchAdminUsers } from '../../services/userService';
import { fetchLogs } from '../../services/alertService';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  ShieldAlert,
  Activity,
  Cpu,
  Database,
  Zap,
  TrendingUp,
  AlertCircle,
  Eye,
  Server,
  Terminal,
  ShieldCheck,
  RefreshCw,
  MoreVertical,
  Activity as PulseIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import AdminAuditBox from '../../components/admin/AdminAuditBox';


export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated chart data
  const systemActivity = [
    { name: '00:00', traffic: 120, alerts: 2 },
    { name: '04:00', traffic: 80, alerts: 1 },
    { name: '08:00', traffic: 450, alerts: 5 },
    { name: '12:00', traffic: 680, alerts: 8 },
    { name: '16:00', traffic: 590, alerts: 4 },
    { name: '20:00', traffic: 320, alerts: 3 },
  ];

  const inferenceData = [
    { label: 'Vision Core', load: 85 },
    { label: 'Neural Mesh', load: 62 },
    { label: 'DB Cluster', load: 34 },
    { label: 'API Stream', load: 45 },
    { label: 'Security Link', load: 12 },
  ];

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const [usersData, logsData] = await Promise.all([
        fetchAdminUsers(),
        fetchLogs({ hours: 24 })
      ]);

      setStats({
        totalUsers: usersData.length,
        totalDetections: logsData.length,
        activeCameras: 4,
        criticalAlerts: logsData.filter(l => l.severity === 'Critical').length,
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch admin stats", err.message);
      setLoading(false);
    }
  };

  const KPICard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-card border border-border rounded-lg p-5 group hover:border-accent/30 transition-all duration-300 relative overflow-hidden shadow-sm">
      <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 blur-[40px] -mr-12 -mt-12 transition-all group-hover:opacity-10 bg-${color === 'accent' ? 'accent' : 'red-500'}`}></div>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-gray mb-1.5">{title}</p>
          <h3 className="text-2xl font-black italic tracking-tighter text-text-dark">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1.2 mt-2.5 px-2 py-0.5 rounded-full bg-accent-soft border border-accent/10 w-fit">
              <TrendingUp className="w-3 h-3 text-accent" />
              <span className="text-[9px] font-black text-accent tracking-tight">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-accent-soft border border-accent/10 group-hover:scale-105 transition-transform`}>
          <Icon className={`w-6 h-6 text-accent`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1500px] mx-auto">

      {/* ── Page Header (Scale Adjusted) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[1.8rem] font-black italic uppercase tracking-tighter text-text-dark flex items-center gap-3">
            Matrix <span className="text-accent underline decoration-accent/20 underline-offset-4">Admin Hub</span>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-success/10 border border-success/20 rounded-md">
              <PulseIcon className="w-3 h-3 text-success animate-pulse" />
              <span className="text-[8px] font-black text-success tracking-widest uppercase">Live</span>
            </div>
          </h1>
          <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            Central Command // Infrastructure V2.1
          </p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-text-gray hover:bg-surface hover:text-text-dark transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
            Recalibrate
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Overrides
          </button>
        </div>
      </div>

      {/* ── KPI Row (Scaled Down) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Personnel" value={stats?.totalUsers || '0'} icon={Users} color="accent" trend="+12 Identity Links" />
        <KPICard title="Threat Level Delta" value={stats?.criticalAlerts || '0'} icon={ShieldAlert} color="red-500" trend="-4 Signals Detected" />
        <KPICard title="Vision Nodes" value={stats?.activeCameras || '4'} icon={Eye} color="emerald-500" />
        <KPICard title="Neural Events" value={stats?.totalDetections || '0'} icon={Activity} color="amber-500" trend="+240 Logs Generated" />
      </div>

      {/* ── Main Analytical Grid (Scaled Down) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">

        {/* Activity Chart (Left Column) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-text-dark">Neural Traffic Load</h3>
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-widest mt-0.5">Cross-Sector Data Throughput</p>
              </div>
            </div>
            <div className="flex bg-surface p-1 rounded-lg gap-0.5">
              {['1H', '24H', '7D'].map(t => (
                <button key={t} className={`px-3 py-1 rounded-md text-[8px] font-black tracking-widest transition-all ${t === '24H' ? 'bg-accent text-white' : 'text-text-gray hover:text-text-dark'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemActivity}>
                <defs>
                  <linearGradient id="colorAdminTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--color-text-gray)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-gray)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="traffic" stroke="var(--color-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorAdminTraffic)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Integrity Gauge (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm relative overflow-hidden">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-gray mb-6 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Storage Hierarchy
            </h3>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="66" stroke="var(--color-border)" strokeWidth="8" fill="transparent" />
                  <circle cx="72" cy="72" r="66" stroke="var(--color-accent)" strokeWidth="8" fill="transparent"
                    strokeDasharray={2 * Math.PI * 66}
                    strokeDashoffset={2 * Math.PI * 66 * (1 - 0.74)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black italic tracking-tighter text-text-dark">74%</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-text-gray">Usage</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface rounded-lg">
                <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest mb-0.5">Capacity</p>
                <p className="text-sm font-black text-text-dark italic">12.4 TB</p>
              </div>
              <div className="p-3 bg-surface rounded-lg">
                <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest mb-0.5">Load</p>
                <p className="text-sm font-black text-text-dark italic">9.1 TB</p>
              </div>
            </div>
          </div>

          {/* Neural Load Indicators */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-gray mb-6">Component Matrix</h3>
            <div className="space-y-4">
              {inferenceData.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase">
                    <span className="text-text-gray">{item.label}</span>
                    <span className={item.load > 80 ? 'text-red-500' : 'text-accent'}>{item.load}%</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${item.load > 80 ? 'bg-red-500' : 'bg-accent'}`}
                      style={{ width: `${item.load}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Console Feed (Bottom Row) ── */}
      <AdminAuditBox />
    </div>
  );
}

