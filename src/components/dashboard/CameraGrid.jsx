import React, { useEffect, useState } from 'react';
import { Maximize2, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

const CAMERAS = [
  {
    id: 1,
    name: "ICU West Entrance",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80",
    fields: [
      { label: "Authorized Staff", value: "Maria Santos", valueColor: "text-accent" },
      { label: "Task Detected", value: "Hand Hygiene", valueColor: "text-success" }
    ],
    tags: [
      { text: "98% AI Conf.", bg: "bg-accent/10", color: "text-accent" },
      { text: "Bio-Secure", bg: "bg-success/10", color: "text-success" }
    ],
    stats: [
      { label: "Detected Objects", value: "12" },
      { label: "Motion Index", value: "0.14" }
    ],
    alertMode: false
  },
  {
    id: 2,
    name: "Main Lobby Central",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80",
    fields: [
      { label: "Security Personnel", value: "John Rivera", valueColor: "text-accent" },
      { label: "Movement Pattern", value: "Patrol Check", valueColor: "text-accent" }
    ],
    tags: [
      { text: "94% AI Conf.", bg: "bg-accent/10", color: "text-accent" },
      { text: "Verified Area", bg: "bg-success/10", color: "text-success" }
    ],
    stats: [
      { label: "Detected Objects", value: "18" },
      { label: "Motion Index", value: "0.42" }
    ],
    alertMode: false
  },
  {
    id: 3,
    name: "Emergency Bay Exterior",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    fields: [
      { label: "Operational State", value: "Critical Watch", valueColor: "text-warning" },
      { label: "Response Priority", value: "VITAL", valueColor: "text-danger" }
    ],
    tags: [
      { text: "Threat Alert", bg: "bg-danger/20", color: "text-danger" }
    ],
    stats: [
      { label: "Active Alerts", value: "2" },
      { label: "Queue Length", value: "5" }
    ],
    alertMode: true
  },
  {
    id: 4,
    name: "Supply Hallway B",
    image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80",
    fields: [
      { label: "Janitorial Staff", value: "Tom Wilson", valueColor: "text-accent" },
      { label: "Maintenance Task", value: "Janitorial", valueColor: "text-warning" }
    ],
    tags: [
      { text: "91% AI Conf.", bg: "bg-accent/10", color: "text-accent" },
      { text: "Zone Clear", bg: "bg-success/10", color: "text-success" }
    ],
    stats: [
      { label: "Detected Objects", value: "8" },
      { label: "Motion Index", value: "0.21" }
    ],
    alertMode: false
  },
  {
    id: 5,
    name: "Secure Research Lab Alpha",
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=800",
    fields: [
      { label: "Authenticated Head", value: "Lisa Chen", valueColor: "text-accent" },
      { label: "Access Protocol", value: "L-3 Grant", valueColor: "text-success" }
    ],
    tags: [
      { text: "99% AI Conf.", bg: "bg-accent/10", color: "text-accent" },
      { text: "Locked Down", bg: "bg-success/10", color: "text-success" }
    ],
    stats: [
      { label: "Detected Objects", value: "15" },
      { label: "Motion Index", value: "0.08" }
    ],
    alertMode: false
  },
  {
    id: 6,
    name: "Perimeter Sector 7",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80",
    fields: [
      { label: "Global Status", value: "Deep Scanning", valueColor: "text-accent" },
      { label: "External Threats", value: "Zero (0)", valueColor: "text-success" }
    ],
    tags: [
      { text: "Perimeter Safe", bg: "bg-success/10", color: "text-success" }
    ],
    stats: [
      { label: "Detected Objects", value: "6" },
      { label: "Motion Index", value: "0.00" }
    ],
    alertMode: false
  }
];

export default function CameraGrid() {
  const [skeletons, setSkeletons] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newSkeletons = {};
      CAMERAS.forEach(cam => {
        const dots = [];
        // Group dots into 2 skeletal bodies
        for(let person=0; person<2; person++) {
          const offsetX = 20 + Math.random() * 60;
          const offsetY = 30 + Math.random() * 40;
          for (let i = 0; i < 6; i++) {
            dots.push({
              id: `${person}-${i}`,
              top: `${offsetY + (i % 3) * 10}%`,
              left: `${offsetX + (i < 3 ? 0 : 5)}%`,
              group: person
            });
          }
        }
        newSkeletons[cam.id] = dots;
      });
      setSkeletons(newSkeletons);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/50 backdrop-blur-[10px] rounded-[32px] border border-border p-4 md:p-5 shadow-premium">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h3 className="text-[1.1rem] font-black text-text-dark uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Neural Feed Matrix
          </h3>
          <p className="text-[0.7rem] text-text-gray font-bold opacity-60">SENTINEL AI ENGINE V4.2 ACTIVE</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1 rounded-full text-[0.65rem] font-black border border-accent/20">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            6 STREAMS SYNCED
          </div>
          <div className="bg-success/10 text-success px-3 py-1 rounded-full text-[0.65rem] font-black border border-success/20 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            ENCRYPTED AES-256
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CAMERAS.map((cam) => (
          <div 
            key={cam.id} 
            className={`group relative rounded-[20px] aspect-[16/9] overflow-hidden bg-black border-[3px] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)]
            ${cam.alertMode ? 'border-danger/40 animate-pulse' : 'border-transparent hover:border-accent/40'}`}
          >
            {/* Camera Basemap */}
            <img 
              src={cam.image} 
              alt={cam.name}
              className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:brightness-50"
            />

            {/* AI HUD OVERLAY */}
            <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex justify-between items-start">
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] font-bold text-white/50 tracking-widest uppercase">Stream-{cam.id.toString().padStart(2, '0')}</span>
                <span className="text-[0.8rem] font-black text-white tracking-tight">{cam.name}</span>
              </div>
              <div className={`px-2 py-1 rounded-md text-[0.55rem] font-black flex items-center gap-1 ${cam.alertMode ? 'bg-danger text-white' : 'bg-black/60 text-white/80'}`}>
                {cam.alertMode ? <AlertTriangle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />}
                {cam.alertMode ? 'CRITICAL ALERT' : 'LIVE'}
              </div>
            </div>

            {/* AI Skeleton Grid */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
               {/* Scanline Effect */}
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 animate-scanline transition-opacity duration-500">
                <div className="h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
              </div>

              {(skeletons[cam.id] || []).map(dot => (
                <div 
                  key={dot.id}
                  className={`absolute w-1.5 h-1.5 border-[1px] rounded-full shadow-[0_0_8px_currentColor] transition-all duration-300
                  ${cam.alertMode ? 'bg-danger border-white text-danger' : 'bg-accent border-white text-accent'}`}
                  style={{ top: dot.top, left: dot.left }}
                />
              ))}
            </div>

            {/* Interaction Layer (Bottom) */}
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1.5">
                    {cam.tags.map((tag, i) => (
                      <span key={i} className={`text-[0.55rem] ${tag.bg} backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md font-black uppercase ${tag.color}`}>
                        {tag.text}
                      </span>
                    ))}
                  </div>
                  <button className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-black rounded-lg transition-colors cursor-pointer">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {cam.fields.map((field, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[0.5rem] font-bold text-white/50 uppercase">{field.label}</span>
                      <span className={`text-[0.65rem] font-black truncate ${field.valueColor}`}>{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Peripheral Stats */}
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:-translate-x-4 z-30">
              {cam.stats.map((stat, i) => (
                <div key={i} className="bg-black/80 backdrop-blur-xl border border-white/10 px-2 py-1 rounded-lg flex flex-col items-center min-w-[50px]">
                   <span className="text-[0.4rem] font-bold text-white/40 uppercase leading-tight">{stat.label.split(' ')[0]}</span>
                   <span className="text-[0.65rem] font-black text-white leading-tight">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
