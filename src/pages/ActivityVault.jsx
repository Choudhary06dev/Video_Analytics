import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ActivityVault() {
  const [activities, setActivities] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const tasks = [
      { name: 'Deep Clean', type: 'cleaning' },
      { name: 'Patrol Check', type: 'patrol' },
      { name: 'Equipment Monitor', type: 'monitor' },
      { name: 'Sanitization', type: 'cleaning' },
      { name: 'Security Round', type: 'patrol' },
      { name: 'Temperature Check', type: 'monitor' }
    ];

    const statuses = ['completed', 'completed', 'completed', 'in-progress', 'in-progress', 'pending'];
    const workers = ['Maria Santos', 'John Rivera', 'Tom Wilson', 'Lisa Chen', 'Robert Fox', 'Sarah Miller'];

    const generated = [];
    for (let i = 0; i < 20; i++) {
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const confidence = status === 'completed' ? (92 + Math.random() * 7.9) : (status === 'in-progress' ? (75 + Math.random() * 20) : (60 + Math.random() * 25));
      const worker = workers[Math.floor(Math.random() * workers.length)];

      generated.push({
        id: `ACT-${1000 + i}`,
        worker,
        workerInitial: worker.split(' ').map(n => n[0]).join(''),
        task: task.name,
        taskType: task.type,
        confidence: confidence.toFixed(1),
        status,
        timeAgo: `${Math.floor(Math.random() * 59) + 1}m ago`,
        fullTime: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
    setActivities(generated);
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'in-progress': return 'bg-accent-soft text-accent border-accent/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getConfidenceColor = (conf) => {
    const val = parseFloat(conf);
    if (val >= 90) return 'bg-success';
    if (val >= 75) return 'bg-accent';
    return 'bg-warning';
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">Activity Vault</h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            AI-Audited Historical Record matrix
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            2,842 Total Records
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-[0.8rem] font-bold cursor-pointer transition-all hover:opacity-90 shadow-premium">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Audits', value: '2,842', trend: '+12%', icon: ClipboardList, color: 'text-accent', bg: 'bg-accent-soft' },
          { label: 'High Confidence', value: '94.2%', trend: '+0.8%', icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Avg Process Time', value: '4.2s', trend: '-0.3s', icon: Zap, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'System Alerts', value: '14', trend: '+2', icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-[24px] p-6 border border-border shadow-premium flex flex-col justify-between hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <span className={`text-[0.7rem] font-bold px-2 py-1 rounded-lg ${s.trend.startsWith('+') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {s.trend}
              </span>
            </div>
            <div>
              <p className="text-[1.8rem] font-black text-text-dark mb-0.5">{s.value}</p>
              <p className="text-[0.75rem] font-bold text-text-gray uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-card rounded-[28px] border border-border shadow-premium overflow-hidden flex flex-col min-h-[600px]">
        {/* Table Controls */}
        <div className="p-8 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 max-w-2xl font-sans">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-gray" />
              <input 
                type="text" 
                placeholder="Search by Activity ID, Worker, or Task Type..." 
                className="w-full pl-12 pr-4 py-3 bg-bg border border-border rounded-2xl text-[0.88rem] focus:outline-none focus:border-accent transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-5 py-3 bg-bg border border-border rounded-2xl text-[0.85rem] font-bold text-text-gray hover:border-accent hover:text-accent transition-all">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
          <div className="flex items-center gap-2 text-[0.85rem] text-text-gray font-bold">
            Showing <span className="text-text-dark">1-10</span> of <span className="text-text-dark">2,842</span> results
          </div>
        </div>

        {/* The Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/50 border-b border-border">
                <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">ID</th>
                <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Worker</th>
                <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Task</th>
                <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">AI Confidence</th>
                <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Status</th>
                <th className="px-8 py-5 text-[0.65rem] font-black text-text-gray uppercase tracking-[1.5px]">Timeline</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-bg/30 transition-colors group">
                  <td className="px-8 py-6 text-[0.8rem] font-black text-accent">#{act.id}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-[0.85rem] shadow-sm">
                        {act.workerInitial}
                      </div>
                      <span className="text-[0.9rem] font-bold text-text-dark">{act.worker}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-bold border ${act.taskType === 'patrol' ? 'bg-accent-soft text-accent border-accent/20' : act.taskType === 'cleaning' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                      {act.task}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-[1s] ease-out ${getConfidenceColor(act.confidence)}`}
                          style={{ width: loaded ? `${act.confidence}%` : '0%' }}
                        />
                      </div>
                      <span className={`text-[0.85rem] font-black ${parseFloat(act.confidence) >= 90 ? 'text-success' : 'text-accent'}`}>
                        {act.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-wider border ${getStatusStyle(act.status)}`}>
                      {act.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-[0.85rem] font-bold text-text-dark">{act.timeAgo}</div>
                    <div className="text-[0.65rem] font-bold text-text-gray">{act.fullTime}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-text-gray hover:text-text-dark transition-colors p-2 hover:bg-bg rounded-lg">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-bg/20">
          <div className="text-[0.8rem] text-text-gray font-bold">
            Showing <span className="text-text-dark">10</span> of <span className="text-text-dark">2,842</span> activities
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-border rounded-xl text-text-gray hover:border-accent hover:text-accent transition-all disabled:opacity-30" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-10 h-10 bg-accent text-white rounded-xl text-[0.85rem] font-bold shadow-md">1</button>
              <button className="w-10 h-10 hover:bg-bg rounded-xl text-[0.85rem] font-bold text-text-gray transition-colors">2</button>
              <button className="w-10 h-10 hover:bg-bg rounded-xl text-[0.85rem] font-bold text-text-gray transition-colors">3</button>
              <span className="px-2 text-text-gray font-bold">...</span>
              <button className="w-10 h-10 hover:bg-bg rounded-xl text-[0.85rem] font-bold text-text-gray transition-colors">284</button>
            </div>
            <button className="p-2 border border-border rounded-xl text-text-gray hover:border-accent hover:text-accent transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
