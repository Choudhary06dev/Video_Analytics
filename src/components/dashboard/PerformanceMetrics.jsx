import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const detectionData = [
  { name: '00:00', value: 32 },
  { name: '04:00', value: 18 },
  { name: '08:00', value: 54 },
  { name: '12:00', value: 72 },
  { name: '16:00', value: 65 },
  { name: '20:00', value: 42 },
  { name: '24:00', value: 25 },
];

const cameraData = [
  { name: 'CAM-1', value: 98 },
  { name: 'CAM-2', value: 92 },
  { name: 'CAM-3', value: 75 },
  { name: 'CAM-4', value: 95 },
  { name: 'CAM-5', value: 88 },
  { name: 'CAM-6', value: 91 },
];

export default function PerformanceMetrics() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 mt-8">
      {/* Detection Count Chart */}
      <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-premium flex flex-col h-[380px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Detection Count (24h)</h3>
          <button className="px-3 py-1 bg-bg border border-border rounded-lg text-[0.7rem] font-bold text-text-gray hover:border-accent hover:text-accent transition-all">
            View Details
          </button>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={detectionData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--color-text-gray)', fontSize: 11, fontWeight: 500}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--color-text-gray)', fontSize: 11, fontWeight: 500}} 
              />
              <Tooltip 
                cursor={{fill: 'var(--color-accent-soft)', opacity: 0.4}}
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Bar 
                dataKey="value" 
                fill="var(--color-accent)" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Camera Performance Chart */}
      <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-premium flex flex-col h-[380px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Camera Performance</h3>
          <div className="bg-success/20 text-success px-3 py-1 rounded-full text-[0.7rem] font-extrabold border border-success/20">
            All Online
          </div>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cameraData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--color-text-gray)', fontSize: 11, fontWeight: 500}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--color-text-gray)', fontSize: 11, fontWeight: 500}} 
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                formatter={(val) => [`${val}%`, 'Efficiency']}
              />
              <Bar 
                dataKey="value" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              >
                {cameraData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value > 90 ? 'var(--color-success)' : entry.value > 80 ? 'var(--color-accent)' : 'var(--color-warning)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
