import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Search,
  Filter,
  MoreHorizontal,
  Video,
  Download,
  Trash2,
  Clock,
  Eye,
  MapPin,
  BellRing,
  Loader2,
  X,
  Target,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { fetchAlerts, resolveAlert } from '../services/alertService';
import { fetchLiveScenarios } from '../services/cameraService';
import { BASE } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolvedAlertIds, setResolvedAlertIds] = useState(new Set());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const { addNotification } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const alertId = params.get('alert_id');
    if (alertId && alerts.length > 0) {
      const targetAlert = alerts.find(a => String(a.id) === alertId);
      if (targetAlert) {
        setSelectedAlert(targetAlert);
        // Clean URL after selecting
        navigate('/alerts', { replace: true });
      }
    }
  }, [location.search, alerts, navigate]);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const data = await fetchLiveScenarios();
        setScenarios(data || []);
      } catch (err) {
        console.error("Failed to fetch scenarios:", err);
      }
    };
    loadScenarios();
  }, []);

  const scenarioNameByKey = React.useMemo(() => {
    const map = new Map();
    scenarios.forEach(s => {
      if (s.key) map.set(s.key.toLowerCase(), s.name);
    });
    return map;
  }, [scenarios]);

  useEffect(() => {
    loadAlerts();
    const iv = setInterval(loadAlerts, 5000); // Poll every 5s
    return () => clearInterval(iv);
  }, [activeTab, startDate, endDate]);

  const loadAlerts = async () => {
    try {
      const severityMap = {
        'critical': 'Critical',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
      };

      const opts = {
        hours: (startDate || endDate) ? undefined : 24,
        severity: activeTab !== 'all' ? severityMap[activeTab] : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const data = await fetchAlerts(opts);
      setAlerts(data || []);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyles = (severity) => {
    const s = (severity || 'Low').toLowerCase();
    if (s === 'critical' || s === 'high') return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20', icon: ShieldAlert, label: s.toUpperCase() };
    if (s === 'medium') return { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', icon: AlertTriangle, label: 'MEDIUM' };
    return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: Info, label: 'LOW' };
  };

  const filteredAlerts = alerts.filter(a => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      a.scenario_key.toLowerCase().includes(search) ||
      (a.metadata_json?.detail || '').toLowerCase().includes(search) ||
      (a.camera_name || '').toLowerCase().includes(search) ||
      (a.area_name || '').toLowerCase().includes(search) ||
      String(a.camera_id).includes(search)
    );
  });

  const handleExportCSV = () => {
    const headers = ['Alert ID', 'Severity', 'Scenario', 'Camera', 'Area', 'Confidence', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...visibleAlerts.map(a => [
        `ALT-${a.id}`,
        a.severity,
        a.scenario_key,
        a.camera_name || `Stream-${a.camera_id}`,
        a.area_name || 'Unknown Area',
        (a.confidence * 100).toFixed(1) + '%',
        new Date(a.timestamp).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `crisis_audit_log_${new Date().getTime()}.csv`;
    link.click();

    addNotification({
      id: Date.now(),
      title: 'Audit Log Exported',
      message: 'The crisis audit log CSV has been downloaded.',
      severity: 'Low'
    });
  };

  const visibleAlerts = filteredAlerts; // Show all, including resolved items

  const stats = {
    critical: visibleAlerts.filter(a => a.severity === 'Critical' && !a.is_resolved && !resolvedAlertIds.has(a.id)).length,
    high: visibleAlerts.filter(a => a.severity === 'High' && !a.is_resolved && !resolvedAlertIds.has(a.id)).length,
    medium: visibleAlerts.filter(a => a.severity === 'Medium' && !a.is_resolved && !resolvedAlertIds.has(a.id)).length,
    low: visibleAlerts.filter(a => a.severity === 'Low' && !a.is_resolved && !resolvedAlertIds.has(a.id)).length,
    total: visibleAlerts.filter(a => !a.is_resolved && !resolvedAlertIds.has(a.id)).length
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 px-2">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-[1.8rem] font-black text-text-dark mb-1 tracking-tight flex items-center gap-3">
            <BellRing className={`w-6 h-6 sm:w-8 sm:h-8 text-danger shrink-0 ${stats.critical > 0 ? 'animate-bounce' : ''}`} />
            <span className="truncate">Alert Management Center</span>
          </h2>
          <div className="text-[0.75rem] sm:text-[0.9rem] text-text-gray font-semibold flex items-center gap-2 flex-wrap">
            Intelligent incident management and response
            <span className="hidden sm:block w-1 h-1 bg-text-gray rounded-full opacity-30" />
            <span className="text-accent">{stats.total} Active alerts observed</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-card text-text-dark border border-border rounded-lg text-[0.7rem] sm:text-[0.75rem] font-bold cursor-pointer hover:border-accent hover:text-accent shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Full Audit Log
          </button>
        </div>
      </div>

      {/* Alert Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: 'Critical', value: stats.critical, color: 'text-danger', bg: 'bg-danger/10', icon: ShieldAlert },
          { label: 'High', value: stats.high, color: 'text-danger', bg: 'bg-danger/10', icon: AlertTriangle },
          { label: 'Medium', value: stats.medium, color: 'text-accent', bg: 'bg-accent/10', icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-premium flex items-center gap-4 sm:gap-5 hover:-translate-y-1 transition-all group">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
              <s.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${i === 0 && s.value > 0 && 'animate-pulse'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-[2rem] font-black text-text-dark mb-0.5 leading-none">{s.value}</p>
              <p className="text-[0.65rem] sm:text-[0.75rem] font-bold text-text-gray uppercase tracking-widest truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Search */}
      <div className="bg-card rounded-lg border border-border shadow-premium overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-4 sm:p-8 border-b border-border flex flex-col gap-6">
          {/* Custom Tabs */}
          <div className="flex bg-bg p-1 rounded-lg border border-border overflow-x-auto no-scrollbar shrink-0">
            {['all', 'critical', 'high', 'medium', 'low'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[80px] px-4 py-2 rounded-lg text-[0.75rem] sm:text-[0.8rem] font-bold capitalize transition-all whitespace-nowrap
         ${activeTab === tab ? 'bg-card text-accent shadow-premium border border-border' : 'text-text-gray hover:text-text-dark'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-bg border border-border rounded-lg text-[0.8rem] sm:text-[0.88rem] focus:outline-none focus:border-accent transition-all"
              />
            </div>

            {/* Date Filters & Reset */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex-1 sm:flex-none flex items-center gap-2 sm:gap-3 bg-bg p-1 rounded-lg border border-border shadow-sm min-w-0">
                <div className="flex-1 sm:flex-none flex items-center gap-2 px-2 sm:px-3 py-1.5 border-r border-border/50 relative">
                  <Calendar className="w-3.5 h-3.5 text-accent shrink-0 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-[0.7rem] sm:text-[0.75rem] font-bold text-text-dark focus:outline-none cursor-pointer w-full"
                    placeholder="Start Date"
                  />
                </div>
                <div className="flex-1 sm:flex-none flex items-center gap-2 px-2 sm:px-3 py-1.5 relative">
                  <span className="hidden sm:inline text-[0.6rem] font-black text-text-gray uppercase opacity-50 pointer-events-none">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-[0.7rem] sm:text-[0.75rem] font-bold text-text-dark focus:outline-none cursor-pointer w-full"
                    placeholder="End Date"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                  setActiveTab('all');
                }}
                title="Reset All Filters"
                className="p-2.5 sm:p-3 bg-bg border border-border rounded-lg text-text-gray hover:text-accent hover:border-accent transition-all group shrink-0"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-[-45deg] transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Log Table */}
        <div className="flex-1 overflow-x-auto">
          {loading && !alerts.length ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <p className="text-[0.65rem] font-black text-text-gray uppercase tracking-[0.2em]">Synchronizing Crisis Matrix</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-bg/50 border-b border-border">
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-[0.55rem] sm:text-[0.6rem] font-black text-text-gray uppercase tracking-widest">Ref</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-[0.55rem] sm:text-[0.6rem] font-black text-text-gray uppercase tracking-widest">Level</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-[0.55rem] sm:text-[0.6rem] font-black text-text-gray uppercase tracking-widest">Incident Details</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-[0.55rem] sm:text-[0.6rem] font-black text-text-gray uppercase tracking-widest">Source</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-[0.55rem] sm:text-[0.6rem] font-black text-text-gray uppercase tracking-widest">Time</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-right text-[0.55rem] sm:text-[0.6rem] font-black text-text-gray uppercase tracking-widest">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {visibleAlerts.map((alert) => {
                  const style = getSeverityStyles(alert.severity);
                  const isResolved = alert.is_resolved || resolvedAlertIds.has(alert.id);
                  return (
                    <tr key={alert.id} className={`transition-colors group ${isResolved ? 'bg-bg/10' : 'hover:bg-bg/30'}`}>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <span className="text-[0.6rem] sm:text-[0.65rem] font-black text-text-gray opacity-80">#ALT-{alert.id}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className={`inline-flex items-center justify-center gap-1.5 w-[75px] sm:w-[85px] px-1.5 py-1 rounded-full text-[0.5rem] sm:text-[0.55rem] font-black uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                          <style.icon className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                          {style.label}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex flex-col gap-0.5 min-w-[150px]">
                          <span className="text-[0.75rem] sm:text-[0.8rem] font-black tracking-tight text-text-dark line-clamp-1">
                            {scenarioNameByKey.get(alert.scenario_key.toLowerCase()) || alert.metadata_json?.detail || alert.scenario_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.5rem] sm:text-[0.55rem] font-black text-accent uppercase tracking-tighter opacity-60">Conf: {(alert.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-start gap-1.5 text-text-gray font-bold text-[0.65rem] sm:text-[0.7rem] min-w-[150px]">
                          <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-accent mt-0.5 shrink-0" />
                          <div className="flex flex-col leading-tight">
                            <span className="text-text-dark">
                              {`CAM-${String(alert.camera_id).padStart(2, '0')}`}
                              {alert.camera_name && ` - ${alert.camera_name}`}
                            </span>
                            <span className="text-[0.55rem] uppercase tracking-wider text-text-gray">
                              {alert.area_name || 'Unknown Area'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5 text-text-gray font-bold text-[0.65rem] sm:text-[0.7rem] whitespace-nowrap">
                          <Clock className="w-3 sm:w-3.5 h-3 sm:h-4 opacity-40" />
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="p-1.5 sm:p-2 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white border border-accent/20 transition-all shadow-sm"
                            title="View Snapshot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!isResolved ? (
                            <button
                              onClick={async () => {
                                try {
                                  await resolveAlert(alert.id);
                                  setResolvedAlertIds(prev => new Set(prev).add(alert.id));
                                } catch (err) {
                                  console.error("Failed to resolve alert:", err);
                                }
                              }}
                              className="p-1.5 sm:p-2 bg-success/10 text-success rounded-lg hover:bg-success hover:text-white border border-success/20 transition-all shadow-sm"
                              title="Resolve Incident"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success border border-success/20 rounded-lg text-[0.5rem] sm:text-[0.55rem] font-black uppercase tracking-wider whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" /> Resolved
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && visibleAlerts.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-bg rounded-lg flex items-center justify-center text-text-gray/20 mx-auto mb-4 border border-border shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <p className="text-[1.1rem] font-black text-text-dark">No Active Crisis</p>
              <p className="text-[0.85rem] text-text-gray font-bold mt-1">All sector protocols are being maintained.</p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-8 border-t border-border bg-bg/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[0.75rem] sm:text-[0.8rem] text-text-gray font-bold">
            System Health: <span className="text-success uppercase">Neural Scan Active</span>
          </div>
          <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-[0.75rem] sm:text-[0.8rem] font-bold text-text-gray hover:text-text-dark transition-all">
              Previous 24h
            </button>
            <button
              onClick={async () => {
                try {
                  const ids = visibleAlerts.map(a => a.id);
                  await Promise.all(ids.map(id => resolveAlert(id)));
                  setResolvedAlertIds(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.add(id));
                    return next;
                  });
                } catch (err) {
                  console.error("Failed to acknowledge all:", err);
                }
              }}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-accent text-white rounded-lg text-[0.75rem] sm:text-[0.8rem] font-bold hover:opacity-90 shadow-premium transition-all"
            >
              Acknowledge All
            </button>
          </div>
        </div>
      </div>

      {/* SNAPSHOT MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-premium rounded-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-dark tracking-tight">Crisis Snapshot</h2>
                  <p className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest">
                    ID: {selectedAlert.id} • CAM-{String(selectedAlert.camera_id).padStart(2, '0')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-2 text-text-gray hover:text-text-dark hover:bg-surface rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="bg-surface p-3 sm:p-4 rounded-lg border border-border">
                  <span className="text-[0.6rem] sm:text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Scenario Node</span>
                  <span className="text-xs sm:text-sm font-bold text-text-dark">
                    {scenarioNameByKey.get(selectedAlert.scenario_key.toLowerCase()) || selectedAlert.scenario_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
                <div className="bg-surface p-3 sm:p-4 rounded-lg border border-border">
                  <span className="text-[0.6rem] sm:text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Detection Time</span>
                  <span className="text-xs sm:text-sm font-bold text-text-dark">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="bg-surface p-3 sm:p-4 rounded-lg border border-border">
                  <span className="text-[0.6rem] sm:text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Camera & Area</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-xs sm:text-sm font-bold text-text-dark">
                      {selectedAlert.camera_name || `CAM-${String(selectedAlert.camera_id).padStart(2, '0')}`}
                    </span>
                    <span className="hidden sm:inline text-text-gray">/</span>
                    <span className="text-xs sm:text-sm font-bold text-accent">
                      {selectedAlert.area_name || 'Unknown Area'}
                    </span>
                  </div>
                </div>
                {selectedAlert.metadata_json?.dwell_duration !== undefined && (
                  <div className="bg-surface p-3 sm:p-4 rounded-lg border border-border flex items-center justify-between col-span-1 sm:col-span-2">
                    <div>
                      <span className="text-[0.6rem] sm:text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Dwell Duration</span>
                      <span className="text-lg sm:text-xl font-black text-danger">{selectedAlert.metadata_json.dwell_duration}s</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[0.6rem] sm:text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Dwell Limit Threshold</span>
                      <span className="text-xs sm:text-sm font-bold text-text-dark">{selectedAlert.metadata_json.dwell_limit || 0}s</span>
                    </div>
                  </div>
                )}
                <div className="bg-surface p-3 sm:p-4 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[0.6rem] sm:text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">AI Confidence Score</span>
                    <span className="text-lg sm:text-xl font-black text-accent">{(selectedAlert.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[0.6rem] sm:text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Severity Matrix</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-wider border
           ${(selectedAlert.severity === 'Critical' || selectedAlert.severity === 'High') ? 'bg-danger/10 text-danger border-danger/20' :
                        selectedAlert.severity === 'Medium' ? 'bg-accent/10 text-accent border-accent/20' :
                          'bg-success/10 text-success border-success/20'}`}>
                      {selectedAlert.severity || 'Low'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Snapshot Component */}
              <div>
                <h3 className="text-[0.7rem] font-bold text-text-gray uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Video className="w-3.5 h-3.5" /> Security Footage Snapshot
                </h3>
                {selectedAlert.image_base64 ? (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={`data:image/jpeg;base64,${selectedAlert.image_base64}`}
                      alt="Event Snapshot"
                      className="w-full h-auto object-contain max-h-[340px]"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-surface rounded-lg border border-border border-dashed flex flex-col items-center justify-center text-text-gray gap-2">
                    <Video className="w-8 h-8 opacity-20" />
                    <span className="text-[0.7rem] font-bold uppercase tracking-widest opacity-50">No Snapshot Captured</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-bg/50 flex justify-end gap-3">
              <button
                onClick={async () => {
                  try {
                    await resolveAlert(selectedAlert.id);
                    setResolvedAlertIds(prev => new Set(prev).add(selectedAlert.id));
                    setSelectedAlert(null);
                  } catch (err) {
                    console.error("Failed to resolve alert:", err);
                  }
                }}
                className="px-6 py-2.5 bg-success text-white rounded-lg text-[0.8rem] font-bold shadow-premium hover:opacity-90 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Resolve Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
