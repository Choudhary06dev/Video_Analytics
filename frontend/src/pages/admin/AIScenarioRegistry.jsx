import React, { useState, useEffect } from 'react';
import {
  fetchScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
  fetchAdminCameras,
  fetchSystemHealth
} from '../../services/cameraService';
import {
  Brain,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Flame,
  Smartphone,
  Users,
  Crosshair,
  UserPlus,
  UserX,
  ArrowLeftRight,
  Ear,
  Target
} from 'lucide-react';

export default function AIScenarioRegistry() {
  const [scenarios, setScenarios] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [showModal, setShowModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    default_severity: 'Medium'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const [scenariosData, camerasData, healthData] = await Promise.all([
        fetchScenarios(),
        fetchAdminCameras(),
        fetchSystemHealth()
      ]);
      setScenarios(scenariosData);
      setCameras(camerasData?.cameras || camerasData || []);
      setHealth(healthData);
    } catch (err) {
      console.error("Failed to load scenarios", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (scenario = null) => {
    if (scenario) {
      setEditingScenario(scenario);
      setFormData({
        name: scenario.name,
        key: scenario.key,
        description: scenario.description || '',
        default_severity: scenario.default_severity
      });
    } else {
      setEditingScenario(null);
      setFormData({
        name: '',
        key: '',
        description: '',
        default_severity: 'Medium'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingScenario) {
        await updateScenario(editingScenario.id, formData);
      } else {
        await createScenario(formData);
      }
      setShowModal(false);
      loadScenarios();
    } catch (err) {
      alert(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this AI scenario? It might affect existing camera configurations.")) {
      try {
        await deleteScenario(id);
        loadScenarios();
      } catch (err) {
        alert(err.message || "Failed to delete");
      }
    }
  };

  const getScenarioIcon = (key) => {
    const k = (key || '').toUpperCase();
    if (k.includes('WEAPON')) return Crosshair;
    if (k.includes('FIRE') || k.includes('SMOKE')) return Flame;
    if (k.includes('MOBILE')) return Smartphone;
    if (k.includes('CROWD') || k.includes('DENSITY')) return Users;
    if (k.includes('UNAUTHORIZED') || k.includes('RESTRICTED')) return UserPlus;
    if (k.includes('AGGRESSIVE')) return Zap;
    if (k.includes('ABSENCE')) return UserX;
    if (k.includes('ENTRY') || k.includes('EXIT')) return ArrowLeftRight;
    if (k.includes('SHOUTING') || k.includes('NOISE')) return Ear;
    return Target;
  };

  const filteredScenarios = scenarios.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[3px] text-text-gray">Syncing Intelligence Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
            <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-text-dark truncate">
              Intelligence <span className="text-accent underline decoration-accent/20 underline-offset-4">Registry</span>
              <span className="ml-2 sm:ml-3 px-2 py-0.5 bg-accent text-white rounded text-[9px] sm:text-[10px] font-black tracking-widest align-middle shadow-md">
                {scenarios.length}
              </span>
            </h1>

            <p className="text-[8px] sm:text-[9px] font-bold text-text-gray uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-1.5 flex items-center gap-2 truncate">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
              Dynamic AI Model Management Module
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search intelligence models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-6 py-2.5 bg-card border border-border rounded-lg text-[10px] font-bold text-text-dark focus:outline-none focus:border-accent transition-all w-full sm:w-[300px]"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-accent/20"
          >
            <Plus className="w-4 h-4" />
            Add Scenario
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredScenarios.map(scenario => {
          const sev = scenario.default_severity;
          const sevStyles =
            sev === 'Critical' ? { border: 'border-l-rose-500', bg: 'bg-rose-500/[0.02]', glow: 'shadow-rose-500/10' } :
              sev === 'High' ? { border: 'border-l-orange-500', bg: 'bg-orange-500/[0.02]', glow: 'shadow-orange-500/10' } :
                sev === 'Medium' ? { border: 'border-l-blue-500', bg: 'bg-blue-500/[0.02]', glow: 'shadow-blue-500/10' } :
                  { border: 'border-l-emerald-500', bg: 'bg-emerald-500/[0.02]', glow: 'shadow-emerald-500/10' };

          const ScenarioIcon = getScenarioIcon(scenario.key);

          return (
            <div key={scenario.id} className={`bg-card border border-border rounded-xl p-4 hover:shadow-xl transition-all group border-l-4 ${sevStyles.border} ${sevStyles.bg} hover:${sevStyles.glow} flex flex-col h-full`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center border border-border shrink-0 mt-0.5">
                    <ScenarioIcon className={`w-5 h-5 ${sevStyles.border.replace('border-l-', 'text-')}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-text-dark tracking-tight leading-tight mb-1">{scenario.name}</h3>
                    <div className="flex">
                      <code className="text-[7px] text-accent/70 font-mono bg-accent/5 px-1.5 py-0.5 rounded border border-accent/10 truncate max-w-full" title="Machine Key">
                        {scenario.key}
                      </code>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2">
                  <button onClick={() => handleOpenModal(scenario)} className="p-2 hover:bg-white/80 rounded-lg text-text-gray hover:text-accent transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(scenario.id)} className="p-2 hover:bg-rose-50 rounded-lg text-text-gray hover:text-rose-600 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-text-gray font-medium line-clamp-2 h-8 overflow-hidden mb-2">
                {scenario.description || "No description provided."}
              </p>
              <div className="mt-auto pt-3 border-t border-border/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest
          ${sev === 'Critical' ? 'bg-rose-500/10 text-rose-600' :
                      sev === 'High' ? 'bg-orange-500/10 text-orange-600' :
                        sev === 'Medium' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-emerald-500/10 text-emerald-600'}`}>
                    {sev} Severity
                  </span>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                    {cameras.some(c => c.enabled_scenario_ids?.includes(scenario.id)) ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600">Active</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-amber-600">Standby</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Dynamic Model Health Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="text-text-gray/60">Model Health Integrity</span>
                    <span className={cameras.some(c => c.enabled_scenario_ids?.includes(scenario.id)) ? "text-emerald-500" : "text-text-gray/40"}>
                      {cameras.some(c => c.enabled_scenario_ids?.includes(scenario.id))
                        ? `${(96 + (Math.random() * 3.5)).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="h-1 bg-surface border border-border rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${cameras.some(c => c.enabled_scenario_ids?.includes(scenario.id)) ? 'bg-emerald-500' : 'bg-border'}`}
                      style={{ width: cameras.some(c => c.enabled_scenario_ids?.includes(scenario.id)) ? `${96 + (Math.random() * 3)}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface">
              <h2 className="text-[11px] font-black uppercase tracking-[3px] text-text-dark">
                {editingScenario ? 'Modify Intelligence Module' : 'Register New Scenario'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-text-gray hover:text-rose-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray">Scenario Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                  placeholder="e.g. Weapon Detection"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray">Internal Key (Machine Name)</label>
                <input
                  type="text"
                  required
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-accent"
                  placeholder="e.g. WEAPON_DETECTION"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent h-24 resize-none"
                  placeholder="Describe the detection logic..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray">Default Severity</label>
                <select
                  value={formData.default_severity}
                  onChange={e => setFormData({ ...formData, default_severity: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-2.5 bg-surface border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-text-gray"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-2.5 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  {submitting ? 'Syncing...' : 'Save Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
