import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export default function ConfidencePanel() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const metrics = [
    { label: 'PERSON', value: 94.2, color: 'text-accent', bg: 'bg-accent', gradient: 'bg-gradient-to-r from-accent to-blue-400' },
    { label: 'VEHICLE', value: 96.8, color: 'text-success', bg: 'bg-success', gradient: 'bg-success' },
    { label: 'OBJECT', value: 89.4, color: 'text-warning', bg: 'bg-warning', gradient: 'bg-warning' },
    { label: 'FACE', value: 91.7, color: 'text-accent', bg: 'bg-accent', gradient: 'bg-gradient-to-r from-accent to-blue-400' },
  ];

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-premium w-full transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] block">
      <h3 className="text-[1.1rem] font-bold text-text-dark mb-5">Detection Confidence</h3>
      
      <div className="flex flex-col gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx}>
            <div className="flex justify-between mb-1.5">
              <span className="text-[0.8rem] font-semibold text-text-gray">{metric.label}</span>
              <span className={`text-[0.9rem] font-extrabold ${metric.color}`}>
                {metric.value}%
              </span>
            </div>
            <div className="h-2 bg-accent-soft rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-[1.5s] ease-out ${metric.gradient}`}
                style={{ width: loaded ? `${metric.value}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-br from-accent-soft to-[rgba(14,165,233,0.05)] rounded-xl border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[0.75rem] font-semibold text-text-gray tracking-wider uppercase">Avg Confidence</span>
          <Activity className="w-4 h-4 text-accent" />
        </div>
        <div className="text-[1.8rem] font-extrabold text-accent">92.8%</div>
        <div className="text-[0.7rem] text-success font-semibold mt-1">↑ 2.1% from yesterday</div>
      </div>
    </div>
  );
}
