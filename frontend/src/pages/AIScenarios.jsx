import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock, AlertTriangle, Crosshair, Users, UserX, UserPlus, UserCheck,
  User, Phone, Flame, Car, Truck, Video, Baby, Ban, Building, Mountain,
  Activity, Package, Search, Grid, List as ListIcon, Filter, Play, Settings
} from 'lucide-react';

const SCENARIOS = [
  { id: 1, name: 'Unauthorized entry into restricted areas', icon: Lock, color: 'var(--color-danger)', image: '/assets/images/restricted_entry.png', desc: 'Detects unauthorized personnel across high-security hospital zones.', status: 'critical', health: 99.2 },
  { id: 2, name: 'Aggressive behaviour detection', icon: AlertTriangle, color: 'var(--color-warning)', image: '/assets/images/aggressive_behavior.png', desc: 'Real-time classification of erratic or violent movements.', status: 'good', health: 94.7 },
  { id: 3, name: 'Weapon detection (gun/knife)', icon: Crosshair, color: 'var(--color-danger)', image: '/assets/images/weapon_detection.png', desc: 'Identifies immediate lethal threats in public domains.', status: 'critical', health: 96.8 },
  { id: 4, name: 'Multiple persons entry on single access', icon: Users, color: 'var(--color-warning)', image: '/assets/images/tailgating.png', desc: 'Detects tailgating or dual-entry at single-pass gates.', status: 'good', health: 91.2 },
  { id: 5, name: 'Blacklisted person alert (facial recognition)', icon: UserX, color: 'var(--color-danger)', image: '/assets/images/blacklist_alert.png', desc: 'Instant facial recognition against central blacklist database.', status: 'critical', health: 98.4 },
  { id: 6, name: 'Crowd density / overcrowding detection', icon: Users, color: 'var(--color-warning)', image: '/assets/images/crowd_density.png', desc: 'Monitors lobby and wait areas for threshold violations.', status: 'good', health: 89.5 },
  { id: 7, name: 'Visitor Count Limit Exceeded', icon: UserPlus, color: 'var(--color-warning)', image: '/assets/images/visitor_count.png', desc: 'Real-time counting for compliance.', status: 'good', health: 95.1 },
  { id: 8, name: 'Entry/Exit tracking of visitors (face recognition)', icon: UserCheck, color: 'var(--color-accent)', image: 'https://th.bing.com/th/id/OIP.aMhoCenmTiJDuLGfVsVXcgHaE5?w=240&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7', desc: 'Bidirectional tracking of visitor flow patterns.', status: 'excellent', health: 97.9 },
  { id: 9, name: 'Staff presence/absence at duty post', icon: User, color: 'var(--color-accent)', image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Verifies staff positioning at critical healthcare nodes.', status: 'good', health: 92.4 },
  { id: 10, name: 'Mobile phone usage in restricted areas', icon: Phone, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Detects phone usage in high-radiation or sterile zones.', status: 'warning', health: 86.2 },
  { id: 11, name: 'Fire / smoke detection', icon: Flame, color: 'var(--color-danger)', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Convolutional neural net for smoke and flame patterns.', status: 'critical', health: 99.8 },
  { id: 12, name: 'Vehicle detection & tracking', icon: Car, color: 'var(--color-accent)', image: '/assets/images/pakistan_car.png', desc: 'Tracks ambulance and vehicle arrivals at emergency bay.', status: 'excellent', health: 98.1 },
  { id: 13, name: 'Unauthorized parking / ambulance blockage', icon: Truck, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Alerts if emergency routes are blocked by vehicles.', status: 'warning', health: 94.3 },
  { id: 14, name: 'Camera offline and recording failure alert', icon: Video, color: 'var(--color-danger)', image: 'https://th.bing.com/th/id/OIP.IGi3IOg_ie_KWZQyDUFXJAHaEK?w=320&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7', desc: 'Diagnostic tool for signal loss or storage failure.', status: 'critical', health: 42.5 },
  { id: 15, name: 'Baby moved outside designated routes', icon: Baby, color: 'var(--color-danger)', image: 'https://images.stockcake.com/public/d/5/6/d561e091-52dc-4d54-84e1-2e4378cc3d10_large/urban-mobility-intersection-stockcake.jpg', desc: 'Detects patients or babies moving out of safe zones.', status: 'critical', health: 91.8 },
  { id: 16, name: 'Unauthorized person handling or carrying baby', icon: Ban, color: 'var(--color-danger)', image: 'https://tse1.mm.bing.net/th/id/OIP.scnPg8Gb5_60ajW3uyKQ8gHaE8?rs=1&pid=ImgDetMain&o=7&rm=3', desc: 'Detects physical contact with babies by unauthorized staff.', status: 'critical', health: 97.2 },
  { id: 17, name: 'Baby left unattended', icon: Package, color: 'var(--color-warning)', image: 'https://tse1.mm.bing.net/th/id/OIP.FkN6PDjxo27aXOcsU1DPtQHaE8?rs=1&pid=ImgDetMain&o=7&rm=3', desc: 'Tracks unattended babies in specific departments.', status: 'warning', health: 90.1 },
  { id: 18, name: 'Patient approaching exit without discharge clearance', icon: Activity, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Identifies patients moving towards facility exits.', status: 'warning', health: 96.5 },
  { id: 19, name: 'More than allowed attendants during night', icon: Users, color: 'var(--color-warning)', image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800&q=90', desc: 'Night shift capacity limit violation detection.', status: 'warning', health: 93.4 },
  { id: 20, name: 'Movement in closed departments/areas', icon: Building, color: 'var(--color-danger)', image: 'https://tse4.mm.bing.net/th/id/OIP.BMGuwKv18rN-FLuxhQaWZAHaEc?rs=1&pid=ImgDetMain&o=7&rm=3', desc: 'Motion profiling in locked or night-only departments.', status: 'critical', health: 98.7 },
  { id: 21, name: 'Person climbing or jumping over boundary wall', icon: Mountain, color: 'var(--color-danger)', image: 'https://tse1.mm.bing.net/th/id/OIP.Bv-IZNYh-_6HR14I7YNeiwHaDw?rs=1&pid=ImgDetMain&o=7&rm=3', desc: 'Detects wall jumps or perimeter fence breaches.', status: 'critical', health: 95.8 },
];

export default function AIScenarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const location = useLocation();
  const { canView } = useAuth();

  // Auto-filter based on scenario_id from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scenarioId = params.get('scenario_id');
    if (scenarioId) {
      const target = SCENARIOS.find(s => s.id === parseInt(scenarioId));
      if (target) {
        setSearchTerm(target.name);
      }
    }
  }, [location.search]);

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
          <div className="flex bg-card border border-border rounded-lg p-1 shadow-sm">
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
          {canView('admin_hub') && (
            <Link
              to="/admin/scenarios"
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-[0.75rem] font-bold cursor-pointer hover:opacity-90 shadow-premium transition-all no-underline"
            >
              <Play className="w-4 h-4 fill-white" />
              Deploy New Instance
            </Link>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-premium flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-gray" />
          <input
            type="text"
            placeholder="Search vision models by name or category..."
            className="w-full pl-12 pr-4 py-3 bg-bg border border-border rounded-lg text-[0.88rem] focus:outline-none focus:border-accent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex items-center gap-2 px-5 py-3 bg-bg border border-border rounded-lg text-[0.85rem] font-bold text-text-gray hover:border-accent hover:text-accent transition-all whitespace-nowrap">
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
            className={`bg-card rounded-lg border border-border transition-all duration-400 overflow-hidden relative group hover:shadow-premium
              ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-row items-center p-4'}`}
          >
            {/* Image / Icon Header */}
            <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'h-[140px]' : 'w-24 h-24 rounded-lg shrink-0'}`}>
              <div className="absolute inset-0 z-10 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={scenario.image} alt={scenario.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {viewMode === 'grid' && (
                <div
                  className={`absolute top-4 left-4 z-20 w-12 h-12 rounded-lg bg-card/90 backdrop-blur-md shadow-lg flex items-center justify-center border-2 border-status transition-colors`}
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-status`}
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
                <div className="flex items-center gap-1.5 text-[0.65rem] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">
                  <Activity className="w-3 h-3" />
                  Live Sync
                </div>
              </div>
            </div>

            {/* Status Badge Overlays Removed */}
          </div>
        ))}
      </div>
    </div>
  );
}
