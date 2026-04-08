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
  BellRing
} from 'lucide-react';

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('all');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const alertsData = [
    { id: 'ALT-892', type: 'critical', message: 'Unauthorized entry detected in Server Room B', source: 'CAM-05 Secure Zone', time: '2 mins ago', status: 'unread', priority: 'high' },
    { id: 'ALT-891', type: 'warning', message: 'Crowd density exceeded threshold in main lobby', source: 'CAM-06 Reception', time: '15 mins ago', status: 'unread', priority: 'medium' },
    { id: 'ALT-890', type: 'info', message: 'VIP Person Identified: Board Member 02', source: 'CAM-01 Main Gate', time: '1h ago', status: 'read', priority: 'low' },
    { id: 'ALT-889', type: 'critical', message: 'Weapon signature detected in Parking Lot C', source: 'CAM-12 Storage', time: '3h ago', status: 'read', priority: 'high' },
    { id: 'ALT-888', type: 'warning', message: 'Object left unattended in Emergency Ramp', source: 'CAM-08 Loading Bay', time: '5h ago', status: 'read', priority: 'medium' },
    { id: 'ALT-887', type: 'info', message: 'Night Shift Staff Rotation: 12 members in', source: 'CAM-03 Office', time: '8h ago', status: 'read', priority: 'low' },
    { id: 'ALT-886', type: 'critical', message: 'Fire/Thermal anomaly detected in Cafeteria', source: 'CAM-15 Kitchen', time: '12h ago', status: 'resolved', priority: 'high' },
  ];

  const filteredAlerts = activeTab === 'all' ? alertsData : alertsData.filter(a => a.type === activeTab);

  const getSeverityStyles = (type) => {
    switch(type) {
      case 'critical': return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20', icon: ShieldAlert };
      case 'warning': return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: AlertTriangle };
      default: return { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', icon: Info };
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase flex items-center gap-3">
             <BellRing className="w-8 h-8 text-danger animate-bounce" />
             Crisis Response Center
          </h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            Intelligent Incident Management Matrix
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            14 Active Alerts
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-danger text-white rounded-xl text-[0.8rem] font-bold cursor-pointer transition-all hover:opacity-90 shadow-[0_4px_12px_rgba(239,68,68,0.3)]">
            <ShieldAlert className="w-4 h-4" />
            Initiate Lockdown
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-card text-text-dark border border-border rounded-xl text-[0.75rem] font-bold cursor-pointer hover:border-accent hover:text-accent shadow-sm">
            <Download className="w-4 h-4" />
            Full Audit Log
          </button>
        </div>
      </div>

      {/* Alert Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Active Critical', value: '4', color: 'text-danger', bg: 'bg-danger/10', icon: ShieldAlert },
          { label: 'Pending Warnings', value: '7', color: 'text-warning', bg: 'bg-warning/10', icon: AlertTriangle },
          { label: 'Notifications', value: '3', color: 'text-accent', bg: 'bg-accent-soft', icon: Info },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-[24px] p-6 border border-border shadow-premium flex items-center gap-5 hover:-translate-y-1 transition-all group">
            <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center ${s.color}`}>
              <s.icon className={`w-7 h-7 ${i === 0 && 'animate-pulse'}`} />
            </div>
            <div>
              <p className="text-[2rem] font-black text-text-dark mb-0.5">{s.value}</p>
              <p className="text-[0.75rem] font-bold text-text-gray uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Search */}
      <div className="bg-card rounded-[28px] border border-border shadow-premium overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-8 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Custom Tabs */}
          <div className="flex bg-bg p-1.5 rounded-2xl border border-border">
            {['all', 'critical', 'warning', 'info'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[0.8rem] font-bold capitalize transition-all
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
                    placeholder="Search incidents by ID, camera, or detail..." 
                    className="w-full pl-12 pr-4 py-3 bg-bg border border-border rounded-2xl text-[0.88rem] focus:outline-none focus:border-accent transition-all"
                />
             </div>
             <button className="p-3 bg-bg border border-border rounded-2xl text-text-gray hover:text-danger hover:border-danger transition-all">
                <Trash2 className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Alerts Log Table */}
        <div className="flex-1 overflow-x-auto">
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
              {filteredAlerts.map((alert) => {
                const style = getSeverityStyles(alert.type);
                return (
                  <tr key={alert.id} className="hover:bg-bg/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="text-[0.75rem] font-black text-text-gray opacity-40">#{alert.id}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                        <style.icon className="w-3.5 h-3.5" />
                        {alert.type}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-0.5">
                         <span className={`text-[0.95rem] font-black tracking-tight ${alert.status === 'unread' ? 'text-text-dark' : 'text-text-gray'}`}>
                            {alert.message}
                         </span>
                         {alert.status === 'unread' && (
                           <div className="flex items-center gap-2">
                             <span className="text-[0.6rem] font-black text-danger uppercase tracking-tighter">New Protocol Active</span>
                             <div className="w-1 h-1 bg-danger rounded-full animate-pulse" />
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2.5 text-text-gray font-bold text-[0.8rem]">
                          <MapPin className="w-4 h-4 text-accent" />
                          {alert.source}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-text-gray font-bold text-[0.8rem]">
                          <Clock className="w-4 h-4 opacity-40" />
                          {alert.time}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                          <button className="p-2.5 bg-accent-soft text-accent rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm" title="View Stream">
                             <Video className="w-4.5 h-4.5" />
                          </button>
                          <button className="p-2.5 bg-success/10 text-success rounded-xl hover:bg-success hover:text-white transition-all shadow-sm" title="Resolve Incident">
                             <CheckCircle2 className="w-4.5 h-4.5" />
                          </button>
                          <button className="p-2.5 bg-bg border border-border rounded-xl text-text-gray hover:text-text-dark transition-all shadow-sm">
                             <MoreHorizontal className="w-4.5 h-4.5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAlerts.length === 0 && (
            <div className="py-24 text-center">
               <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center text-text-gray/20 mx-auto mb-4 border border-border shadow-inner">
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
               System Health: <span className="text-success uppercase">Acknowledge Active</span>
            </div>
            <div className="flex gap-4">
               <button className="px-6 py-2.5 bg-card border border-border rounded-xl text-[0.8rem] font-bold text-text-gray hover:text-text-dark transition-all">
                  Previous 24h
               </button>
               <button className="px-6 py-2.5 bg-accent text-white rounded-xl text-[0.8rem] font-bold hover:opacity-90 shadow-premium transition-all">
                  Acknowledge All
               </button>
            </div>
        </div>
      </div>
    </div>
  );
}
