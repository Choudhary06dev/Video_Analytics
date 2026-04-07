import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Shield, Activity, ArrowRight } from 'lucide-react';
import { DASHBOARD_CONFIG } from '../config';

// Import isolated frontend CSS
import '../assets/frontend.css';

export default function FrontendHome() {
  return (
    <div className="frontend-layout bg-slate-50 text-slate-800 font-sans">
      {/* Navbar */}
      <nav className="h-20 bg-white border-b border-slate-200 flex items-center px-8 lg:px-24">
        <div className="flex items-center gap-3 text-indigo-700 font-bold">
          <Camera className="w-8 h-8" />
          <span className="text-2xl tracking-tight">{DASHBOARD_CONFIG.PROJECT_NAME}</span>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <a href="#" className="font-medium text-slate-600 hover:text-indigo-600">Features</a>
          <a href="#" className="font-medium text-slate-600 hover:text-indigo-600">Pricing</a>
          <Link 
            to="/admin"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Admin Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-8 py-20 lg:py-32 flex flex-col items-center text-center">
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Intelligent Video <br className="hidden lg:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Analytics Platform</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mb-10">
          State-of-the-art AI vision engine for live facility monitoring, anomaly detection, and automated threat alerts in real-time.
        </p>
        
        <div className="flex items-center gap-4">
          <button className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] transform hover:-translate-y-1">
            Request Demo
          </button>
          <button className="bg-white text-indigo-600 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 hover:border-indigo-200 transition-colors shadow-sm">
            Watch Video
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left w-full">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Camera className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Advanced AI Vision</h3>
            <p className="text-slate-500">Detect objects, anomalies, and unauthorized access across unlimited scalable camera networks globally.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <Activity className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Real-Time Processing</h3>
            <p className="text-slate-500">Ultra-low latency analytics engine built to provide instantaneous visual insights directly to standard operators.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Intelligent Alerts</h3>
            <p className="text-slate-500">Automate emergency protocols based on strict AI bounding box triggers and dynamic behavioral thresholds.</p>
          </div>
        </div>
      </main>

    </div>
  );
}
