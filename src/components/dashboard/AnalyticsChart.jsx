import React from 'react';
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
    { time: '10:00', detections: 42, alerts: 2 },
    { time: '10:05', detections: 38, alerts: 1 },
    { time: '10:10', detections: 55, alerts: 4 },
    { time: '10:15', detections: 45, alerts: 2 },
    { time: '10:20', detections: 60, alerts: 5 },
    { time: '10:25', detections: 48, alerts: 1 },
    { time: '10:30', detections: 52, alerts: 3 },
  ];

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-premium w-full transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] flex flex-col h-full">
      <div className="flex justify-between items-center mb-5 shrink-0">
        <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Real-time Detection Analytics</h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] font-bold tracking-wide">
          <span className="w-1 h-1 bg-success rounded-full animate-[pulse_1.5s_infinite]" />
          Live
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: 'var(--color-text-gray)', fontSize: 12, fontWeight: 500}} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: 'var(--color-text-gray)', fontSize: 12, fontWeight: 500}} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                borderRadius: '12px', 
                border: '1px solid var(--color-border)', 
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                color: 'var(--color-text-gray)'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: '500' }}
              labelStyle={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-dark)', marginBottom: '4px' }}
              cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="detections" 
              name="Detections/min"
              stroke="var(--color-accent)" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorDetections)" 
              animationDuration={1500}
            />
            <Area 
              type="monotone" 
              dataKey="alerts" 
              name="Active Alerts"
              stroke="var(--color-danger)" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorAlerts)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
