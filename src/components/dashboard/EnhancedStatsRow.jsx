import React from 'react';
import { Target, Zap, Activity, Video } from 'lucide-react';

const stats = [
  { 
    label: 'Detection Precision', 
    value: '91.4%', 
    icon: Target, 
    bg: 'bg-gradient-to-br from-accent to-[#0369a1]', 
    shadow: 'shadow-[0_10px_20px_rgba(14,165,233,0.3)]' 
  },
  { 
    label: 'Latency', 
    value: '48ms', 
    icon: Zap, 
    bg: 'bg-gradient-to-br from-warning to-[#b45309]', 
    shadow: 'shadow-[0_10px_20px_rgba(245,158,11,0.3)]' 
  },
  { 
    label: 'Objects Tracked', 
    value: '342', 
    icon: Activity, 
    bg: 'bg-gradient-to-br from-success to-[#15803d]', 
    shadow: 'shadow-[0_10px_20px_rgba(34,197,94,0.3)]' 
  },
  { 
    label: 'Active Feeds', 
    value: '6/6', 
    icon: Video, 
    bg: 'bg-gradient-to-br from-text-dark to-[#1e293b]', 
    shadow: 'shadow-[0_10px_20px_rgba(15,23,42,0.3)]' 
  },
];

export default function EnhancedStatsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className={`p-6 rounded-[20px] flex items-center gap-4 text-white border-none transition-all duration-300 hover:-translate-y-1 ${stat.bg} ${stat.shadow}`}
        >
          <div className="bg-white/20 p-3 rounded-xl">
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[0.75rem] font-semibold opacity-80 uppercase tracking-[1px]">
              {stat.label}
            </div>
            <div className="text-[1.5rem] font-black">
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
