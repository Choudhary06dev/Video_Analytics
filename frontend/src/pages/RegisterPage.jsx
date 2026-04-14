import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2, ShieldCheck, Target, Globe } from 'lucide-react';
import axios from 'axios';
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
      setError("Data Conflict: Security keys do not match.");
      setLoading(false);
      return;
    }
    
    try {
      await axios.post('http://localhost:8000/auth/register', {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Initialization Failed. Access Refused.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen grid lg:grid-cols-2 bg-[#020617] font-sans selection:bg-accent/30 overflow-hidden text-white">
      
      {/* Visual Column */}
      <div className="relative hidden lg:flex flex-col justify-between p-8">
         <div className="absolute inset-0 z-0">
            <img src={authBg} alt="Background" className="w-full h-full object-cover opacity-40 brightness-50" />
            <div className="absolute inset-0 bg-[#020617]/70"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent"></div>
         </div>

         <div className="relative z-10">
            <h2 className="text-[8rem] font-black opacity-[0.05] absolute -top-20 -left-12 select-none tracking-tighter uppercase">NEXER</h2>
            <div className="flex items-center gap-3 mb-6">
               <Globe className="w-6 h-6 text-accent animate-spin-slow" />
               <span className="text-xs font-black uppercase tracking-[0.4em]">Nexer Solutions v2.4</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter mb-4 uppercase leading-none">Nexer <br/> <span className="text-accent">Enterprise</span></h1>
            <p className="text-white max-w-sm text-base font-medium leading-relaxed opacity-90">
               Establish your professional credentials within the Nexer Technology network.
            </p>
         </div>

         <div className="relative z-10 flex items-center gap-10">
            <div className="flex items-center gap-4">
               <Target className="w-5 h-5 text-accent" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Secure Node Initialization</span>
            </div>
            <div className="flex items-center gap-4">
               <ShieldCheck className="w-5 h-5 text-accent" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Encrypted Metadata Entry</span>
            </div>
         </div>
      </div>

      {/* Form Column */}
      <div className="flex items-center justify-center p-6 bg-card/10 backdrop-blur-md relative overflow-y-auto">
         <div className="w-full max-w-[420px]">
            
            <div className="mb-8">
               <h3 className="text-3xl font-black uppercase italic tracking-tight mb-1 font-sans">Personnel <span className="text-accent">Entry</span></h3>
               <p className="text-[9px] text-white font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                  Initialize Nexer Enterprise Identity
               </p>
            </div>

            {success ? (
               <div className="text-center py-20 bg-accent/5 rounded-[2.5rem] border-2 border-accent/20 animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                     <ShieldCheck className="w-10 h-10 text-accent" />
                  </div>
                  <h4 className="text-2xl font-black italic text-white mb-2 uppercase">Identity Synchronized</h4>
                  <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Routing to Secure Portal...</p>
               </div>
            ) : (
               <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                     <div className="p-5 bg-danger/10 border-l-4 border-danger rounded-r-2xl flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-danger shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                        <p className="text-danger text-[10px] font-black uppercase tracking-[0.2em]">{error}</p>
                     </div>
                  )}

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-white uppercase tracking-[0.4em] pl-1">Full Operator Name</label>
                     <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-accent transition-all duration-300" />
                        <input 
                           name="fullName"
                           required
                           value={formData.fullName}
                           onChange={handleChange}
                           placeholder="FIRST LAST"
                           className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent/40 focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.1)] py-4 pl-14 pr-4 rounded-2xl text-sm text-white font-bold outline-none transition-all placeholder:text-white/60 placeholder:font-black placeholder:tracking-[0.1em]"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-white uppercase tracking-[0.4em] pl-1">Network Node (Email)</label>
                     <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-accent transition-all duration-300" />
                        <input 
                           type="email"
                           name="email"
                           required
                           value={formData.email}
                           onChange={handleChange}
                           placeholder="NODE-ADDR@NEXER.CORE"
                           className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent/40 focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.1)] py-4 pl-14 pr-4 rounded-2xl text-sm text-white font-bold outline-none transition-all placeholder:text-white/60 placeholder:font-black placeholder:tracking-[0.1em]"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-white uppercase tracking-[0.4em] pl-1">Access Key</label>
                        <div className="relative group">
                           <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-accent transition-all duration-300" />
                           <input 
                              type="password"
                              name="password"
                              required
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="••••"
                              className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent/40 focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.1)] py-4 pl-14 pr-4 rounded-2xl text-sm text-white font-bold outline-none transition-all placeholder:text-white/60"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-white uppercase tracking-[0.4em] pl-1">Verify Key</label>
                        <div className="relative group">
                           <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-accent transition-all duration-300" />
                           <input 
                              type="password"
                              name="confirmPassword"
                              required
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder="••••"
                              className="w-full bg-white/[0.08] border-2 border-white/10 focus:border-accent/40 focus:bg-white/[0.12] focus:shadow-[0_0_25px_rgba(6,182,212,0.1)] py-4 pl-14 pr-4 rounded-2xl text-sm text-white font-bold outline-none transition-all placeholder:text-white/60"
                           />
                        </div>
                     </div>
                  </div>

                  <button 
                     type="submit" 
                     disabled={loading}
                     className="w-full bg-accent text-[#020617] font-black py-4 rounded-2xl flex items-center justify-center gap-4 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-[0_15px_30px_rgba(6,182,212,0.3)] group"
                  >
                     {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                        <>
                           <span className="uppercase tracking-[0.4em] text-[10px]">Sync Credentials</span>
                           <ShieldCheck className="w-4 h-4 group-hover:rotate-12 transition-transform duration-500" />
                        </>
                     )}
                  </button>

                  <Link 
                     to="/login" 
                     className="block text-center text-[9px] font-black text-white uppercase tracking-[0.4em] hover:text-accent transition-colors mt-6 py-2 border-t border-white/5 pt-4"
                  >
                     Authorized Personnel? Portal Login
                  </Link>
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
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
