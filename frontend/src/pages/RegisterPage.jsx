import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Mail, Lock, User, Loader2, 
  ShieldCheck, Globe, Activity, Cpu, Zap, Database 
} from 'lucide-react';
import axios from 'axios';
import { BASE } from '../api';
import authBg from '../assets/auth-bg.png';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Data Conflict: Access codes do not match.");
      setLoading(false);
      return;
    }
    
    try {
      await axios.post(`${BASE}/auth/register`, {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Identity Initialization Refused. Connection Terminated.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen grid lg:grid-cols-2 bg-[#020617] font-sans selection:bg-accent/30 overflow-hidden">
      
      {/* Left Column: Visual & Global Branding */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        {/* Abstract Background Image */}
        <div className="absolute inset-0 z-0">
           <img src={authBg} alt="Background" className="w-full h-full object-cover opacity-60 scale-105 animate-[pulse_12s_infinite]" />
           <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/95 via-[#020617]/50 to-transparent"></div>
           <div className="absolute inset-0 bg-[#020617]/30 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-tr from-accent to-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Globe className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <span className="text-xl font-black text-white uppercase tracking-[0.2em]">Nexer Network</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl font-black text-white leading-[1.1] mb-8 uppercase tracking-tighter italic">
              Global <span className="text-accent underline decoration-white/20 underline-offset-8">Personnel</span> <br/> 
              Onboarding <span className="text-white/40">Unit</span>
            </h2>
            
            <div className="space-y-6">
              <p className="text-text-gray text-lg font-medium leading-relaxed">
                Welcome to the Nexer Ecosystem. By registering your node, you gain access to our distributed neural analytics architecture and high-security personnel ledger.
              </p>
              
              <div className="bg-white/[0.03] border border-white/10 p-6 rounded-lg backdrop-blur-md">
                <h4 className="text-accent font-black uppercase tracking-[0.2em] text-[10px] mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                  Protocol Initialization
                </h4>
                <p className="text-white/60 text-xs font-semibold leading-loose italic">
                  "Establishing a unique cryptographic identity is required for all field operators. Your metadata will be encrypted and synced across our global secure nodes."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
           <div className="flex flex-col gap-2 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
              <Database className="w-6 h-6 text-emerald-400 opacity-60 mb-2" />
              <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Secure Registry</h4>
              <p className="text-[11px] text-text-gray tracking-widest font-black opacity-50">Identity Vault</p>
           </div>
           <div className="flex flex-col gap-2 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
              <ShieldCheck className="w-6 h-6 text-accent opacity-60 mb-2" />
              <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Neural Auth</h4>
              <p className="text-[11px] text-text-gray tracking-widest font-black opacity-50">Encrypted Keys</p>
           </div>
           <div className="flex flex-col gap-2 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
              <Activity className="w-6 h-6 text-blue-400 opacity-60 mb-2" />
              <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">Node Status</h4>
              <p className="text-[11px] text-text-gray tracking-widest font-black opacity-50">Live Syncing</p>
           </div>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="flex items-center justify-center p-6 relative overflow-y-auto">
        <div className="w-full max-w-[420px]">
          
          <div className="mb-10 text-center lg:text-left">
             <div className="lg:hidden flex items-center justify-center lg:justify-start gap-3 mb-8">
                <Globe className="w-8 h-8 text-accent animate-spin-slow" />
                <span className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Nexer Tech</span>
             </div>
             
             {success ? (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-4xl font-black text-accent mb-2 uppercase tracking-tighter italic">
                    Identity <span className="text-white">Linked</span>
                  </h3>
                  <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em]">Node Established. Redirecting to Portal...</p>
               </div>
             ) : (
               <>
                  <h3 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter italic leading-none">
                    Personnel <span className="text-accent underline decoration-white/10 underline-offset-8">Entry</span>
                  </h3>
                  <p className="text-white font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center lg:justify-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                    Initialize High-Security Operator Credentials
                  </p>
               </>
             )}
          </div>

          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
               <div className="w-32 h-32 bg-accent/10 rounded-full flex items-center justify-center relative shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                  <div className="absolute inset-0 border-2 border-accent/20 rounded-full animate-ping"></div>
                  <ShieldCheck className="w-16 h-16 text-accent" />
               </div>
               <div className="space-y-2">
                  <p className="text-sm font-bold text-white tracking-widest">TRANSACTION SUCCESSFUL</p>
                  <div className="w-24 h-1 bg-accent/20 mx-auto rounded-full overflow-hidden">
                     <div className="h-full bg-accent w-full animate-[progress_2s_ease-in-out]"></div>
                  </div>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-700">
              {error && (
                <div className="mb-6 p-5 bg-danger/10 border-l-4 border-danger rounded-r-lg flex items-center gap-4 animate-shake">
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                  <p className="text-danger text-[10px] font-black uppercase tracking-widest">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white uppercase tracking-[0.4em] pl-1 font-sans">Operator Identity (Full Name)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <User className="w-3.5 h-3.5 text-white/60 group-focus-within:text-accent group-focus-within:scale-110 transition-all duration-300" />
                  </div>
                  <input 
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="FIRST LAST"
                    className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] rounded-lg py-4 flex items-center pl-14 pr-4 text-sm text-white font-bold outline-none transition-all placeholder:text-white/60 placeholder:font-black placeholder:tracking-[0.1em] selection:bg-accent/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white uppercase tracking-[0.4em] pl-1 font-sans">Network Address (Email)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="w-3.5 h-3.5 text-white/60 group-focus-within:text-accent group-focus-within:scale-110 transition-all duration-300" />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="NODE-ADDR@NEXER.CORE"
                    className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] rounded-lg py-4 flex items-center pl-14 pr-4 text-sm text-white font-bold outline-none transition-all placeholder:text-white/60 placeholder:font-black placeholder:tracking-[0.1em] selection:bg-accent/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white uppercase tracking-[0.4em] pl-1 font-sans">Access Key</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="w-3.5 h-3.5 text-white/60 group-focus-within:text-accent group-focus-within:scale-110 transition-all duration-300" />
                    </div>
                    <input 
                      type="password" 
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••"
                      className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] rounded-lg py-4 flex items-center pl-14 pr-4 text-sm text-white font-bold outline-none transition-all placeholder:text-white/40 selection:bg-accent/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white uppercase tracking-[0.4em] pl-1 font-sans">Verify Key</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Shield className="w-3.5 h-3.5 text-white/60 group-focus-within:text-accent group-focus-within:scale-110 transition-all duration-300" />
                    </div>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••"
                      className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] rounded-lg py-4 flex items-center pl-14 pr-4 text-sm text-white font-bold outline-none transition-all placeholder:text-white/40 selection:bg-accent/40"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-accent text-[#020617] font-black py-5 rounded-lg flex items-center justify-center gap-4 hover:shadow-[0_15px_35px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span className="uppercase tracking-[0.4em] text-[11px]">Sync Credentials</span>
                      <Activity className="w-4 h-4 group-hover:scale-125 transition-transform duration-500" />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8 text-center border-t border-white/5 pt-6">
                <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em] mb-4">Existing Personnel Registry?</p>
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-3 text-white font-black uppercase text-[9px] tracking-[0.4em] border-2 border-white/10 px-8 py-4 rounded-lg hover:border-accent/40 hover:text-accent hover:bg-white/5 transition-all italic hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] active:scale-95"
                >
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                  Direct Station Access
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
          animation-iteration-count: 2;
        }
      `}</style>
    </div>
  );
}
