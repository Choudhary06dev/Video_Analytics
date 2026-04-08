import React from 'react';
import { Video, Package, AlertCircle, Target, Zap, Cloud, TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICards() {
  const stats = [
    { 
      label: 'Active Feeds', 
      value: '6', 
      total: '/6',
      icon: Video, 
      color: 'text-accent', 
      bg: 'bg-accent/10',
      trend: '+1 Recent',
      trendUp: true 
    },
    { 
      label: 'Objects Logged', 
      value: '342', 
      icon: Package, 
      color: 'text-text-dark', 
      bg: 'bg-border/50',
      trend: '+12% vs last hr',
      trendUp: true 
    },
    { 
      label: 'High Threats', 
      value: '2', 
      icon: AlertCircle, 
      color: 'text-danger', 
      bg: 'bg-danger/10',
      trend: '-1 Resolved',
      trendUp: false 
    },
    { 
      label: 'Avg Precision', 
      value: '91.4%', 
      icon: Target, 
      color: 'text-success', 
      bg: 'bg-success/10',
      trend: '+0.4% Improvement',
      trendUp: true 
    },
    { 
      label: 'Latency', 
      value: '48ms', 
      icon: Zap, 
      color: 'text-warning', 
      bg: 'bg-warning/10',
      trend: '-2ms Optimization',
      trendUp: false 
    },
    { 
      label: 'Cloud Sync', 
      value: 'Active', 
      icon: Cloud, 
      color: 'text-accent', 
      bg: 'bg-accent/10',
      trend: '99.9% Uptime',
      trendUp: true 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="group relative bg-card rounded-[22px] p-4 border border-border shadow-premium transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${stat.color === 'text-text-dark' ? 'bg-accent' : stat.bg.split(' ')[0].replace('/10', '')}`} />

          <div className="relative z-10 flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} transition-transform duration-500 group-hover:scale-110`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <div className={`flex items-center gap-1 text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${stat.trendUp ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                {stat.trendUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {stat.trend.split(' ')[0]}
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-[1.6rem] font-black tracking-tight ${stat.color === 'text-text-dark' ? 'text-text-dark' : stat.color}`}>
                  {stat.value}
                </span>
                {stat.total && (
                  <span className="text-[0.9rem] font-bold text-text-gray opacity-40">{stat.total}</span>
                )}
              </div>
              <div className="text-[0.75rem] text-text-gray font-bold uppercase tracking-wider mt-0.5">
                {stat.label}
              </div>
            </div>

            <div className="pt-1.5 mt-auto border-t border-border/50 text-[0.62rem] text-text-gray font-medium">
              {stat.trend.includes('vs') ? stat.trend : stat.trend}
            </div>
          </div>

          {/* Animated Shimmer on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
