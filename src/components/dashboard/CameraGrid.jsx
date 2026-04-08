import React, { useEffect, useState } from 'react';

const CAMERAS = [
  {
    id: 1,
    name: "ICU West",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80",
    fields: [
      { label: "Staff", value: "Maria Santos", valueColor: "text-accent" },
      { label: "Task", value: "Sanitizing", valueColor: "text-success" }
    ],
    tags: [
      { text: "98% Conf.", bg: "bg-accent-soft", color: "text-text-dark" },
      { text: "Safe", bg: "bg-success/20", color: "text-success" }
    ],
    stats: [
      { label: "Objects", value: "12", valColor: "text-white" },
      { label: "Motion", value: "Low", valColor: "text-success" }
    ],
    alertMode: false
  },
  {
    id: 2,
    name: "Main Lobby",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80",
    fields: [
      { label: "Staff", value: "John Rivera", valueColor: "text-accent" },
      { label: "Task", value: "Patrolling", valueColor: "text-accent" }
    ],
    tags: [
      { text: "94% Conf.", bg: "bg-accent-soft", color: "text-text-dark" },
      { text: "Secure", bg: "bg-success/20", color: "text-success" }
    ],
    stats: [
      { label: "Objects", value: "18", valColor: "text-white" },
      { label: "Motion", value: "Medium", valColor: "text-warning" }
    ],
    alertMode: false
  },
  {
    id: 3,
    name: "Emergency Bay",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    fields: [
      { label: "Status", value: "Observing", valueColor: "text-warning" },
      { label: "Priority", value: "HIGH", valueColor: "text-danger" }
    ],
    tags: [
      { text: "Alert Active", bg: "bg-warning/20", color: "text-warning" }
    ],
    stats: [
      { label: "Alerts", value: "2", valColor: "text-white" },
      { label: "Queue", value: "5", valColor: "text-white" }
    ],
    alertMode: true
  },
  {
    id: 4,
    name: "Hallway B",
    image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80",
    fields: [
      { label: "Task", value: "Cleaning", valueColor: "text-warning" },
      { label: "Staff", value: "Tom Wilson", valueColor: "text-accent" }
    ],
    tags: [
      { text: "91% Conf.", bg: "bg-accent-soft", color: "text-text-dark" },
      { text: "Clear", bg: "bg-success/20", color: "text-success" }
    ],
    stats: [
      { label: "Objects", value: "8", valColor: "text-white" },
      { label: "Motion", value: "Low", valColor: "text-success" }
    ],
    alertMode: false
  },
  {
    id: 5,
    name: "Research Lab A",
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=800",
    fields: [
      { label: "Staff", value: "Lisa Chen", valueColor: "text-accent" },
      { label: "Access", value: "Authorized", valueColor: "text-success" }
    ],
    tags: [
      { text: "97% Conf.", bg: "bg-accent-soft", color: "text-text-dark" },
      { text: "Safe", bg: "bg-success/20", color: "text-success" }
    ],
    stats: [
      { label: "Objects", value: "15", valColor: "text-white" },
      { label: "Motion", value: "Low", valColor: "text-accent" }
    ],
    alertMode: false
  },
  {
    id: 6,
    name: "Perimeter",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80",
    fields: [
      { label: "Status", value: "Scanning", valueColor: "text-accent" },
      { label: "Alerts", value: "0", valueColor: "text-success" }
    ],
    tags: [
      { text: "Secure", bg: "bg-success/20", color: "text-success" }
    ],
    stats: [
      { label: "Objects", value: "6", valColor: "text-white" },
      { label: "Motion", value: "None", valColor: "text-success" }
    ],
    alertMode: false
  }
];

export default function CameraGrid() {
  const [skeletons, setSkeletons] = useState({});

  useEffect(() => {
    // Generate AI skeleton joints randomly
    const interval = setInterval(() => {
      const newSkeletons = {};
      CAMERAS.forEach(cam => {
        const dots = [];
        for (let i = 0; i < 12; i++) {
          dots.push({
            id: i,
            top: `${25 + Math.random() * 50}%`,
            left: `${35 + Math.random() * 30}%`
          });
        }
        newSkeletons[cam.id] = dots;
      });
      setSkeletons(newSkeletons);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card rounded-[24px] border border-border p-6 md:p-8 shadow-premium w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[1rem] font-bold text-text-dark m-0">Live Video Feeds</h3>
        <div className="flex gap-1.5 items-center">
          <span className="bg-accent-soft text-accent px-3 py-1 rounded-[10px] text-[0.7rem] font-extrabold border border-border">
            6 ACTIVE
          </span>
          <span className="bg-success/20 text-success px-3 py-1 rounded-[10px] text-[0.7rem] font-extrabold border border-border">
            1080p HD
          </span>
          <span className="bg-warning/20 text-warning px-3 py-1 rounded-[10px] text-[0.7rem] font-extrabold border border-border">
            48ms Latency
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[22px]">
        {CAMERAS.map((cam) => (
          <div 
            key={cam.id} 
            className="group relative rounded-[18px] aspect-[16/10] overflow-hidden bg-black border-[2px] border-transparent cursor-crosshair transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-2 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)] hover:border-accent"
          >
            {/* Camera Image */}
            <img 
              src={cam.image} 
              alt={cam.name}
              className="w-full h-full object-cover opacity-100 transition-all duration-400 group-hover:brightness-60 group-hover:blur-[2px] group-hover:scale-105"
            />

            {/* AI Action/Skeleton Dots */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {(skeletons[cam.id] || []).map(dot => (
                <div 
                  key={dot.id}
                  className="absolute w-1.5 h-1.5 bg-white border-2 border-accent rounded-full shadow-[0_0_10px_var(--color-accent)] pointer-events-none"
                  style={{ top: dot.top, left: dot.left }}
                />
              ))}
            </div>

            {/* Live Label on hover */}
            <div className="absolute inset-0 p-[18px] flex flex-col justify-between pointer-events-none opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-black/30 group-hover:opacity-100 z-20">
              <div className="bg-white/95 text-text-dark px-3 py-1 rounded-[10px] text-[0.72rem] font-extrabold border border-border w-fit flex items-center gap-1.5 mb-auto shadow-sm">
                <span className="w-2 h-2 bg-success rounded-full animate-[pulse_1s_infinite]" />
                LIVE
              </div>

              {/* Bottom Meta panel */}
              <div className="bg-white/95 backdrop-blur-[10px] p-[15px] rounded-[14px] text-[0.78rem] flex flex-col gap-1 text-black font-medium shadow-[0_10px_30px_rgba(0,0,0,0.2)] pointer-events-auto">
                <strong className="font-extrabold text-accent">{cam.name}</strong>
                {cam.fields.map((field, i) => (
                  <div key={i}>
                    {field.label}: <span className={`font-bold ${field.valueColor}`}>{field.value}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  {cam.tags.map((tag, i) => (
                    <span key={i} className={`text-[0.65rem] ${tag.bg} px-1.5 py-0.5 rounded-[4px] font-semibold ${tag.color}`}>
                      {tag.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Right Mini Stats Badge */}
            <div 
              className={`absolute top-3 right-3 backdrop-blur-[10px] px-2.5 py-1.5 rounded-lg text-[0.65rem] text-white flex flex-col gap-0.5 z-30
              ${cam.alertMode ? 'bg-danger/90 shadow-[0_2px_8px_rgba(239,68,68,0.4)]' : 'bg-black/70'}`}
            >
              {cam.stats.map((stat, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span>{stat.label}:</span>
                  <span className={`font-bold ${stat.valColor}`}>{stat.value}</span>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
