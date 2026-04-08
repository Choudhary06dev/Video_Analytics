import React from 'react';
import { Video, Package, AlertCircle, Target, Zap, Cloud } from 'lucide-react';

export default function KPICards() {
  const stats = [
    { label: 'Active Feeds', value: '6/6', icon: Video, color: 'text-text-gray opacity-70', valColor: 'text-text-dark', valueSuffix: '/6' },
    { label: 'Objects Logged', value: '342', icon: Package, color: 'text-text-gray opacity-70', valColor: 'text-text-dark' },
    { label: 'High Threats', value: '2', icon: AlertCircle, color: 'text-danger', valColor: 'text-danger' },
    { label: 'Avg Precision', value: '91.4%', icon: Target, color: 'text-accent', valColor: 'text-text-dark' },
    { label: 'Latency', value: '48ms', icon: Zap, color: 'text-warning', valColor: 'text-text-dark' },
    { label: 'Cloud Sync', value: 'Active', icon: Cloud, color: 'text-text-gray opacity-70', valColor: 'text-text-dark' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[18px] shrink-0">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="bg-card rounded-[20px] p-6 border border-border shadow-premium flex flex-col items-center gap-3 text-center transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.12)] group"
        >
          {/* Subtle Hover Glow */}
          <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(14,165,233,0.05)_0%,transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
          
          <stat.icon className={`w-5 h-5 ${stat.color} z-10`} />
          <div className={`text-[1.4rem] font-extrabold z-10 ${stat.valColor}`}>
            {stat.valueSuffix ? (
              <>
                {stat.value.replace(stat.valueSuffix, '')}
                <span className="opacity-30 font-semibold">{stat.valueSuffix}</span>
              </>
            ) : (
              stat.value
            )}
          </div>
          <div className="text-[0.75rem] text-text-gray font-semibold z-10">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
