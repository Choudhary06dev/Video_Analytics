import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';
import { 
  ShieldAlert, 
  Terminal, 
  Lock, 
  Settings, 
  Activity, 
  HeartPulse, 
  Stethoscope, 
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';

export default function Maintenance() {
  const { maintenanceMode } = useSystem();
  const navigate = useNavigate();

  useEffect(() => {
    if (!maintenanceMode) {
      navigate('/');
    }
  }, [maintenanceMode, navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden relative">
      
      {/* Decorative Medical Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(15, 23, 42, 0.02) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        
        {/* Main Status Icon Container */}
        <div className="relative inline-block mb-12">
            <div className="absolute inset-0 bg-accent/20 blur-[60px] rounded-full animate-pulse"></div>
            <div className="relative w-32 h-32 bg-white border border-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-700">
                <div className="absolute inset-2 border-2 border-slate-50 rounded-[2rem]"></div>
                <Settings className="w-16 h-16 text-slate-800 animate-[spin_8s_linear_infinite]" />
                
                {/* Orbital Icons */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
                    <ShieldAlert className="w-6 h-6 text-danger" />
                </div>
                <div className="absolute -bottom-2 -left-6 w-14 h-14 bg-accent border border-white/20 rounded-2xl flex items-center justify-center shadow-xl rotate-12">
                    <Activity className="w-8 h-8 text-white animate-pulse" />
                </div>
            </div>
        </div>

        {/* Branding & Title */}
        <div className="space-y-4 mb-12">
            <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Al Shiffa Hospital</span>
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                System <span className="text-accent underline decoration-slate-900/5 underline-offset-8">Optimizing</span>
            </h1>
            <p className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-400">
                Global Clinical Synchronization
            </p>
        </div>

        {/* Maintenance Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Terminal className="w-5 h-5 text-accent" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Orchestrator</p>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Core Integrity Sync</p>
                    </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[75%] animate-[shimmer_2s_infinite]"></div>
                </div>
                <p className="text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-3">
                    Deploying Neural Update v4.2.0
                </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lock className="w-5 h-5 text-danger" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Security Layer</p>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Clinical Lockdown</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
                    <p className="text-left text-[9px] font-bold text-danger uppercase tracking-widest">
                        Public Enrollment Terminated
                    </p>
                </div>
            </div>
        </div>

        {/* Footer Indicators */}
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-8 opacity-40">
                <Stethoscope className="w-8 h-8 text-slate-400" />
                <div className="w-px h-8 bg-slate-200"></div>
                <HeartPulse className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
        </div>

      </div>

      <div className="fixed bottom-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-3">
        <Zap className="w-3 h-3 text-accent" />
        Al Shiffa Hospital • Enterprise Protocol v4.2.0
      </div>
    </div>
  );
}
