import React, { useEffect, useState } from 'react';
import { 
  Lock, AlertTriangle, Crosshair, Users, UserX, UserPlus, UserCheck, 
  User, Phone, Flame, Car, Truck, Video, Baby, Ban, Building, Mountain, 
  Activity, Package 
} from 'lucide-react';

const SCENARIOS = [
  { id: 1, name: 'Unauthorized Entry - Restricted Area', icon: Lock, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=400' },
  { id: 2, name: 'Aggressive Behaviour Detection', icon: AlertTriangle, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=400' },
  { id: 3, name: 'Weapon Detection (Gun/Knife)', icon: Crosshair, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400' },
  { id: 4, name: 'Multiple Persons - Single Access', icon: Users, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400' },
  { id: 5, name: 'Blacklisted Person Alert', icon: UserX, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400' },
  { id: 6, name: 'Crowd Density / Overcrowding', icon: Users, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400' },
  { id: 7, name: 'Visitor Count Limit Exceeded', icon: UserPlus, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400' },
  { id: 8, name: 'Entry/Exit Tracking - Visitors', icon: UserCheck, color: 'var(--color-accent)', image: 'https://www.satoamerica.com/adobe/dynamicmedia/deliver/dm-aid--804938e5-4588-4adc-a9d8-bffc50491998/sol-078.png?quality=85&preferwebp=true' },
  { id: 9, name: 'Staff Presence/Absence at Post', icon: User, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400' },
  { id: 10, name: 'Mobile Phone Usage - Restricted', icon: Phone, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400' },
  { id: 11, name: 'Fire / Smoke Detection', icon: Flame, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400' },
  { id: 12, name: 'Vehicle Observation', icon: Car, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400' },
  { id: 13, name: 'Unauthorized Parking / Blockage', icon: Truck, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=400' },
  { id: 14, name: 'Camera Recording Failure', icon: Video, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400' },
  { id: 15, name: 'Motion Outside Routes', icon: Baby, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=400' },
  { id: 16, name: 'Unauthorized Handling', icon: Ban, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=400' },
  { id: 17, name: 'Object Left Unattended', icon: Package, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=400' },
  { id: 18, name: 'Movement in Closed Areas', icon: Building, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=400' },
  { id: 19, name: 'Boundary Crossing', icon: Mountain, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=400' },
  { id: 20, name: 'Grouped Activity', icon: Users, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400' },
  { id: 21, name: 'Safety Violation', icon: AlertTriangle, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400' },
];

export default function AIScenarioGrid() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Simulate real-time data for scenarios
    const initialData = SCENARIOS.map(s => {
      const rand = Math.random();
      let status = 'normal';
      if (rand > 0.9) status = 'critical';
      else if (rand > 0.7) status = 'warning';
      
      return { 
        ...s, 
        count: Math.floor(Math.random() * 50),
        status 
      };
    });
    setData(initialData);
  }, []);

  const getStatusInfo = (status) => {
    switch(status) {
      case 'critical': return { bg: 'bg-danger', label: 'CRITICAL', shadow: 'shadow-[0_4px_12px_rgba(239,68,68,0.4)]', iconColor: 'text-danger' };
      case 'warning': return { bg: 'bg-warning', label: 'ALERT', shadow: 'shadow-[0_4px_12px_rgba(245,158,11,0.4)]', iconColor: 'text-warning' };
      default: return { bg: 'bg-success', label: 'MONITORING', shadow: 'shadow-[0_4px_12px_rgba(34,197,94,0.4)]', iconColor: 'text-success' };
    }
  };

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-premium w-full mt-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Video Analytics Scenarios</h3>
        <div className="bg-accent-soft text-accent px-3 py-1 rounded-full text-[0.7rem] font-extrabold flex items-center gap-1.5 border border-accent-soft">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          Monitoring 21 Categories
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {data.map((scenario, index) => {
          const info = getStatusInfo(scenario.status);
          return (
            <div 
              key={scenario.id}
              className="bg-card rounded-2xl border border-border transition-all duration-400 overflow-hidden relative hover:-translate-y-1 hover:shadow-premium group"
            >
              {/* Header Image with gradient */}
              <div className="h-[100px] overflow-hidden relative">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-card to-transparent" />
                <img src={scenario.image} alt={scenario.name} className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-110" />
              </div>

              <div className="p-5 pt-0 relative z-20">
                <div className="flex justify-between items-start mb-3 -mt-9">
                  <div className={`w-14 h-14 bg-card rounded-full flex items-center justify-center shadow-lg border-3 border-status transition-colors`} style={{ borderColor: scenario.status === 'critical' ? 'var(--color-danger)' : scenario.status === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    <scenario.icon className="w-6 h-6" style={{ color: scenario.color }} />
                  </div>
                  <div className={`text-[0.65rem] font-extrabold px-2.5 py-1 rounded-full text-white ${info.bg} ${info.shadow}`}>
                    {info.label}
                  </div>
                </div>

                <div className="text-[0.82rem] font-bold text-text-dark mb-3 min-h-[40px] leading-tight group-hover:text-accent transition-colors">
                  {scenario.name}
                </div>

                <div className="flex items-center justify-between bg-bg p-3 rounded-xl">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-xl font-black ${info.iconColor}`}>{scenario.count}</span>
                    <span className="text-[0.6rem] text-text-gray font-bold uppercase tracking-wider">today</span>
                  </div>
                  <div className="text-[0.65rem] text-text-gray font-bold flex items-center gap-1.5">
                    <Activity className={`w-3 h-3 ${info.iconColor}`} />
                    Live
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
