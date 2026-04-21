import React, { useState } from 'react';
import KPICards from '../components/dashboard/KPICards';
import CameraGrid from '../components/dashboard/CameraGrid';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import ConfidencePanel from '../components/dashboard/ConfidencePanel';
import NeuralStream from '../components/dashboard/NeuralStream';
import FacilityHeatmap from '../components/dashboard/FacilityHeatmap';
import PerformanceMetrics from '../components/dashboard/PerformanceMetrics';
import AreaSidebar from '../components/dashboard/AreaSidebar';
import { RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 1. Lateral Navigation: Area Hierarchy */}
      <AreaSidebar onSelectArea={setSelectedAreaId} />

      {/* 2. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50">
        <div className="flex flex-col gap-0 pb-20 max-w-[1500px] mx-auto pt-6 px-6">
          
          {/* Global KPI Header */}
          <KPICards />

          {/* Command Hub Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-10 mb-8 gap-4 px-2">
            <div>
              <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">Command Hub</h2>
              <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
                {selectedAreaId ? `Monitoring Zone ID: ${selectedAreaId}` : "Global Facility Intelligence"}
                <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
                V2.0.0-PRO
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-full text-[0.7rem] font-black shadow-[0_4px_12px_rgba(34,197,94,0.3)] border border-success uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-[pulse_1.5s_infinite]" />
                Neural Sync Stable
              </div>
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-card text-text-dark border border-border rounded-xl text-[0.75rem] font-bold cursor-pointer transition-all hover:border-accent hover:text-accent shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recalibrate
              </button>
            </div>
          </div>

          {/* Live Video Feeds (Filtered by Area) */}
          <CameraGrid selectedAreaId={selectedAreaId} />

          {/* Real-time Analytics & Confidence Panel */}
          <div className="grid lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <AnalyticsChart />
            </div>
            <div className="lg:col-span-1">
              <ConfidencePanel />
            </div>
          </div>

          {/* Performance Metrics (Bar Charts) */}
          <PerformanceMetrics />

          {/* Neural Stream & Facility Heatmap */}
          <div className="grid lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <NeuralStream />
            </div>
            <div className="lg:col-span-1">
              <FacilityHeatmap />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
