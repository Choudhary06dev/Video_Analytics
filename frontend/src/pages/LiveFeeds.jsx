import { Video, Grid, List, Search, Filter, Camera, Loader2 } from 'lucide-react';
import { fetchAdminCameras } from '../services/cameraService';

export default function LiveFeeds() {
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      const data = await fetchAdminCameras();
      setCameras(data || []);
    } catch (err) {
      console.error('Failed to load cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCameras = filter === 'all' ? cameras : cameras.filter(c => c.zone.toLowerCase() === filter.toLowerCase());

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Live Camera Feeds</h1>
          <p className="text-text-gray text-sm">Monitoring {cameras.filter(c => c.status === 'active').length} active streams across all zones.</p>
        </div>

        <div className="flex items-center gap-2 bg-card p-1 rounded-lg border border-border">
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
            className="w-full bg-card border border-border focus:border-accent focus:ring-4 focus:ring-accent/10 text-sm text-text-dark rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-gray" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-card border border-border focus:border-accent focus:ring-4 focus:ring-accent/10 text-sm text-text-dark rounded-lg pl-10 pr-4 py-2.5 outline-none appearance-none transition-all"
          >
            <option value="all">All Zones</option>
            <option value="exterior">Exterior</option>
            <option value="interior">Interior</option>
            <option value="logistics">Logistics</option>
            <option value="secure">Secure</option>
          </select>
        </div>
        <button className="bg-accent text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md">
          <Camera className="w-4 h-4" /> Add Camera
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-[0.65rem] font-black text-text-gray uppercase tracking-[0.2em]">Acquiring Satellite Uplinks</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCameras.map((cam) => (
            <div key={cam.id} className="group bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="relative aspect-video bg-[#0f172a] border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/30"></div>
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="bg-black/60 backdrop-blur-md text-[10px] text-white px-1.5 py-0.5 rounded font-medium border border-white/10 uppercase">
                    {cam.area_id ? `Area ${cam.area_id}` : 'General'}
                  </span>
                  {!cam.is_active && (
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
                {cam.is_active && (
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
                    <span className="text-[10px] text-text-gray font-medium leading-tight">Config</span>
                    <span className="text-xs font-bold text-text-dark">{cam.stream_url ? 'Configured' : 'No URL'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-gray font-medium leading-tight">Status</span>
                    <span className={`text-xs font-bold ${cam.is_active ? 'text-success' : 'text-danger'}`}>{cam.is_active ? 'Active' : 'Standby'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Camera Name</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Area</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider">Reference ID</th>
                <th className="px-6 py-4 text-xs font-bold text-text-gray uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCameras.map((cam) => (
                <tr key={cam.id} className="hover:bg-surface transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cam.is_active ? 'bg-accent-soft text-accent' : 'bg-surface text-text-gray'} flex items-center justify-center`}>
                        <Video className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-text-dark">{cam.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-medium text-text-gray">{cam.area_id ? `Area ${cam.area_id}` : 'General'}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cam.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'}`}>
                      {cam.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-bold text-text-dark">CAD-{cam.id.toString().padStart(4, '0')}</span></td>
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
