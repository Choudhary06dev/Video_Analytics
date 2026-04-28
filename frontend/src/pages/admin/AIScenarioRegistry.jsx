import React, { useState, useEffect } from 'react';
import {
  fetchScenarios,
  createScenario,
  updateScenario,
  deleteScenario
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
  Zap
} from 'lucide-react';

export default function AIScenarioRegistry() {
  const [scenarios, setScenarios] = useState([]);
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
      const data = await fetchScenarios();
      setScenarios(data);
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

  const filteredScenarios = scenarios.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[3px] text-text-gray">Syncing Intelligence Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-600/10 rounded-lg flex items-center justify-center border border-violet-600/20">
            <Brain className="w-7 h-7 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-text-dark">
              Intelligence <span className="text-violet-600 underline decoration-violet-600/20 underline-offset-4">Registry</span>
              <span className="ml-3 px-2 py-0.5 bg-violet-600 text-white rounded text-[10px] font-black not-italic tracking-widest align-middle shadow-md">
                {scenarios.length}
              </span>
            </h1>

            <p className="text-[9px] font-bold text-text-gray uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Dynamic AI Model Management Module
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray group-focus-within:text-violet-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH MODELS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-6 py-2.5 bg-card border border-border rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-violet-500 transition-all w-full md:w-[300px]"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-200"
          >
            <Plus className="w-4 h-4" />
            Add Scenario
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredScenarios.map(scenario => (
          <div key={scenario.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-xl hover:shadow-violet-500/5 transition-all group border-l-4 border-l-violet-500 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center border border-border">
                  <Zap className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-dark uppercase tracking-tight">{scenario.name}</h3>
                  <code className="text-[9px] text-violet-600 font-bold bg-violet-50 px-1.5 py-0.5 rounded">{scenario.key}</code>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleOpenModal(scenario)} className="p-2 hover:bg-surface rounded-lg text-text-gray hover:text-violet-600 transition-all">
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
            <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">

              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest
                ${scenario.default_severity === 'Critical' ? 'bg-rose-500/10 text-rose-600' :
                  scenario.default_severity === 'High' ? 'bg-orange-500/10 text-orange-600' :
                    'bg-emerald-500/10 text-emerald-600'}`}>
                {scenario.default_severity} Severity
              </span>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-text-gray uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Validated
              </div>
            </div>
          </div>
        ))}
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
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
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
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-violet-500"
                  placeholder="e.g. WEAPON_DETECTION"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 h-24 resize-none"
                  placeholder="Describe the detection logic..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-gray">Default Severity</label>
                <select
                  value={formData.default_severity}
                  onChange={e => setFormData({ ...formData, default_severity: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
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
                  className="flex-1 px-6 py-2.5 bg-violet-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-200 disabled:opacity-50"
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
