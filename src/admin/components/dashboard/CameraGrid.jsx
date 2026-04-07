import React from 'react';
import { User, Video } from 'lucide-react';

export default function CameraGrid() {
  return (
    <div className="lg:col-span-2 flex flex-col items-stretch h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-bold text-slate-800">
          Live AI Feed <span className="inline-flex ml-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </h2>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors">
          View Grid
        </button>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4 flex-1">
        {/* Camera 1 */}
        <div className="group flex-1 relative bg-slate-900 rounded-2xl overflow-hidden min-h-[200px] border border-slate-200 shadow-sm">
          {/* Simulated Image Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-80 mix-blend-overlay"></div>
          
          {/* Bounding Box Simulation */}
          <div className="absolute top-[20%] left-[30%] w-[15%] h-[40%] outline outline-2 outline-emerald-400 rounded-sm bg-emerald-500/10 transition-all duration-1000 group-hover:outline-emerald-300">
            <div className="absolute -top-7 left-[-2px] bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-t-sm inline-flex items-center gap-1 shadow-md">
              <User className="w-3 h-3" /> Person 98%
            </div>
          </div>

          {/* Camera Details Overlay */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between object-cover pointer-events-none">
            <div className="flex justify-between items-start">
              <span className="bg-black/50 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded shadow-sm border border-white/10">CAM-01 Entrance</span>
              <span className="bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1"><Video className="w-3 h-3"/> REC</span>
            </div>
          </div>
        </div>

        {/* Camera 2 */}
        <div className="group flex-1 relative bg-slate-900 rounded-2xl overflow-hidden min-h-[200px] border border-slate-200 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-bl from-slate-800 to-slate-900 opacity-80 mix-blend-overlay"></div>
          <div className="absolute top-[40%] right-[20%] w-[25%] h-[35%] outline outline-2 outline-rose-500 rounded-sm bg-rose-500/10 motion-safe:animate-[pulse_2s_ease-in-out_infinite]">
            <div className="absolute -top-7 left-[-2px] bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-t-sm shadow-md">
              🚨 Unauthorized
            </div>
          </div>
          <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start">
              <span className="bg-black/50 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded shadow-sm border border-white/10">CAM-04 Restricted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
