import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  History, 
  Search, 
  Filter, 
  Activity, 
  User, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  Download,
  AlertCircle,
  Database,
  ArrowUpRight,
  Terminal,
  Loader2
} from 'lucide-react';

const actionColors = {
  CREATE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  UPDATE: 'bg-accent/10 text-accent border-accent/20',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
  STATUS_CHANGE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  AUTH: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};

export default function ActionAudit() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to decrypt temporal audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => filterAction === 'ALL' || log.action === filterAction);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center border border-accent/30 shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-text-gray">Sequencing System History...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1500px] mx-auto pb-20">
      
      {/* Page Header (Scaled Down) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
                <History className="w-7 h-7 text-accent" />
            </div>
            <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark">
                    Timeline <span className="text-accent underline decoration-accent/20 underline-offset-4">Audit</span>
                </h1>
                <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                    System Registry // Immutable Protocol Logs
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="bg-card border border-border rounded-xl p-1 flex gap-0.5">
                {['ALL', 'CREATE', 'UPDATE', 'DELETE'].map(act => (
                    <button 
                        key={act}
                        onClick={() => setFilterAction(act)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black tracking-widest transition-all ${filterAction === act ? 'bg-accent text-white shadow-sm' : 'text-text-gray hover:text-text-dark'}`}
                    >
                        {act}
                    </button>
                ))}
            </div>
            <button className="p-2.5 bg-card border border-border rounded-xl text-text-gray hover:text-accent transition-all shadow-sm">
                <Download className="w-4 h-4" />
            </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 font-black uppercase tracking-widest text-xs">{error}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Timeline View (Scaled Down) */}
            <div className="lg:col-span-8 space-y-4">
                {filteredLogs.length > 0 ? (
                    <div className="relative space-y-4">
                        <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-accent/50 via-border to-transparent"></div>
                        
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="relative pl-14 group">
                                <div className="absolute left-5 top-5 w-2.5 h-2.5 rounded-full bg-card border-2 border-accent shadow-[0_0_8px_rgba(14,165,233,0.5)] group-hover:scale-125 transition-all z-10"></div>
                                
                                <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-all duration-300 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-2.5 py-1 rounded-md text-[8px] font-black tracking-widest border ${actionColors[log.action] || 'bg-white/5 border-border text-text-gray'}`}>
                                                {log.action}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-text-gray">
                                                <Database className="w-3 h-3 px-0.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{log.resource}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-text-gray bg-surface px-2 py-0.5 rounded-md">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs font-bold text-text-dark mb-4 leading-relaxed">
                                        {log.details}
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center border border-border">
                                                <User className="w-3.5 h-3.5 text-text-gray" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-text-dark uppercase tracking-tight leading-none">{log.user_name}</p>
                                                <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest leading-none mt-1">{log.user_email}</p>
                                            </div>
                                        </div>
                                        <button className="p-1.5 text-text-gray hover:text-accent transition-all">
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl p-16 text-center">
                        <Activity className="w-12 h-12 text-text-gray/20 mx-auto mb-4" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40">No Protocol Records Detected</h3>
                    </div>
                )}
            </div>

            {/* Sidebar Stats (Scaled Down) */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-gray mb-6 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-accent" />
                        Density Metrics
                    </h3>
                    
                    <div className="space-y-4">
                        {[
                            { label: 'Security Overrides', count: logs.filter(l => l.action === 'STATUS_CHANGE').length, color: 'text-amber-500' },
                            { label: 'Identity Mods', count: logs.filter(l => l.action === 'UPDATE' || l.action === 'CREATE').length, color: 'text-accent' },
                            { label: 'Purge Records', count: logs.filter(l => l.action === 'DELETE').length, color: 'text-red-500' },
                        ].map((m, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${m.color.replace('text', 'bg')}`}></div>
                                    <span className="text-[9px] font-black tracking-widest text-text-gray uppercase">{m.label}</span>
                                </div>
                                <span className={`text-xs font-black italic ${m.color}`}>{m.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-accent/5 rounded-xl border border-accent/10">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldAlert className="w-4 h-4 text-accent" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-dark">Retention Policy</span>
                        </div>
                        <p className="text-[9px] font-bold text-text-gray leading-relaxed uppercase tracking-tight">
                            Audit logs are encrypted and archived every 90 days.
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/10 rounded-xl p-6 text-center">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
                        <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-sm font-black italic uppercase tracking-tighter text-text-dark mb-1">Genesis Protocol</h3>
                    <p className="text-[8px] font-bold text-text-gray tracking-widest uppercase">Registry started: Mar 2026</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
