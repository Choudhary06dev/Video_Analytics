import React from 'react';
import { Video, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function KPICards() {
  const stats = [
    { title: 'Active Cameras', value: '1,248', desc: '+12 since last week', icon: Video, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'AI Detections', value: '45.2k', desc: 'Today across all zones', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Critical Alerts', value: '18', desc: 'Require immediate review', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'System Uptime', value: '99.9%', desc: 'All storage nodes healthy', icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">{stat.desc}</p>
        </div>
      ))}
    </div>
  );
}
