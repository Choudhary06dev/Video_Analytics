import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, Cpu, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BASE } from '../api';
import authBg from '../assets/auth-bg.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${BASE}/auth/login`, {
        email,
        password
      });
      
      login(response.data.user, response.data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'System Authentication Failed. Access Denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen grid lg:grid-cols-2 bg-[#020617] font-sans selection:bg-accent/30 overflow-hidden">
      
      {/* Left Column: Visual & Branding */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        {/* Abstract Background Image */}
        <div className="absolute inset-0 z-0">
           <img src={authBg} alt="Background" className="w-full h-full object-cover opacity-60 scale-105 animate-[pulse_10s_infinite]" />
           <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/90 via-[#020617]/40 to-transparent"></div>
           <div className="absolute inset-0 bg-[#020617]/20 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-tr from-accent to-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-white uppercase tracking-[0.2em]">Nexer Tech</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl font-black text-white leading-tight mb-6 uppercase tracking-tighter italic">
              Nexer <span className="text-accent underline decoration-white/20 underline-offset-8">Technology</span> Solutions
            </h2>
            <p className="text-text-gray text-lg font-medium leading-relaxed">
              Experience next-generation video analytics powered by neural networks. Secure, fast, and infinitely scalable.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 grid grid-cols-2 gap-8">
           <div className="flex flex-col gap-2">
              <Cpu className="w-8 h-8 text-emerald-400 opacity-50 mb-2" />
              <h4 className="text-white font-bold uppercase tracking-wider text-xs">AI Inference</h4>
              <p className="text-[11px] text-text-gray uppercase tracking-widest font-black opacity-60">Real-time YOLOv8 Analysis</p>
           </div>
           <div className="flex flex-col gap-2">
              <Zap className="w-8 h-8 text-accent opacity-50 mb-2" />
              <h4 className="text-white font-bold uppercase tracking-wider text-xs">Low Latency</h4>
              <p className="text-[11px] text-text-gray uppercase tracking-widest font-black opacity-60">Optimized Stream Logic</p>
           </div>
        </div>

        {/* Floating Particle Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
           <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]"></div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex items-center justify-center p-6 relative overflow-y-auto">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-8">
             <div className="lg:hidden flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-accent animate-pulse" />
                <span className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Nexer Tech</span>
             </div>
             <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter italic">
               System <span className="text-accent">Login</span>
             </h3>
             <p className="text-white font-black text-[9px] uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                Initialize Nexer Enterprise Session
             </p>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-danger/10 border-l-4 border-danger rounded-r-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
              <div className="w-2 h-2 rounded-full bg-danger animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
              <p className="text-danger text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white uppercase tracking-[0.4em] pl-1 font-sans">Operator Identification</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="w-3.5 h-3.5 text-white/60 group-focus-within:text-accent group-focus-within:scale-110 transition-all duration-300" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="USERNAME@NEXER.SYS"
                  className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] rounded-2xl py-4 flex items-center pl-14 pr-4 text-sm text-white font-bold outline-none transition-all placeholder:text-white/60 placeholder:font-black placeholder:tracking-[0.1em] selection:bg-accent/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white uppercase tracking-[0.4em] pl-1 font-sans">Neural Access Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="w-3.5 h-3.5 text-white/60 group-focus-within:text-accent group-focus-within:scale-110 transition-all duration-300" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PASSWORD-KEY"
                  className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] rounded-2xl py-4 flex items-center pl-14 pr-14 text-sm text-white font-bold outline-none transition-all placeholder:text-white/60 placeholder:font-black placeholder:tracking-[0.1em] selection:bg-accent/40"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-accent transition-all duration-300 transform active:scale-90"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="hidden peer" />
                <div className="w-4 h-4 rounded border-2 border-white/20 peer-checked:bg-accent peer-checked:border-accent transition-all flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-[1px] opacity-0 peer-checked:opacity-100 transition-all transform scale-50 peer-checked:scale-100"></div>
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-white transition-colors">Keep Station Linked</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-[#020617] font-black py-4 rounded-2xl flex items-center justify-center gap-4 hover:shadow-[0_15px_35px_rgba(255,255,255,0.1)] active:scale-[0.97] transition-all disabled:opacity-50 group mt-2 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-[0.4em] text-[11px]">Authorize Link</span>
                  <Activity className="w-4 h-4 group-hover:scale-125 transition-transform duration-500" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-8 text-center border-t border-white/5 pt-6">
             <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em] mb-3">Unauthorized to Nexer Network?</p>
             <Link 
              to="/register" 
              className="inline-flex items-center gap-3 text-white font-black uppercase text-[9px] tracking-[0.4em] border-2 border-white/10 px-6 py-3 rounded-2xl hover:border-accent/40 hover:text-accent hover:bg-white/5 transition-all italic hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
             >
                <div className="w-1 h-1 bg-accent rounded-full"></div>
                Initialize Security Clearances
             </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
