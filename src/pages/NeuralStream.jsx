import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Activity, 
  Shield, 
  Cpu, 
  Zap, 
  Maximize2, 
  Settings,
  AlertCircle,
  Eye,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function NeuralStream() {
  const [logs, setLogs] = useState([]);
  const [activeCamera, setActiveCamera] = useState(0);

  useEffect(() => {
    const eventTypes = [
      { type: 'PERSON_DETECTED', color: 'text-accent', icon: Eye },
      { type: 'FACE_MATCH_VIP', color: 'text-success', icon: Shield },
      { type: 'UNAUTHORIZED_ENTRY', color: 'text-danger', icon: AlertCircle },
      { type: 'MOTION_DETECTED', color: 'text-warning', icon: Activity },
      { type: 'VEHICLE_LOGGED', color: 'text-accent', icon: Zap }
    ];

    const interval = setInterval(() => {
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const camId = Math.floor(Math.random() * 6) + 1;
      const confidence = (85 + Math.random() * 14).toFixed(1);
      
      const newLog = {
        id: Date.now(),
        type: event.type,
        color: event.color,
        icon: event.icon,
        camera: `CAM-0${camId}`,
        confidence: `${confidence}%`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setLogs(prev => [newLog, ...prev.slice(0, 14)]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-6 -mt-2">
      {/* Immersive Header */}
      <div className="flex justify-between items-center px-2 shrink-0">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark tracking-tighter uppercase flex items-center gap-3">
            <Radio className="w-8 h-8 text-accent animate-pulse" />
            Neural Live Matrix
          </h2>
          <p className="text-[0.85rem] text-text-gray font-bold uppercase tracking-widest mt-1">
            Real-time AI Inference Stream • 6.4 TFLOPS Processing
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 4, 6].map(n => (
              <button key={n} className="w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center font-black text-[0.8rem] text-text-gray hover:border-accent hover:text-accent transition-all">
                {n}x
              </button>
            ))}
          </div>
          <button className="p-3 bg-card border border-border rounded-xl text-text-gray hover:text-accent shadow-sm">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
        {/* Main Matrix View */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {[1, 2, 3, 4, 5, 6].map((cam, idx) => (
            <div 
              key={cam} 
              onClick={() => setActiveCamera(idx)}
              className={`relative aspect-video rounded-[24px] overflow-hidden group cursor-pointer border-4 transition-all duration-300
                ${activeCamera === idx ? 'border-accent shadow-2xl scale-[1.02] z-10' : 'border-transparent shadow-premium hover:border-accent/40'}`}
            >
              {/* Camera Overlay */}
              <div className="absolute inset-x-0 top-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[0.65rem] font-black text-white uppercase tracking-wider border border-white/10">
                  <span className={`w-1.5 h-1.5 rounded-full ${cam % 2 === 0 ? 'bg-success animate-pulse' : 'bg-warning animate-pulse'}`} />
                  CAM-0{cam}
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-accent rounded-lg text-[0.6rem] font-black text-white shadow-lg">
                  <Cpu className="w-3 h-3" />
                  AI ACTIVE
                </div>
              </div>

              {/* Simulated Video with Skeletons */}
              <div className="absolute inset-0 bg-[#0a0a0c]">
                <img 
                  src={`https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=800&camera=${cam}`} 
                  className="w-full h-full object-cover opacity-60 mix-blend-screen"
                  alt="Stream"
                />
                
                {/* SVG Skeletons / Bounding Boxes Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                   {/* Mock Bounding Box */}
                   <rect x="30%" y="40%" width="15%" height="45%" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="4 2" className="animate-pulse" />
                   <text x="30%" y="38%" className="fill-accent font-mono text-[10px] uppercase font-bold">PE_0{cam} (98.4%)</text>
                   
                   {/* Mock Skeleton lines */}
                   <circle cx="37.5%" cy="45%" r="3" className="fill-accent" />
                   <line x1="37.5%" y1="45%" x2="37.5%" y2="60%" className="stroke-accent" strokeWidth="1.5" />
                   <line x1="37.5%" y1="50%" x2="32%" y2="58%" className="stroke-accent" strokeWidth="1.5" />
                   <line x1="37.5%" y1="50%" x2="43%" y2="58%" className="stroke-accent" strokeWidth="1.5" />
                </svg>

                {/* Scan Line Effect */}
                <div className="absolute inset-x-0 h-[2px] bg-accent/20 top-0 animate-[scan_3s_linear_infinite] shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
              </div>

              {/* Bottom Info Bar */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-3">
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-accent/40 transition-colors">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-accent/40 transition-colors">
                    <Layers className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="text-[0.65rem] font-bold text-white/60 font-mono">
                  1080P • 30 FPS • H.265
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Neural Stream Side Panel */}
        <div className="w-[380px] flex flex-col gap-6 bg-card rounded-[32px] border border-border p-6 shadow-premium shrink-0">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-[1.1rem] font-black text-text-dark tracking-tight uppercase">Neural Events</h3>
            <span className="px-2.5 py-1 bg-accent-soft text-accent rounded-full text-[0.65rem] font-black animate-pulse">LIVE UPDATE</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="bg-bg/40 border border-border rounded-2xl p-4 transition-all hover:bg-bg hover:shadow-sm group animate-in slide-in-from-right-2 fade-in duration-500"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl border border-current bg-current opacity-20 ${log.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className={`text-[0.7rem] font-black uppercase tracking-wider ${log.color}`}>{log.type.replace('_', ' ')}</span>
                      <span className="text-[0.65rem] font-bold text-text-gray">{log.timestamp}</span>
                    </div>
                    <div className="text-[0.85rem] font-bold text-text-dark flex items-center gap-2">
                       {log.camera} 
                       <ChevronRight className="w-3 h-3 text-text-gray" />
                       <span className="text-accent">{log.confidence} Conf.</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Metrics */}
          <div className="bg-bg rounded-2xl p-5 border border-border space-y-3">
             <div className="flex justify-between items-center text-[0.7rem] font-bold text-text-gray uppercase tracking-widest">
                <span>Buffer Health</span>
                <span className="text-success">Optimal</span>
             </div>
             <div className="h-1.5 bg-card rounded-full overflow-hidden">
                <div className="h-full bg-success w-[85%]" />
             </div>
             <div className="flex justify-between items-center text-[0.65rem] font-bold text-text-gray opacity-60">
                <span>Latency: 42ms</span>
                <span>Active Objects: 14</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
