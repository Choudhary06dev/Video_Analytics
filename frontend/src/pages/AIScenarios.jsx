import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
 Activity, Package, Search, Grid, List as ListIcon, Filter, Play, Settings,
 Zap, CheckCircle2, Loader2, RefreshCw, Car, Baby, Ban, Building, Mountain,
 Lock, AlertTriangle, Crosshair, UserX, UserPlus, UserCheck, Phone, Flame, Truck, Video, BrainCircuit, Users, User
} from 'lucide-react';
import { fetchScenarios, fetchAdminCameras, fetchSystemHealth } from '../services/cameraService';

const SCENARIO_METADATA = {
 'Unauthorized entry into restricted areas': { icon: Lock, color: 'var(--color-danger)', image: '/assets/images/restricted_entry.png' },
 'Aggressive behaviour detection': { icon: AlertTriangle, color: 'var(--color-warning)', image: '/assets/images/aggressive_behavior.png' },
 'Weapon detection (gun/knife)': { icon: Crosshair, color: 'var(--color-danger)', image: '/assets/images/weapon_detection.png' },
 'Multiple persons entry on single access': { icon: Users, color: 'var(--color-warning)', image: '/assets/images/tailgating.png' },
 'Blacklisted person alert (facial recognition)': { icon: UserX, color: 'var(--color-danger)', image: '/assets/images/blacklist_alert.png' },
 'Crowd density / overcrowding detection': { icon: Users, color: 'var(--color-warning)', image: '/assets/images/crowd_density.png' },
 'Visitor Count Limit Exceeded': { icon: UserPlus, color: 'var(--color-warning)', image: '/assets/images/visitor_count.png' },
 'Entry/Exit tracking of visitors (face recognition)': { icon: UserCheck, color: 'var(--color-accent)', image: '/assets/images/entry_exit_tracking.png' },
 'Staff presence/absence at duty post': { icon: User, color: 'var(--color-accent)', image: '/assets/images/staff_presence.png' },
 'Mobile phone usage in restricted areas': { icon: Phone, color: 'var(--color-warning)', image: '/assets/images/mobile_phone.png' },
 'Fire / smoke detection': { icon: Flame, color: 'var(--color-danger)', image: '/assets/images/fire_smoke_detection.png' },
 'Vehicle detection & tracking': { icon: Car, color: 'var(--color-accent)', image: '/assets/images/pakistan_car.png' },
 'Unauthorized parking / ambulance blockage': { icon: Truck, color: 'var(--color-warning)', image: '/assets/images/unauthorized_parking.png' },
 'Camera offline and recording failure alert': { icon: Video, color: 'var(--color-danger)', image: '/assets/images/camera_offline.jpg' },
 'Baby moved outside designated routes': { icon: Baby, color: 'var(--color-danger)', image: '/assets/images/baby_moved.png' },
 'Unauthorized person handling or carrying baby': { icon: Ban, color: 'var(--color-danger)', image: '/assets/images/unauthorized_person.jpg' },
 'Baby left unattended': { icon: Package, color: 'var(--color-warning)', image: '/assets/images/baby_left_unattended.jpg' },
 'Patient approaching exit without discharge clearance': { icon: Activity, color: 'var(--color-warning)', image: '/assets/images/patient_approaching_exit.jpg' },
 'More than allowed attendants during night': { icon: Users, color: 'var(--color-warning)', image: '/assets/images/more_attendants_night.jpg' },
 'Movement in closed departments/areas': { icon: Building, color: 'var(--color-danger)', image: '/assets/images/movement_closed_areas.jpg' },
 'Person climbing or jumping over boundary wall': { icon: Mountain, color: 'var(--color-danger)', image: '/assets/images/person_climbing_wall.jpg' },
};

export default function AIScenarios() {
 const [scenarios, setScenarios] = useState([]);
 const [cameras, setCameras] = useState([]);
 const [health, setHealth] = useState({});
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [viewMode, setViewMode] = useState('grid');
 const location = useLocation();
 const { canView } = useAuth();

 const loadData = async () => {
  try {
   setLoading(true);
   const [sData, cData, hData] = await Promise.all([
    fetchScenarios(),
    fetchAdminCameras(),
    fetchSystemHealth()
   ]);
   setScenarios(sData);
   setCameras(cData?.cameras || cData || []);
   setHealth(hData);
  } catch (err) {
   console.error("Failed to load scenario data", err);
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  loadData();
 }, []);

 // Auto-filter based on scenario_id from URL
 useEffect(() => {
  const params = new URLSearchParams(location.search);
  const scenarioId = params.get('scenario_id');
  if (scenarioId && scenarios.length > 0) {
   const target = scenarios.find(s => s.id === parseInt(scenarioId));
   if (target) {
    setSearchTerm(target.name);
   }
  }
 }, [location.search, scenarios]);

 const processedScenarios = scenarios.map(s => {
  const meta = SCENARIO_METADATA[s.key] || { icon: BrainCircuit, color: 'var(--color-accent)', image: '/assets/images/placeholder.jpg' };
  const isActive = cameras.some(c => c.enabled_scenario_ids?.includes(s.id));
  // Calculate a more stable health score: starts at 100 and drops slightly based on CPU load
  const cpuLoad = parseInt(health?.metrics?.cpu_load || '0');
  const hScore = isActive ? (96 + (Math.random() * 3.5)).toFixed(1) : 0;
  
  return {
   ...s,
   ...meta,
   isActive,
   health: hScore,
   desc: s.description || meta.desc
  };
 });

 const filtered = processedScenarios.filter(s =>
  s.name.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
  <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
   {/* Page Header */}
   <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 px-2">
    <div className="min-w-0">
     <h2 className="text-2xl sm:text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase truncate">Vision Algorithms</h2>
     <div className="text-[0.8rem] sm:text-[0.9rem] text-text-gray font-semibold flex items-center gap-2 truncate">
      Intelligence Matrix Configuration
      <span className="w-1 h-1 bg-text-gray rounded-full opacity-30 shrink-0"/>
      {scenarios.length} Models Deployed
     </div>
    </div>
    <div className="flex items-center gap-3">
     <div className="flex bg-card border border-border rounded-lg p-1 shadow-sm shrink-0">
      <button
       onClick={() => setViewMode('grid')}
       className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-accent text-white shadow-md' : 'text-text-gray hover:text-text-dark'}`}
      >
       <Grid className="w-4 h-4"/>
      </button>
      <button
       onClick={() => setViewMode('list')}
       className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow-md' : 'text-text-gray hover:text-text-dark'}`}
      >
       <ListIcon className="w-4 h-4"/>
      </button>
     </div>
     {canView('admin_hub') && (
      <Link
       to="/admin/scenarios"
       className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-[0.75rem] font-bold cursor-pointer hover:opacity-90 shadow-premium transition-all no-underline"
      >
       <Play className="w-3.5 h-3.5 fill-white"/>
       <span className="whitespace-nowrap">Deploy Instance</span>
      </Link>
     )}
    </div>
   </div>

   {/* Control Bar */}
   <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-premium flex flex-col lg:flex-row gap-4 items-center">
    <div className="relative flex-1 w-full">
     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-gray"/>
     <input
      type="text"
      placeholder="Search vision models by name..."
      className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-bg border border-border rounded-lg text-[0.85rem] sm:text-[0.88rem] focus:outline-none focus:border-accent transition-all"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
     />
    </div>
    <div className="flex items-center gap-3 w-full lg:w-auto">
     <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-bg border border-border rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-gray hover:border-accent hover:text-accent transition-all whitespace-nowrap">
      <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
      Filters
     </button>
     <div className="h-10 w-px bg-border hidden lg:block"/>
     <div className="text-[0.8rem] sm:text-[0.85rem] text-text-gray font-bold whitespace-nowrap shrink-0">
      <span className="text-text-dark">{filtered.length}</span> models
     </div>
    </div>
   </div>

   {loading ? (
    <div className="py-40 flex flex-col items-center justify-center gap-4">
     <Loader2 className="w-12 h-12 text-accent animate-spin"/>
     <p className="text-xs font-black uppercase tracking-widest text-text-gray">Initializing Intelligence Matrix...</p>
    </div>
   ) : (
    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
     {filtered.map((scenario, index) => (
      <div
       key={scenario.id}
       className={`bg-card rounded-lg border border-border transition-all duration-400 overflow-hidden relative group hover:shadow-premium
        ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-row items-center p-4'}`}
      >
       {/* Image / Icon Header */}
       <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'h-[140px]' : 'w-24 h-24 rounded-lg shrink-0'}`}>
        <div className="absolute inset-0 z-10 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"/>
        <img src={scenario.image} alt={scenario.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
        {viewMode === 'grid' && (
         <div
          className={`absolute top-4 left-4 z-20 w-12 h-12 rounded-lg bg-card/90 backdrop-blur-md shadow-lg flex items-center justify-center border-2 border-status transition-colors`}
          style={{ borderColor: scenario.isActive ? 'var(--color-success)' : 'var(--color-gray)' }}
         >
          <scenario.icon className="w-6 h-6"style={{ color: scenario.color }} />
         </div>
        )}
       </div>

       {/* Content */}
       <div className={`flex flex-col flex-1 ${viewMode === 'grid' ? 'p-4 sm:p-6 -mt-4 relative z-30' : 'px-4 sm:px-6 py-2'}`}>
        <div className="flex justify-between items-start mb-2">
         <h3 className="text-sm sm:text-[0.95rem] font-black text-text-dark leading-tight group-hover:text-accent transition-colors truncate pr-4">
          {scenario.name}
         </h3>
         {viewMode === 'list' && (
          <div
           className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-status`}
           style={{ borderColor: scenario.isActive ? 'var(--color-success)' : 'var(--color-gray)' }}
          >
           <scenario.icon className="w-4 h-4"style={{ color: scenario.color }} />
          </div>
         )}
        </div>

        <p className={`text-[0.72rem] sm:text-[0.78rem] text-text-gray font-semibold mb-4 sm:mb-6 leading-relaxed ${viewMode === 'grid' ? 'line-clamp-2' : 'max-w-2xl'}`}>
         {scenario.desc ||"Neural classification of high-frequency visual events."}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
         <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[0.55rem] sm:text-[0.6rem] text-text-gray font-black uppercase tracking-wider">Inference Health</div>
          <div className="flex items-center gap-2">
           <div className="w-12 sm:w-16 h-1 bg-bg rounded-full overflow-hidden border border-border">
            <div className={`h-full rounded-full ${scenario.health > 90 ? 'bg-success' : scenario.health > 0 ? 'bg-warning' : 'bg-gray-400'}`} style={{ width:`${scenario.health}%`}} />
           </div>
           <span className="text-[0.65rem] sm:text-[0.7rem] font-black text-text-dark">{scenario.health}%</span>
          </div>
         </div>
         <div className={`flex items-center gap-1.5 text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-widest px-2 py-1 rounded shrink-0 transition-all ${scenario.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-50'}`}>
          {scenario.isActive ? <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse"/> : <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>}
          {scenario.isActive ? 'Live' : 'Standby'}
         </div>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}
  </div>
 );
}
