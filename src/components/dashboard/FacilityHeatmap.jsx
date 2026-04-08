import React, { useMemo } from 'react';

export default function FacilityHeatmap() {
  const sectors = ["ICU-Zone", "Reception", "Emergency", "Ward-A", "Lab-1", "Perimeter"];
  
  // Generate random heatmap data
  const heatmapData = useMemo(() => {
    const data = [];
    for (let i = 0; i < sectors.length; i++) {
      const row = [];
      for (let j = 0; j < 16; j++) {
        // Random intensity between 0 and 100
        // Bias towards middle columns
        const distanceToCenter = Math.abs(j - 8);
        let intensity = Math.random() * 80 + (20 - distanceToCenter * 2);
        if (i === 2 && j > 6 && j < 10) intensity = Math.random() * 20 + 80; // Emergency peak
        if (intensity > 100) intensity = 100;
        if (intensity < 0) intensity = 0;
        row.push(intensity);
      }
      data.push(row);
    }
    return data;
  }, []);

  const getColor = (val) => {
    if (val < 20) return 'bg-slate-100 dark:bg-slate-800';
    if (val < 40) return 'bg-blue-200';
    if (val < 60) return 'bg-blue-400';
    if (val < 80) return 'bg-orange-400';
    return 'bg-danger';
  };

  return (
    <div className="bg-card rounded-3xl p-6 border border-border shadow-premium h-[400px] flex flex-col w-full">
      <div className="flex justify-between items-center mb-5 shrink-0">
        <div>
          <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Facility Heatmap</h3>
          <div className="text-[0.75rem] text-text-gray font-medium mt-0.5">
            Activity density by sector
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[0.65rem] text-text-gray font-semibold">Low</span>
          <div className="w-[60px] h-2 rounded-full bg-gradient-to-r from-slate-200 via-blue-400 to-danger" />
          <span className="text-[0.65rem] text-text-gray font-semibold">High</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-col gap-2">
          {sectors.map((sector, i) => (
            <div key={sector} className="flex items-center gap-3">
              <div className="w-20 text-[0.7rem] font-bold text-text-gray text-right truncate">
                {sector}
              </div>
              <div className="flex-1 flex gap-1.5">
                {heatmapData[i].map((val, j) => (
                  <div 
                    key={j} 
                    className={`flex-1 aspect-square rounded-sm ${getColor(val)} transition-all duration-300 hover:scale-110 hover:shadow-md cursor-crosshair`}
                    title={`${sector} - Activity: ${Math.round(val)}%`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 p-3 bg-bg rounded-xl flex justify-between items-center shrink-0 border border-border">
        <div className="text-[0.75rem] text-text-gray">
          <span className="font-bold text-text-dark mr-1">Peak Activity:</span> 
          2:00 PM - 4:00 PM
        </div>
        <button className="px-3 py-1.5 bg-accent text-white border-none rounded-lg text-[0.7rem] font-bold cursor-pointer hover:bg-opacity-90 transition-all shadow-[0_2px_8px_rgba(14,165,233,0.3)]">
          Generate Report
        </button>
      </div>
    </div>
  );
}
