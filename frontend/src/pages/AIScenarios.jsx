import React, { useState } from 'react';
import { 
  Lock, AlertTriangle, Crosshair, Users, UserX, UserPlus, UserCheck, 
  User, Phone, Flame, Car, Truck, Video, Baby, Ban, Building, Mountain, 
  Activity, Package, Search, Grid, List as ListIcon, Filter, Play, Settings
} from 'lucide-react';

const SCENARIOS = [
  { id: 1, name: 'Unauthorized Entry - Restricted Area', icon: Lock, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Detects unauthorized personnel across high-security hospital zones.', status: 'excellent', health: 99.2 },
  { id: 2, name: 'Aggressive Behaviour Detection', icon: AlertTriangle, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Real-time classification of erratic or violent movements.', status: 'good', health: 94.7 },
  { id: 3, name: 'Weapon Detection (Gun/Knife)', icon: Crosshair, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Identifies immediate lethal threats in public domains.', status: 'excellent', health: 96.8 },
  { id: 4, name: 'Multiple Persons - Single Access', icon: Users, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Detects tailgating or dual-entry at single-pass gates.', status: 'good', health: 91.2 },
  { id: 5, name: 'Blacklisted Person Alert', icon: UserX, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Instant facial recognition against central blacklist database.', status: 'excellent', health: 98.4 },
  { id: 6, name: 'Crowd Density / Overcrowding', icon: Users, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Monitors lobby and wait areas for threshold violations.', status: 'good', health: 89.5 },
  { id: 7, name: 'Visitor Count Limit Exceeded', icon: UserPlus, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Real-time counting for fire safety compliance.', status: 'excellent', health: 95.1 },
  { id: 8, name: 'Entry/Exit Tracking - Visitors', icon: UserCheck, color: 'var(--color-accent)', image: 'https://www.satoamerica.com/adobe/dynamicmedia/deliver/dm-aid--804938e5-4588-4adc-a9d8-bffc50491998/sol-078.png?quality=85&preferwebp=true', desc: 'Bidirectional tracking of visitor flow patterns.', status: 'excellent', health: 97.9 },
  { id: 9, name: 'Staff Presence/Absence at Post', icon: User, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Verifies staff positioning at critical healthcare nodes.', status: 'good', health: 92.4 },
  { id: 10, name: 'Mobile Phone Usage - Restricted', icon: Phone, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Detects phone usage in high-radiation or sterile zones.', status: 'warning', health: 86.2 },
  { id: 11, name: 'Fire / Smoke Detection', icon: Flame, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Convolutional neural net for smoke and flame patterns.', status: 'excellent', health: 99.8 },
  { id: 12, name: 'Vehicle Observation', icon: Car, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Tracks ambulance and vehicle arrivals at emergency bay.', status: 'excellent', health: 98.1 },
  { id: 13, name: 'Unauthorized Parking / Blockage', icon: Truck, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Alerts if emergency routes are blocked by vehicles.', status: 'excellent', health: 94.3 },
  { id: 14, name: 'Camera Recording Failure', icon: Video, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Diagnostic tool for signal loss or storage failure.', status: 'critical', health: 42.5 },
  { id: 15, name: 'Motion Outside Routes', icon: Baby, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Detects patients or babies moving out of safe zones.', status: 'good', health: 91.8 },
  { id: 16, name: 'Unauthorized Handling', icon: Ban, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Detects physical contact with babies by unauthorized staff.', status: 'excellent', health: 97.2 },
  { id: 17, name: 'Object Left Unattended', icon: Package, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Tracks unidentified baggage or items in corridors.', status: 'good', health: 90.1 },
  { id: 18, name: 'Movement in Closed Areas', icon: Building, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Motion profiling in locked or night-only departments.', status: 'excellent', health: 96.5 },
  { id: 19, name: 'Boundary Crossing', icon: Mountain, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Detects wall jumps or perimeter fence breaches.', status: 'excellent', health: 98.7 },
  { id: 20, name: 'Grouped Activity', icon: Users, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Identifies unusual gatherings of 3+ individuals.', status: 'good', health: 93.4 },
  { id: 21, name: 'Safety Violation', icon: AlertTriangle, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Monitors PPE compliance (Gloves, Gowns, Masks).', status: 'excellent', health: 95.8 },
];

export default function AIScenarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const filtered = SCENARIOS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">Vision Algorithms</h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            Intelligence Matrix Configuration
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            21 Models Deployed
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-accent text-white shadow-md' : 'text-text-gray hover:text-text-dark'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow-md' : 'text-text-gray hover:text-text-dark'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[0.75rem] font-bold cursor-pointer hover:opacity-90 shadow-premium">
            <Play className="w-4 h-4 fill-white" />
            Deploy New Instance
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-card rounded-[14px] p-6 border border-border shadow-premium flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-gray" />
          <input 
            type="text" 
            placeholder="Search vision models by name or category..." 
            className="w-full pl-12 pr-4 py-3 bg-bg border border-border rounded-2xl text-[0.88rem] focus:outline-none focus:border-accent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex items-center gap-2 px-5 py-3 bg-bg border border-border rounded-2xl text-[0.85rem] font-bold text-text-gray hover:border-accent hover:text-accent transition-all whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Severity Filter
          </button>
          <div className="h-10 w-px bg-border hidden md:block" />
          <div className="text-[0.85rem] text-text-gray font-bold whitespace-nowrap">
            Showing <span className="text-text-dark">{filtered.length}</span> models
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        {filtered.map((scenario, index) => (
          <div 
            key={scenario.id}
            className={`bg-card rounded-[14px] border border-border transition-all duration-400 overflow-hidden relative group hover:shadow-premium
              ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-row items-center p-4'}`}
          >
            {/* Image / Icon Header */}
            <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'h-[140px]' : 'w-24 h-24 rounded-xl shrink-0'}`}>
              <div className="absolute inset-0 z-10 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={scenario.image} alt={scenario.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {viewMode === 'grid' && (
                <div 
                  className={`absolute top-4 left-4 z-20 w-12 h-12 rounded-2xl bg-card/90 backdrop-blur-md shadow-lg flex items-center justify-center border-2 border-status transition-colors`}
                  style={{ borderColor: scenario.status === 'critical' ? 'var(--color-danger)' : scenario.status === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}
                >
                  <scenario.icon className="w-6 h-6" style={{ color: scenario.color }} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`flex flex-col flex-1 ${viewMode === 'grid' ? 'p-6 -mt-4 relative z-30' : 'px-6 py-2'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[0.95rem] font-black text-text-dark leading-tight group-hover:text-accent transition-colors truncate pr-4">
                  {scenario.name}
                </h3>
                {viewMode === 'list' && (
                  <div 
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-status`}
                    style={{ borderColor: scenario.status === 'critical' ? 'var(--color-danger)' : scenario.status === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}
                  >
                    <scenario.icon className="w-4 h-4" style={{ color: scenario.color }} />
                  </div>
                )}
              </div>
              
              <p className={`text-[0.78rem] text-text-gray font-semibold mb-6 leading-relaxed ${viewMode === 'grid' ? 'line-clamp-2' : 'max-w-2xl'}`}>
                {scenario.desc}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                <div className="flex flex-col gap-1">
                  <div className="text-[0.6rem] text-text-gray font-black uppercase tracking-wider">Model Health</div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-bg rounded-full overflow-hidden border border-border">
                      <div className={`h-full rounded-full ${scenario.health > 90 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${scenario.health}%` }} />
                    </div>
                    <span className="text-[0.7rem] font-black text-text-dark">{scenario.health}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-bg border border-border rounded-xl text-text-gray hover:text-accent hover:border-accent transition-all">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button className="px-3 py-2 bg-accent/10 text-accent rounded-xl text-[0.7rem] font-bold hover:bg-accent hover:text-white transition-all">
                    Configure
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status Badge Overlays */}
            <div 
              className={`absolute top-4 right-4 z-30 px-3 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest text-white shadow-lg
              ${scenario.status === 'critical' ? 'bg-danger' : scenario.status === 'warning' ? 'bg-warning' : 'bg-success'}`}
            >
              {scenario.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
