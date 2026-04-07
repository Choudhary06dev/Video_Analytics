import React from 'react';
import { Activity } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function AnalyticsChart() {
  const analyticsData = [
    { time: '00:00', detections: 12 },
    { time: '04:00', detections: 5 },
    { time: '08:00', detections: 45 },
    { time: '12:00', detections: 80 },
    { time: '16:00', detections: 65 },
    { time: '20:00', detections: 30 },
    { time: '24:00', detections: 15 },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 shrink-0">
        <Activity className="w-5 h-5 text-indigo-500" /> System Activity
      </h2>
      
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analyticsData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#4f46e5', fontWeight: '600' }}
            />
            <Area type="monotone" dataKey="detections" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorDetections)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
