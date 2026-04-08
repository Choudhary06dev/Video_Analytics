import React from 'react';
import { ShieldAlert, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecentAlerts() {
  const recentAlerts = [
    { id: 1, type: 'critical', message: 'Unauthorized Entry', time: '2 mins ago', location: 'Server Room' },
    { id: 2, type: 'warning', message: 'Crowd Threshold', time: '14 mins ago', location: 'Main Lobby' },
    { id: 3, type: 'info', message: 'New Device Registered', time: '45 mins ago', location: 'Gate 2' },
    { id: 4, type: 'critical', message: 'Sensor Tamper', time: '1h ago', location: 'Perimeter B' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
        <Link to="/alerts" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
          View All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-50">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                alert.type === 'critical' ? 'bg-rose-50 text-rose-600' : 
                alert.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {alert.type === 'critical' ? <ShieldAlert className="w-5 h-5" /> : 
                 alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-sm font-bold text-slate-800 truncate">{alert.message}</p>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">{alert.time}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">{alert.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 bg-slate-50/50">
        <div className="p-3 bg-indigo-600 rounded-xl flex items-center justify-between text-white shadow-lg shadow-indigo-100">
           <div className="flex flex-col">
             <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest leading-tight">System Status</span>
             <span className="text-xs font-bold">ALL NODES ONLINE</span>
           </div>
           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
