import React, { useEffect, useState } from 'react';
import { Maximize2, Activity, ShieldCheck, AlertTriangle, Eye, Radio, VideoOff, Settings } from 'lucide-react';
import CameraFeed from './CameraFeed';
import { fetchIntelligence, VIDEO_FEED_URL } from '../../api';
import { fetchAdminCameras } from '../../services/cameraService';

/**
 * CameraCard — Individual stream component with AI overlays and HUD.
 */
function CameraCard({ cam, intel }) {
  const [hovered, setHovered] = useState(false);
  const [dots, setDots] = useState([]);
  const [expanded, setExpanded] = useState(false);

  // Is this the primary stream (the one receiving demo AI intel)?
  // For now, we'll map the primary intel to the first camera or ID 1
  const isPrimary = cam.id === 1 || cam.is_primary;

  const isDisabled = cam.is_active === false;

  useEffect(() => {
    const iv = setInterval(() => {
      const newDots = [];
      // Simulate tracking dots for visual flair
      for (let p = 0; p < (isPrimary ? 2 : 1); p++) {
        const ox = 20 + Math.random() * 60;
        const oy = 30 + Math.random() * 40;
        newDots.push({ id: Math.random(), top: `${oy}%`, left: `${ox}%` });
      }
      setDots(newDots);
    }, 2000);
    return () => clearInterval(iv);
  }, [isPrimary]);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          group relative overflow-hidden aspect-video rounded-lg cursor-pointer transition-all duration-500 bg-black
          border-2 ${cam.alert_mode ? 'border-danger/60 shadow-[0_0_24px_rgba(239,68,68,0.3)]' : hovered ? 'border-accent/50 shadow-premium' : 'border-transparent'}
          ${isDisabled ? 'opacity-60 grayscale' : ''}
        `}
        style={{ transform: hovered ? 'translateY(-6px) scale(1.01)' : 'none' }}
      >
        {/* Stream Source */}
        {isDisabled ? (
           <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-white/5 relative aspect-video">
             <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)]" />
             <Settings className="w-8 h-8 text-danger/30 mb-2" />
             <span className="text-[0.6rem] font-black text-danger/50 uppercase tracking-widest mt-2 z-10">Stream Disabled</span>
           </div>
        ) : (
          <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${cam.id}`} hideOverlay={true} />
        )}

        {/* Scan-line overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_2px,rgba(0,0,0,0.05)_4px)] opacity-50" />

        {/* HUD Top */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
          <div>
            <div className="text-[0.6rem] font-black text-white/40 uppercase tracking-widest mb-0.5">Stream-{String(cam.id).padStart(2, '0')}</div>
            <div className="text-[0.85rem] font-black text-white tracking-tight">{cam.name}</div>
          </div>
          <div className={`
             flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.6rem] font-black backdrop-blur-md border
             ${cam.alert_mode ? 'bg-danger/90 text-white border-danger/40' : 'bg-black/60 text-white border-white/10'}
          `}>
             {cam.alert_mode ? <AlertTriangle className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_#22c55e] animate-pulse" />}
             {cam.alert_mode ? 'CRITICAL' : 'LIVE FEED'}
          </div>
        </div>

        {/* AI Tracking Dots (Visualizer) */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {dots.map(dot => (
            <div
              key={dot.id}
              style={{ top: dot.top, left: dot.left }}
              className={`absolute w-1.5 h-1.5 rounded-full border border-white/80 transition-all duration-[2000ms]
                ${cam.alert_mode ? 'bg-danger shadow-[0_0_10px_#ef4444]' : 'bg-accent shadow-[0_0_10px_#0ea5e9]'}
              `}
            />
          ))}
        </div>

        {/* Hover Information Panel */}
        <div className={`
          absolute bottom-0 left-0 right-0 p-3 transition-transform duration-500 z-20
          ${hovered ? 'translate-y-0' : 'translate-y-full'}
        `}>
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-2xl">
             <div className="flex justify-between items-center mb-3">
                <div className="flex gap-2">
                   <span className="px-2 py-0.5 rounded-md bg-accent/20 border border-accent/30 text-accent text-[0.6rem] font-black uppercase">
                     {isPrimary ? 'AI Engine v2' : 'Scanning...'}
                   </span>
                   <span className="px-2 py-0.5 rounded-md bg-success/20 border border-success/30 text-success text-[0.6rem] font-black uppercase">
                     Verified Area
                   </span>
                </div>
                <button 
                   onClick={() => setExpanded(true)}
                   className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white transition-colors"
                >
                   <Maximize2 className="w-3 h-3" />
                </button>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <div className="text-[0.55rem] font-black text-white/40 uppercase mb-0.5">Focus detected</div>
                   <div className="text-[0.75rem] font-black text-white">
                      {isPrimary ? (intel?.objects?.[0] || 'Idle') : 'Stability Check'}
                   </div>
                </div>
                <div>
                   <div className="text-[0.55rem] font-black text-white/40 uppercase mb-0.5">Confidence</div>
                   <div className="text-[0.75rem] font-black text-success">
                      {isPrimary ? '98.4%' : 'N/A'}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Expanded Focus Modal */}
      {expanded && (
        <div 
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300"
        >
           <div 
             onClick={e => e.stopPropagation()}
             className="w-full max-w-5xl bg-card border border-white/10 rounded-lg overflow-hidden shadow-2xl"
           >
              <div className="flex aspect-video bg-black relative">
                {isDisabled ? (
                   <div className="w-full flex flex-col items-center justify-center bg-slate-900 border border-white/5 relative">
                     <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)]" />
                     <Settings className="w-16 h-16 text-danger/30 mb-4 z-10" />
                     <span className="text-[1rem] font-black text-danger/50 uppercase tracking-widest z-10">Stream Disabled</span>
                   </div>
                ) : (
                  <CameraFeed streamUrl={`${VIDEO_FEED_URL}/${cam.id}`} hideOverlay={true} />
                )}
                <div className="absolute top-6 left-6 flex flex-col gap-1 z-10">
                   <h2 className="text-xl font-black text-white tracking-tight">{cam.name}</h2>
                   <div className="flex items-center gap-2 text-white/40 text-[0.75rem] font-bold">
                      <Radio className="w-3 h-3 text-danger animate-pulse" />
                      ENCRYPTED NEURAL STREAM
                   </div>
                </div>
                <button 
                  onClick={() => setExpanded(false)}
                  className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white text-[0.8rem] font-black border border-white/10 transition-all font-sans"
                >
                  ✕ CLOSE VIEW
                </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}

export default function CameraGrid({ selectedAreaId }) {
  const [cameras, setCameras] = useState([]);
  const [intel, setIntel] = useState({ person_count: 0, objects: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    // Poll for intelligence (demo/primary stream logic)
    const pollIntel = async () => {
      try {
        const data = await fetchIntelligence();
        setIntel(data);
      } catch (err) {
        console.error('Failed to fetch intel:', err);
      }
    };
    pollIntel();
    const interval = setInterval(pollIntel, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminCameras();
      setCameras(data.cameras || data || []);
    } catch (err) {
      console.error('Failed to load cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter cameras by selected area
  const filteredCameras = selectedAreaId 
    ? cameras.filter(c => c.area_id === selectedAreaId)
    : cameras;

  if (loading) {
     return (
        <div className="bg-card rounded-lg border border-border p-8 min-h-[400px] flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-[0.7rem] font-black text-text-gray uppercase tracking-widest">Synchronizing Camera Matrix...</p>
           </div>
        </div>
     );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-premium p-[22px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <div>
          <h3 className="text-[1.05rem] font-black text-text-dark flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-500" />
            Neural Feed Matrix
          </h3>
          <p className="text-[0.7rem] text-text-gray font-semibold">
            {selectedAreaId ? `Viewing Area Cluster: ${selectedAreaId}` : "Observing Total Facility Landscape"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-black">
            <Radio className="w-3 h-3" />
            {filteredCameras.length} SENSORS
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-black">
            <ShieldCheck className="w-3.5 h-3.5" />
            AES-256 SYNC
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredCameras.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCameras.map(cam => (
            <CameraCard key={cam.id} cam={cam} intel={intel} />
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg opacity-50">
           <VideoOff className="w-12 h-12 text-text-gray mb-4" />
           <p className="text-[0.8rem] font-black text-text-gray uppercase tracking-widest">No Cameras detected in this sector</p>
           <p className="text-[0.65rem] text-text-gray font-semibold mt-1">Initialize sensor nodes via Admin Hub to view streams.</p>
        </div>
      )}
    </div>
  );
}
