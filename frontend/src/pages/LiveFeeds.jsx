import React, { useState } from 'react';
import { Video, Grid, List, Search, Filter, Camera } from 'lucide-react';

export default function LiveFeeds() {
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');

  const cameras = [
    { id: 1, name: 'Main Entrance', zone: 'Exterior', status: 'active', detections: 24, lastAlert: '2 mins ago' },
    { id: 2, name: 'Warehouse A-1', zone: 'Interior', status: 'active', detections: 8, lastAlert: 'None' },
    { id: 3, name: 'Loading Dock 4', zone: 'Logistics', status: 'active', detections: 115, lastAlert: '15 mins ago' },
    { id: 4, name: 'Parking Lot East', zone: 'Exterior', status: 'inactive', detections: 0, lastAlert: 'N/A' },
    { id: 5, name: 'Server Room', zone: 'Secure', status: 'active', detections: 2, lastAlert: 'None' },
    { id: 6, name: 'Reception Lobby', zone: 'Interior', status: 'active', detections: 42, lastAlert: '5 mins ago' },
    { id: 7, name: 'Perimeter Fence B', zone: 'Exterior', status: 'active', detections: 1, lastAlert: '6h ago' },
    { id: 8, name: 'Office Floor 2', zone: 'Interior', status: 'active', detections: 12, lastAlert: 'None' },
  ];

  const filteredCameras = filter === 'all' ? cameras : cameras.filter(c => c.zone.toLowerCase() === filter.toLowerCase());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Live Camera Feeds</h1>
          <p className="text-text-gray text-sm">Monitoring {cameras.filter(c => c.status === 'active').length} active streams across all zones.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-accent-soft text-accent shadow-sm' : 'text-text-gray hover:text-text-dark'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent-soft text-accent shadow-sm' : 'text-text-gray hover:text-text-dark'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-gray" />
          <input 
            type="text" 
            placeholder="Search by camera name or ID..." 
            className="w-full bg-card border border-border focus:border-accent focus:ring-4 focus:ring-accent/10 text-sm text-text-dark rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-gray" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-card border border-border focus:border-accent focus:ring-4 focus:ring-accent/10 text-sm text-text-dark rounded-xl pl-10 pr-4 py-2.5 outline-none appearance-none transition-all"
          >
            <option value="all">All Zones</option>
            <option value="exterior">Exterior</option>
            <option value="interior">Interior</option>
            <option value="logistics">Logistics</option>
            <option value="secure">Secure</option>
          </select>
        </div>
        <button className="bg-accent text-white px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md">
          <Camera className="w-4 h-4" /> Add Camera
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCameras.map((cam) => (
            <div key={cam.id} className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="relative aspect-video bg-[#0f172a] border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/30"></div>
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="bg-black/60 backdrop-blur-md text-[10px] text-white px-1.5 py-0.5 rounded font-medium border border-white/10 uppercase">
                    {cam.zone}
                  </span>
                  {cam.status === 'inactive' && (
                    <span className="bg-danger/80 backdrop-blur-md text-[10px] text-white px-1.5 py-0.5 rounded font-medium shadow-sm uppercase">
                      OFFLINE
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-card text-accent p-3 rounded-full shadow-lg transform hover:scale-110 transition-transform">
                    <Video className="w-6 h-6" />
                  </button>
                </div>
                {cam.status === 'active' && (
                   <span className="absolute bottom-2 right-2 flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                   </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-text-dark truncate">{cam.name}</h3>
                  <span className="text-[10px] font-medium text-text-gray uppercase">ID: {cam.id.toString().padStart(3, '0')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-gray font-medium leading-tight">Detections</span>
                    <span className="text-xs font-bold text-text-dark">{cam.detections}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-gray font-medium leading-tight">Last Alert</span>
                    <span className="text-xs font-bold text-text-dark">{cam.lastAlert}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Camera Name</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Zone</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Detections Today</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Last Alert</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCameras.map((cam) => (
                <tr key={cam.id} className="hover:bg-surface transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cam.status === 'active' ? 'bg-accent-soft text-accent' : 'bg-surface text-text-gray'} flex items-center justify-center`}>
                        <Video className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-text-dark">{cam.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-medium text-text-gray">{cam.zone}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cam.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'}`}>
                      {cam.status}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-bold text-text-dark">{cam.detections}</span></td>
                  <td className="px-6 py-4"><span className="text-xs text-text-gray">{cam.lastAlert}</span></td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-accent hover:opacity-80 text-xs font-bold">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
