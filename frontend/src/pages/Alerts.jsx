import React, { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import { fetchAlerts } from '../services/alertService';
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
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadAlerts();
    const iv = setInterval(loadAlerts, 5000); // Poll every 5s
    return () => clearInterval(iv);
  }, [activeTab]);

  const loadAlerts = async () => {
    try {
      const severityMap = {
        'critical': 'Critical',
        'warning': 'High', // High and Medium are warnings in the UI
        'info': 'Low'
      };

      const opts = {
        hours: 24,
        severity: activeTab !== 'all' ? severityMap[activeTab] : undefined,
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
    if (s === 'critical') return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20', icon: ShieldAlert, label: 'Critical' };
    if (s === 'high' || s === 'warning') return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: AlertTriangle, label: 'High Threat' };
    return { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', icon: Info, label: 'Standard' };
  };

  const filteredAlerts = alerts.filter(a => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      a.scenario_key.toLowerCase().includes(search) ||
      (a.metadata_json?.detail || '').toLowerCase().includes(search) ||
      String(a.camera_id).includes(search)
    );
  });

  const handleExportCSV = () => {
    const headers = ['Alert ID', 'Severity', 'Scenario', 'Camera', 'Confidence', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...visibleAlerts.map(a => [
        `ALT-${a.id}`,
        a.severity,
        a.scenario_key,
        `Stream-${a.camera_id}`,
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

  const visibleAlerts = filteredAlerts.filter(a => !resolvedAlertIds.has(a.id));

  const stats = {
    critical: visibleAlerts.filter(a => a.severity === 'Critical').length,
    high: visibleAlerts.filter(a => a.severity === 'High').length,
    total: visibleAlerts.length
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase flex items-center gap-3">
            <BellRing className={`w-8 h-8 text-danger ${stats.critical > 0 ? 'animate-bounce' : ''}`} />
            Crisis Response Center
          </h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            Intelligent Incident Management Matrix
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            {stats.total} Active Alerts Observed
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-card text-text-dark border border-border rounded-lg text-[0.75rem] font-bold cursor-pointer hover:border-accent hover:text-accent shadow-sm"
          >
            <Download className="w-4 h-4" />
            Full Audit Log
          </button>
        </div>
      </div>

      {/* Alert Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Active Critical', value: stats.critical, color: 'text-danger', bg: 'bg-danger/10', icon: ShieldAlert },
          { label: 'High Severity', value: stats.high, color: 'text-warning', bg: 'bg-warning/10', icon: AlertTriangle },
          { label: 'Total Events', value: stats.total, color: 'text-accent', bg: 'bg-accent-soft', icon: Info },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-lg p-6 border border-border shadow-premium flex items-center gap-5 hover:-translate-y-1 transition-all group">
            <div className={`w-14 h-14 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
              <s.icon className={`w-7 h-7 ${i === 0 && s.value > 0 && 'animate-pulse'}`} />
            </div>
            <div>
              <p className="text-[2rem] font-black text-text-dark mb-0.5">{s.value}</p>
              <p className="text-[0.75rem] font-bold text-text-gray uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Search */}
      <div className="bg-card rounded-lg border border-border shadow-premium overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-8 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Custom Tabs */}
          <div className="flex bg-bg p-1.5 rounded-lg border border-border">
            {['all', 'critical', 'warning', 'info'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg text-[0.8rem] font-bold capitalize transition-all
                  ${activeTab === tab ? 'bg-card text-accent shadow-premium border border-border' : 'text-text-gray hover:text-text-dark'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-gray" />
              <input
                type="text"
                placeholder="Search incidents by camera, scenario, or detail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-bg border border-border rounded-lg text-[0.88rem] focus:outline-none focus:border-accent transition-all"
              />
            </div>
            <button
              onClick={() => setSearchTerm('')}
              title="Clear Search"
              className="p-3 bg-bg border border-border rounded-lg text-text-gray hover:text-danger hover:border-danger transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
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
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg/50 border-b border-border">
                  <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Reference</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Severity</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Incident Details</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Camera Source</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Time Log</th>
                  <th className="px-8 py-5 text-right text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {visibleAlerts.map((alert) => {
                  const style = getSeverityStyles(alert.severity);
                  return (
                    <tr key={alert.id} className="hover:bg-bg/30 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="text-[0.75rem] font-black text-text-gray opacity-40">#ALT-{alert.id}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                          <style.icon className="w-3.5 h-3.5" />
                          {style.label}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[0.95rem] font-black tracking-tight text-text-dark`}>
                            {alert.metadata_json?.detail || alert.scenario_key}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.6rem] font-black text-accent uppercase tracking-tighter opacity-60">Confidence: {(alert.confidence * 100).toFixed(1)}%</span>
                            <div className="w-1 h-1 bg-accent rounded-full opacity-30" />
                            <span className="text-[0.6rem] font-black text-text-gray uppercase tracking-tighter">AI Node: {alert.scenario_key}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2.5 text-text-gray font-bold text-[0.8rem]">
                          <MapPin className="w-4 h-4 text-accent" />
                          Stream-{String(alert.camera_id).padStart(2, '0')}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-text-gray font-bold text-[0.8rem]">
                          <Clock className="w-4 h-4 opacity-40" />
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 transition-all">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="p-2.5 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white border border-accent/20 transition-all shadow-sm"
                            title="View Snapshot"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => {
                              setResolvedAlertIds(prev => {
                                const next = new Set(prev);
                                next.add(alert.id);
                                return next;
                              });
                            }}
                            className="p-2.5 bg-success/10 text-success rounded-lg hover:bg-success hover:text-white border border-success/20 transition-all shadow-sm"
                            title="Resolve Incident"
                          >
                            <CheckCircle2 className="w-4.5 h-4.5" />
                          </button>
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
        <div className="p-8 border-t border-border bg-bg/20 flex justify-between items-center">
          <div className="text-[0.8rem] text-text-gray font-bold">
            System Health: <span className="text-success uppercase">Neural Scan Active</span>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-card border border-border rounded-lg text-[0.8rem] font-bold text-text-gray hover:text-text-dark transition-all">
              Previous 24h
            </button>
            <button
              onClick={() => {
                setResolvedAlertIds(prev => {
                  const next = new Set(prev);
                  visibleAlerts.forEach(a => next.add(a.id));
                  return next;
                });
              }}
              className="px-6 py-2.5 bg-accent text-white rounded-lg text-[0.8rem] font-bold hover:opacity-90 shadow-premium transition-all"
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
            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Scenario Node</span>
                  <span className="text-sm font-bold text-text-dark">{selectedAlert.scenario_key}</span>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Detection Time</span>
                  <span className="text-sm font-bold text-text-dark">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">AI Confidence Score</span>
                    <span className="text-xl font-black text-accent">{(selectedAlert.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[0.65rem] font-bold text-text-gray uppercase tracking-widest block mb-1">Severity Matrix</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-black uppercase tracking-wider border
                      ${selectedAlert.severity === 'Critical' ? 'bg-danger/10 text-danger border-danger/20' :
                        selectedAlert.severity === 'High' ? 'bg-warning/10 text-warning border-warning/20' :
                          'bg-accent/10 text-accent border-accent/20'}`}>
                      {selectedAlert.severity}
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
                  <div className="bg-black rounded-lg border border-border overflow-hidden relative shadow-inner">
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/20 rounded font-black text-[0.55rem] uppercase tracking-widest text-white z-10">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                      Captured Frame
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10 opacity-70">
                      <span className="font-mono text-[0.5rem] text-white/70">
                        {new Date(selectedAlert.timestamp).toISOString()}
                      </span>
                      <span className="font-mono text-[0.5rem] text-white/70">
                        CAM_{selectedAlert.camera_id}_SECURE
                      </span>
                    </div>
                    <img
                      src={`data:image/jpeg;base64,${selectedAlert.image_base64}`}
                      alt="Event Snapshot"
                      className="w-full h-auto object-contain max-h-[300px]"
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
                onClick={() => {
                  setResolvedAlertIds(prev => new Set(prev).add(selectedAlert.id));
                  setSelectedAlert(null);
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
