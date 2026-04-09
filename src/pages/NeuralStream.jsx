import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Shield, 
  Cpu, 
  Settings,
  ChevronRight,
  Target,
  BarChart2,
  Lock,
  Wifi
} from 'lucide-react';

const CAMERAS = [
  { id: '01', status: 'bg-warning', img: 'https://images.unsplash.com/photo-1558002038-1055907df827', name: 'ICU ENTRANCE' },
  { id: '02', status: 'bg-success', img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514', name: 'MAIN RECEPTION' },
  { id: '03', status: 'bg-warning', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d', name: 'EMERGENCY BAY' },
  { id: '04', status: 'bg-success', img: 'https://images.unsplash.com/photo-1551076805-e1869033e561', name: 'SUPPLY CLOSET' },
  { id: '05', status: 'bg-warning', img: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b', name: 'LAB SECTOR A' },
  { id: '06', status: 'bg-success', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c', name: 'NORTH PERIMETER' },
];

export default function NeuralStream() {
  const [logs, setLogs] = useState([]);
  const [activeCamera, setActiveCamera] = useState('01');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [highlightCam, setHighlightCam] = useState(null);
  const [boxPositions, setBoxPositions] = useState({});

  // Initialize and update bounding box positions
  useEffect(() => {
    const updatePositions = () => {
      const newPos = {};
      CAMERAS.forEach(cam => {
        newPos[cam.id] = {
          x: 20 + Math.random() * 50,
          y: 30 + Math.random() * 40,
          conf: (94 + Math.random() * 5.9).toFixed(1)
        };
      });
      setBoxPositions(newPos);
    };

    const interval = setInterval(updatePositions, 3000 / playbackSpeed);
    updatePositions();
    return () => clearInterval(interval);
  }, [playbackSpeed]);

  // Handle detection events
  useEffect(() => {
    const eventTypes = [
      { type: 'MOTION DETECTED', color: 'text-orange-500', dot: 'bg-orange-300' },
      { type: 'PERSON DETECTED', color: 'text-blue-500', dot: 'bg-blue-300' },
      { type: 'FACE MATCH_VIP', color: 'text-green-500', dot: 'bg-green-300' },
      { type: 'ACCESS GRANTED', color: 'text-teal-500', dot: 'bg-teal-300' }
    ];

    const generateEvent = () => {
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const targetCam = CAMERAS[Math.floor(Math.random() * CAMERAS.length)];
      
      const newLog = {
        id: Date.now(),
        type: event.type,
        color: event.color,
        dot: event.dot,
        camera: `CAM-${targetCam.id}`,
        confidence: `${(90 + Math.random() * 9).toFixed(1)}% Conf.`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setLogs(prev => [newLog, ...prev.slice(0, 15)]);
      
      // Highlight camera
      setHighlightCam(targetCam.id);
      setTimeout(() => setHighlightCam(null), 1000);
    };

    const interval = setInterval(generateEvent, 2000 / playbackSpeed);
    return () => clearInterval(interval);
  }, [playbackSpeed]);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-[1600px] mx-auto min-h-screen bg-bg">
      {/* ADVANCED HUD HEADER */}
      <div className="flex justify-between items-center bg-card p-6 rounded-[32px] border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-[1.8rem] font-black text-text-dark tracking-tight uppercase leading-none">Neural Live Matrix</h1>
              <div className="flex items-center gap-3 mt-1.5 font-bold text-[0.7rem] text-text-gray uppercase tracking-widest opacity-60">
                 <span>SENTINEL ENGINE v4.2</span>
                 <span className="w-1 h-1 bg-current rounded-full" />
                 <span>6.4 TFLOPS Processing</span>
                 <span className="w-1 h-1 bg-current rounded-full" />
                 <span className="text-accent">ENCRYPTED</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-bg p-1 rounded-2xl border border-border">
            {[1, 2, 4, 6].map(n => (
              <button 
                key={n} 
                onClick={() => setPlaybackSpeed(n)}
                className={`px-5 py-2.5 rounded-xl font-black text-[0.8rem] transition-all
                ${playbackSpeed === n ? 'bg-card text-accent shadow-sm' : 'text-text-gray hover:text-accent'}`}
              >
                {n}x
              </button>
            ))}
          </div>
          <button className="w-12 h-12 bg-card border border-border rounded-2xl flex items-center justify-center text-text-gray hover:text-accent shadow-sm transition-all hover:rotate-90">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* ADVANCED CAMERA GRID */}
        <div className="flex-1 grid grid-cols-3 gap-6">
          {CAMERAS.map((cam) => {
            const isActive = activeCamera === cam.id;
            const isDetected = highlightCam === cam.id;
            const pos = boxPositions[cam.id] || { x: 30, y: 40, conf: 98.4 };

            return (
              <div 
                key={cam.id} 
                onClick={() => setActiveCamera(cam.id)}
                className={`relative aspect-[16/10] rounded-[32px] overflow-hidden border-[6px] transition-all duration-500 cursor-pointer bg-black group
                ${isActive ? 'border-accent shadow-2xl scale-[1.03] z-10' : 'border-transparent shadow-premium hover:border-accent/30'}
                ${isDetected ? 'ring-4 ring-accent/40 ring-offset-4 animate-[pulse_1s_infinite]' : ''}`}
              >
                {/* HUD CAMERA INFO */}
                <div className="absolute inset-x-0 top-0 p-5 z-20 flex justify-between items-start pointer-events-none">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b]/90 backdrop-blur-md rounded-lg text-[0.6rem] font-black text-white uppercase tracking-wider border border-white/10">
                      <span className={`w-1.5 h-1.5 rounded-full ${cam.status} animate-pulse`} />
                      {cam.name}
                    </div>
                    <div className="text-[0.55rem] font-bold text-white/40 ml-1 tracking-tighter">BITRATE: 4.2 MBPS</div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg text-[0.6rem] font-black text-white shadow-lg shadow-accent/20">
                    <Cpu className="w-3.5 h-3.5" />
                    AI ACTIVE
                  </div>
                </div>

                {/* VISUAL FEED */}
                <div className="absolute inset-0 bg-[#0f172a]">
                  <img 
                    src={`${cam.img}?auto=format&fit=crop&q=80&w=800`} 
                    className={`w-full h-full object-cover transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                    alt="Stream"
                  />
                  
                  {/* ADVANCED AI OVERlays */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Floating Bounding Box */}
                    <div 
                      className="absolute border-2 border-accent border-dashed transition-all duration-[3000ms] ease-in-out shadow-[0_0_15px_rgba(14,165,233,0.3)] flex flex-col items-center justify-center"
                      style={{ 
                        top: `${pos.y}%`, 
                        left: `${pos.x}%`, 
                        width: '20%', 
                        height: '40%' 
                      }}
                    >
                      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-white" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-white" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-white" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-white" />
                      
                      {/* Detection Tag */}
                      <div className="absolute top-[-22px] left-[-2px] flex items-center gap-1 bg-accent text-white text-[0.55rem] font-black px-2 py-0.5 rounded shadow-lg transition-all duration-500">
                         <Target className="w-2.5 h-2.5" />
                         PE_{cam.id} ({pos.conf}%)
                      </div>

                      {/* Micro-Telemetry on Box */}
                      <div className="absolute -right-12 top-0 text-[0.45rem] font-mono text-white/50 space-y-0.5">
                         <div>ID_32442</div>
                         <div>TRACKING: ON</div>
                         <div>INF: 12ms</div>
                      </div>
                    </div>

                    {/* Hud Corner Brackets (for active) */}
                    {isActive && (
                      <div className="absolute inset-4 border border-white/5 pointer-events-none">
                        <div className="absolute top-0 left-0 w-8 h-px bg-white/30" />
                        <div className="absolute top-0 left-0 w-px h-8 bg-white/30" />
                        <div className="absolute bottom-0 right-0 w-8 h-px bg-white/30" />
                        <div className="absolute bottom-0 right-0 w-px h-8 bg-white/30" />
                      </div>
                    )}
                  </div>

                  {/* High-Tech Scanlines */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none animate-scanline bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_2px]" />
                </div>
                
                {/* Peripheral Data */}
                <div className="absolute bottom-4 right-4 flex gap-1 z-20">
                   <div className="w-1.5 h-1.5 bg-success rounded-full" />
                   <div className="w-1.5 h-1.5 bg-success/40 rounded-full" />
                   <div className="w-1.5 h-1.5 bg-success/20 rounded-full" />
                </div>
              </div>
            );
          })}
        </div>

        {/* INTEGRATED SIDEBAR INTELLIGENCE */}
        <div className="w-[380px] bg-card rounded-[40px] border border-border shadow-premium flex flex-col p-8 h-fit min-h-[750px] sticky top-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 text-accent rounded-xl">
                 <BarChart2 className="w-5 h-5" />
              </div>
              <h2 className="text-[1.3rem] font-black text-text-dark tracking-tight uppercase leading-none">Neural Events</h2>
            </div>
            <div className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-[0.6rem] font-black animate-pulse flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-accent rounded-full" />
               LIVE UPDATE
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1 max-h-[500px] custom-scrollbar">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`flex gap-5 p-5 rounded-[24px] transition-all duration-500 border group animate-in slide-in-from-right-4 fade-in duration-500
                ${highlightCam === log.camera.replace('CAM-', '') ? 'bg-accent/5 border-accent/30 shadow-md scale-[1.02]' : 'bg-surface border-border hover:bg-card hover:shadow-lg'}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${log.dot} flex-shrink-0 opacity-40 shadow-sm flex items-center justify-center text-white`}>
                   <Target className="w-6 h-6 opacity-60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[0.7rem] font-black tracking-widest uppercase ${log.color}`}>{log.type}</span>
                    <span className="text-[0.6rem] font-bold text-text-gray opacity-40 font-mono">{log.timestamp}</span>
                  </div>
                  <div className="text-[0.95rem] font-black text-text-dark flex items-center gap-2">
                    {log.camera} 
                    <ChevronRight className="w-4 h-4 text-text-gray opacity-30" />
                    <span className="text-accent text-[0.85rem] flex items-center gap-1">
                       {log.confidence}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SYSTEM INTEGRITY PANEL */}
          <div className="mt-8 pt-8 border-t border-border space-y-6">
             <div>
               <div className="flex justify-between items-center text-[0.75rem] font-black text-text-dark uppercase tracking-wider mb-2.5">
                  <div className="flex items-center gap-2">
                     <Wifi className="w-4 h-4 text-accent" />
                     Stream Buffer
                  </div>
                  <span className="text-success flex items-center gap-1">
                     <Shield className="w-3 h-3" />
                     OPTIMAL
                  </span>
               </div>
               <div className="h-2 bg-bg rounded-full overflow-hidden shadow-inner p-px border border-border">
                  <div className="h-full bg-success w-[92%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all duration-1000" />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-border">
                   <div className="text-[0.55rem] font-black text-text-gray uppercase tracking-widest mb-1 opacity-60">Avg Latency</div>
                   <div className="text-[1.1rem] font-black text-accent">42<span className="text-[0.7rem] ml-0.5">MS</span></div>
                </div>
                <div className="bg-surface p-4 rounded-2xl border border-border">
                   <div className="text-[0.55rem] font-black text-text-gray uppercase tracking-widest mb-1 opacity-60">Active Objects</div>
                   <div className="text-[1.1rem] font-black text-accent">14<span className="text-[0.7rem] ml-0.5">IDS</span></div>
                </div>
             </div>

             <div className="flex items-center justify-center gap-2 text-[0.6rem] font-bold text-text-gray opacity-40 group cursor-help">
                <Lock className="w-3 h-3" />
                END-TO-END QUANTUM ENCRYPTION ACTIVE
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
