import React from 'react';
import KPICards from '../components/dashboard/KPICards';
import CameraGrid from '../components/dashboard/CameraGrid';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      {/* KPI Cards Section */}
      <KPICards />

      {/* Bottom Grid: Cameras & Charts */}
      <div className="grid lg:grid-cols-3 gap-8">
        <CameraGrid />
        <div className="lg:col-span-1 min-h-[350px]">
          <AnalyticsChart />
        </div>
      </div>
    </div>
  );
}
