import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Camera,
  CheckCircle2,
  CircleAlert,
  Clock,
  Cpu,
  Flame,
  MapPin,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Users,
  Video,
  VideoOff,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import CameraGrid from '../components/camera/CameraGrid';
import { fetchIntelligence, fetchHealth } from '../api';
import { fetchAdminAreas, fetchAdminCameras, fetchScenarios } from '../services/cameraService';
import { fetchAlerts, fetchLogs, fetchLogsSummary } from '../services/alertService';

const AI_USE_CASES = [
  'Unauthorized entry into restricted areas',
  'Aggressive behaviour detection',
  'Weapon detection',
  'Multiple persons entry on single access',
  'Blacklisted person alert',
  'Crowd density / overcrowding detection',
  'Visitor count limit',
  'Entry/Exit tracking of visitors',
  'Staff presence/absence at duty post',
  'Mobile phone usage in restricted areas',
  'Fire / smoke detection',
  'Vehicle detection & tracking',
  'Unauthorized parking / ambulance blockage',
  'Camera offline and recording failure alert',
  'Baby moved outside designated routes',
  'Unauthorized person handling or carrying baby',
  'Baby left unattended',
  'Patient approaching exit without discharge clearance',
  'More than allowed attendants during night',
  'Movement in closed departments/areas',
  'Boundary wall climbing or jumping'
];

const severityStyle = {
  Critical: 'bg-danger/10 text-danger border-danger/20',
  High: 'bg-warning/10 text-warning border-warning/20',
  Medium: 'bg-accent/10 text-accent border-accent/20',
  Low: 'bg-success/10 text-success border-success/20'
};

const safeArray = (value) => Array.isArray(value) ? value : [];

const readErrorMessage = (err) => {
  if (!err?.message) return 'Unavailable';
  if (err.message.includes('403')) return 'Permission required';
  return err.message;
};

const formatTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const buildTrend = (logs) => {
  const buckets = new Map();
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(now.getHours() - i * 4, 0, 0, 0);
    buckets.set(d.getHours(), {
      time: d.toLocaleTimeString([], { hour: '2-digit' }),
      detections: 0,
      alerts: 0
    });
  }

  logs.forEach((log) => {
    const date = new Date(log.timestamp);
    if (Number.isNaN(date.getTime())) return;
    const hour = Math.floor(date.getHours() / 4) * 4;
    const bucket = buckets.get(hour);
    if (!bucket) return;
    bucket.detections += 1;
    if (log.is_alert) bucket.alerts += 1;
  });

  return Array.from(buckets.values());
};

function MetricCard({ label, value, sublabel, icon: Icon, tone = 'accent' }) {
  const toneClass = {
    accent: 'text-accent bg-accent/10 border-accent/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
    neutral: 'text-text-dark bg-surface border-border'
  }[tone];

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm min-h-[110px] sm:min-h-[126px] flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center ${toneClass}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="text-[9px] font-black uppercase tracking-widest text-text-gray text-right">Live</div>
      </div>
      <div className="mt-2 sm:mt-0">
        <div className="text-xl sm:text-2xl font-black text-text-dark tracking-tight">{value}</div>
        <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-gray mt-1">{label}</div>
        <div className="text-[10px] sm:text-[11px] font-semibold text-text-gray mt-1.5 sm:mt-2 truncate">{sublabel}</div>
      </div>
    </div>
  );
}
function SectionHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center text-accent shrink-0">
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-text-dark truncate">{title}</h3>
          <p className="text-[10px] sm:text-[11px] font-semibold text-text-gray mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg bg-surface/40 p-6">
      <CheckCircle2 className="w-8 h-8 text-text-gray/40 mb-3" />
      <p className="text-[11px] font-black uppercase tracking-widest text-text-gray">{text}</p>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errors, setErrors] = useState({});
  const [cameras, setCameras] = useState([]);
  const [areas, setAreas] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [intel, setIntel] = useState({ person_count: 0, objects: [], stable_objects: [] });
  const [scenarios, setScenarios] = useState([]);
  const [health, setHealth] = useState({ status: 'unknown' });

  const loadDashboard = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    const nextErrors = {};

    const load = async (key, fn, fallback) => {
      try {
        return await fn();
      } catch (err) {
        nextErrors[key] = readErrorMessage(err);
        return fallback;
      }
    };

    const [cameraData, areaData, alertData, logData, summaryData, intelData, healthData, scenariosData] = await Promise.all([
      load('cameras', fetchAdminCameras, []),
      load('areas', fetchAdminAreas, []),
      load('alerts', () => fetchAlerts({ hours: 24, limit: 20 }), []),
      load('logs', () => fetchLogs({ hours: 24, limit: 300, skip: 0 }), []),
      load('summary', () => fetchLogsSummary(24), {}),
      load('intelligence', fetchIntelligence, { person_count: 0, objects: [], stable_objects: [] }),
      load('health', fetchHealth, { status: 'unknown' }),
      load('scenarios', fetchScenarios, [])
    ]);

    setCameras(safeArray(cameraData.cameras || cameraData));
    setAreas(safeArray(areaData.areas || areaData));
    setAlerts(safeArray(alertData));
    setLogs(safeArray(logData));
    setSummary(summaryData || {});
    setIntel(intelData || { person_count: 0, objects: [], stable_objects: [] });
    setScenarios(safeArray(scenariosData.scenarios || scenariosData));
    setHealth(healthData || { status: 'unknown' });
    setErrors(nextErrors);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => loadDashboard(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const activeCameras = cameras.filter((camera) => camera.is_active !== false).length;
    const offlineCameras = Math.max(cameras.length - activeCameras, 0);
    const critical = alerts.filter((alert) => alert.severity === 'Critical').length;
    const high = alerts.filter((alert) => alert.severity === 'High').length;
    const activePersons = intel.person_count || 0;
    const uniqueActiveScenarios = new Set();
    cameras.forEach(cam => {
      if (cam.enabled_scenario_ids) {
        cam.enabled_scenario_ids.forEach(id => uniqueActiveScenarios.add(id));
      }
    });

    // Match Admin logic: filter unique IDs against actual scenario registry
    const activeModels = scenarios.filter(s => uniqueActiveScenarios.has(s.id)).length;
    const totalDetections = summary.total_logs || summary.count || logs.length || 0;
    const posture = critical > 0 ? 'Critical' : high > 0 ? 'Elevated' : summary.threat_level || 'Normal';

    return { activeCameras, offlineCameras, critical, high, activePersons, totalDetections, activeModels, posture };
  }, [alerts, cameras, intel, logs, summary]);

  const areaRows = useMemo(() => {
    const areaMap = new Map(areas.map((area) => [area.id, area]));
    const rows = areas.map((area) => {
      const areaCameras = cameras.filter((camera) => camera.area_id === area.id);
      return {
        id: area.id,
        name: area.name,
        cameras: areaCameras.length,
        active: areaCameras.filter((camera) => camera.is_active !== false).length
      };
    });

    const unassigned = cameras.filter((camera) => !areaMap.has(camera.area_id));
    if (unassigned.length) {
      rows.push({
        id: 'unassigned',
        name: 'Unassigned Cameras',
        cameras: unassigned.length,
        active: unassigned.filter((camera) => camera.is_active !== false).length
      });
    }

    return rows.sort((a, b) => b.cameras - a.cameras).slice(0, 6);
  }, [areas, cameras]);

  const areaDistributionData = useMemo(() => {
    return areaRows
      .filter(row => row.cameras > 0)
      .map(row => ({ name: row.name, value: row.cameras }));
  }, [areaRows]);

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#ef4444'];

  const modelRows = useMemo(() => {
    const counts = {};
    logs.forEach((log) => {
      const key = log.scenario_key || log.object_class || 'Unclassified';
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [logs]);

  const trendData = useMemo(() => buildTrend(logs), [logs]);

  const activeUseCases = useMemo(() => {
    const detected = new Set(logs.map((log) => (log.scenario_key || '').toLowerCase()));
    return AI_USE_CASES.map((label) => ({
      label,
      active: Array.from(detected).some((item) => item.includes(label.split(' ')[0].toLowerCase()))
    }));
  }, [logs]);

  const postureTone = stats.posture === 'Critical' ? 'danger' : stats.posture === 'Elevated' ? 'warning' : 'success';

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-6">
      <div className="bg-card border border-border rounded-lg p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center text-accent shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-text-dark truncate">Command Hub</h1>
              <p className="text-[10px] sm:text-[11px] md:text-sm font-semibold text-text-gray mt-1 max-w-3xl line-clamp-1 sm:line-clamp-none">
                Centralized hospital surveillance, real time AI alerts, camera health, and model activity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest ${postureTone === 'danger' ? 'bg-danger/10 text-danger border-danger/20' : postureTone === 'warning' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}`}>
              {stats.posture} posture
            </div>
            <div className="px-4 py-2 rounded-lg border border-border bg-surface text-[10px] font-black uppercase tracking-widest text-text-gray">
              Updated {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Loading'}
            </div>
            <button
              onClick={() => loadDashboard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:opacity-90 transition-all disabled:opacity-60"
              disabled={refreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-5 grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(errors).map(([key, value]) => (
              <div key={key} className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2 text-[11px] font-bold text-warning">
                {key}: {value}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Camera Estate"
          value={`${stats.activeCameras}/${cameras.length || 0}`}
          sublabel={`${stats.offlineCameras} offline or disabled`}
          icon={Video}
          tone={stats.offlineCameras > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          label="Critical / High Alerts"
          value={`${stats.critical}/${stats.high}`}
          sublabel={`${alerts.length} alerts in the last 24 hours`}
          icon={Siren}
          tone={stats.critical > 0 ? 'danger' : stats.high > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          label="Live Occupancy Signal"
          value={stats.activePersons}
          sublabel={`${(intel.objects || []).length} object classes currently visible`}
          icon={Users}
          tone={stats.activePersons > 10 ? 'warning' : 'accent'}
        />
        <MetricCard
          label="AI Model Assignments"
          value={stats.activeModels}
          sublabel={`${AI_USE_CASES.length}+ supported detection scenarios`}
          icon={Cpu}
          tone="accent"
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader
            icon={BarChart3}
            title="Detection Trend"
            subtitle="Detections and alert events grouped from recent logs"
            action={<span className="text-[10px] font-black uppercase tracking-widest text-success flex items-center gap-1.5"><Radio className="w-3 h-3" /> Live polling</span>}
          />
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="detGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="detections" name="Detections" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#detGrad)" />
                <Area type="monotone" dataKey="alerts" name="Alerts" stroke="#ef4444" strokeWidth={2.5} fill="url(#alertGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader
            icon={Bell}
            title="Alert Queue"
            subtitle="Latest high-priority events"
          />
          <div className="space-y-3 max-h-[300px] sm:max-h-[280px] overflow-y-auto pr-1">
            {alerts.length ? alerts.slice(0, 6).map((alert) => (
              <div key={alert.id} className="border border-border rounded-lg p-3 bg-surface/30">
                <div className="flex items-center justify-between gap-3">
                  <span className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${severityStyle[alert.severity] || severityStyle.Low}`}>
                    {alert.severity || 'Low'}
                  </span>
                  <span className="text-[10px] font-bold text-text-gray flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(alert.timestamp)}
                  </span>
                </div>
                <p className="text-xs font-black text-text-dark mt-3 line-clamp-2">{alert.metadata_json?.detail || alert.scenario_key}</p>
                <p className="text-[10px] font-semibold text-text-gray mt-1">Camera #{alert.camera_id} - confidence {Math.round((alert.confidence || 0) * 100)}%</p>
              </div>
            )) : <EmptyState text="No active alerts in the selected window" />}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader icon={MapPin} title="Area Distribution" subtitle="Camera density across hospital zones" />
          <div className="h-[220px] sm:h-[290px] flex items-center justify-center">
            {areaDistributionData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={areaDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {areaDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState text="No areas configured" />}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {areaDistributionData.slice(0, 4).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-bold text-text-gray truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader icon={Zap} title="Model-wise Detections" subtitle="Top AI scenarios from event logs" />
          <div className="h-[220px] sm:h-[290px]">
            {modelRows.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelRows} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState text="No model detections logged yet" />}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader icon={Activity} title="Operational Health" subtitle="System health and current AI signal" />
          <div className="grid gap-3">
            {[
              { label: 'Backend API', value: health.status === 'ok' ? 'Online' : 'Check', icon: ShieldCheck, tone: health.status === 'ok' ? 'text-success' : 'text-warning' },
              { label: 'Detection Events', value: stats.totalDetections, icon: Activity, tone: 'text-accent' },
              { label: 'Weapons Logged', value: summary.total_weapons || 0, icon: ShieldAlert, tone: (summary.total_weapons || 0) > 0 ? 'text-danger' : 'text-success' },
              { label: 'Vehicle Events', value: summary.total_vehicles || 0, icon: Camera, tone: 'text-accent' },
              { label: 'Live Objects', value: (intel.objects || []).join(', ') || 'None', icon: CircleAlert, tone: 'text-text-dark' }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-surface/30">
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon className={`w-4 h-4 shrink-0 ${item.tone}`} />
                  <span className="text-[11px] font-black uppercase tracking-widest text-text-gray">{item.label}</span>
                </div>
                <span className="text-xs font-black text-text-dark truncate max-w-[140px] text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CameraGrid />

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader icon={Flame} title="AI Use Case Coverage" subtitle="Hospital scenarios supported by the platform" />
          <div className="grid md:grid-cols-2 gap-2">
            {activeUseCases.map((item, index) => (
              <div key={item.label} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2 bg-surface/30">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${item.active ? 'bg-accent text-white' : 'bg-card text-text-gray border border-border'}`}>
                  {index + 1}
                </span>
                <span className="text-[11px] font-bold text-text-dark leading-snug">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <SectionHeader icon={VideoOff} title="Camera Exceptions" subtitle="Streams needing operator attention" />
          <div className="space-y-3">
            {cameras.filter((camera) => camera.is_active === false).slice(0, 8).map((camera) => (
              <div key={camera.id} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-danger/5">
                <div>
                  <p className="text-xs font-black text-text-dark">{camera.name}</p>
                  <p className="text-[10px] font-semibold text-text-gray">Camera #{camera.id}</p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-danger">Offline</span>
              </div>
            ))}
            {!cameras.some((camera) => camera.is_active === false) && (
              <EmptyState text={loading ? 'Loading camera status' : 'No offline cameras detected'} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
