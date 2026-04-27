import React, { useState, useEffect } from 'react';
import { fetchAuditLogs as apiFetchAuditLogs } from '../../services/userService'; 

import { 
  Terminal, 
  History, 
  ShieldCheck, 
  Activity,
  ChevronRight,
  Clock,
  User
} from 'lucide-react';
import { get } from '../../services/api';

export default function AdminAuditBox() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
    const interval = setInterval(loadAuditLogs, 5000);
    return () => clearInterval(interval);
  }, []);


  const loadAuditLogs = async () => {
    try {
      // Direct call to /admin/users/audit-logs
      const data = await get("/admin/users/audit-logs?limit=10");
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-[#0b1120] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative group">
      {/* Aesthetic Scanline */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10 opacity-20" />
      
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent/20 rounded-lg border border-accent/30">
            <Terminal className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Kernel Audit Feed</h3>
            <p className="text-[7px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Real-time Infrastructure Logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/80 font-mono">LINK_ESTABLISHED</span>
        </div>
      </div>

      <div className="p-4 space-y-3 font-mono h-[300px] overflow-y-auto custom-scrollbar relative z-20">
        {loading && logs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              <span className="text-[8px] text-white/20 uppercase tracking-widest">Decrypting Logs...</span>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-20">
            <span className="text-[8px] text-white uppercase tracking-widest">No activity detected</span>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={log.id || i} className="group/item flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex flex-col items-center gap-1 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  log.action === 'CREATE' ? 'bg-emerald-500' : 
                  log.action === 'DELETE' ? 'bg-rose-500' : 'bg-accent'
                } shadow-[0_0_5px_currentColor]`} />
                <div className="w-[1px] flex-1 bg-white/5 group-last/item:hidden" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-[8px] font-black">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}]</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                      log.action === 'DELETE' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                      'bg-accent/10 text-accent border border-accent/20'
                    } uppercase tracking-tighter`}>{log.action}</span>
                    <span className="text-white/60 tracking-tight">{log.resource}</span>
                  </div>
                  <span className="text-white/20 group-hover/item:text-white/40 transition-colors flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    {log.user_name}
                  </span>
                </div>
                <p className="text-[9px] text-white/50 leading-relaxed group-hover/item:text-white/80 transition-colors">
                  {log.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.3); }
      `}} />
    </div>
  );
}
