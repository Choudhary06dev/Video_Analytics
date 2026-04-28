import React, { useState, useEffect } from 'react';
import { LayoutGrid, ChevronRight, ChevronDown, MapPin, Building2, Layers, Box, Search } from 'lucide-react';
import { fetchAdminAreas } from '../../api';

/**
 * AreaSidebar — Hierarchical navigation for hospital areas.
 * Builds a tree from a flat list of areas with parent_id.
 */
export default function AreaSidebar({ onSelectArea }) {
  const [areas, setAreas] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminAreas();
      setAreas(data.areas || data || []);
    } catch (error) {
      console.error("Failed to load areas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert flat list to tree
  const buildTree = (list) => {
    const map = {};
    const roots = [];
    
    list.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });
    
    list.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });
    
    return roots;
  };

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    onSelectArea(id);
  };

  const renderItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded[item.id];
    const isSelected = selectedId === item.id;

    // Filter logic
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        // If it doesn't match, check if any child matches
        const childMatches = item.children.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!childMatches) return null;
    }

    return (
      <div key={item.id} className="select-none">
        <div 
          onClick={() => handleSelect(item.id)}
          className={`
            group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
            ${isSelected ? 'bg-accent/10 border border-accent/20' : 'hover:bg-white/5 border border-transparent'}
          `}
        >
          {hasChildren ? (
            <div 
              onClick={(e) => toggleExpand(item.id, e)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-text-gray" /> : <ChevronRight className="w-3.5 h-3.5 text-text-gray" />}
            </div>
          ) : (
            <div className="w-5.5 flex justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-text-gray/20" />
            </div>
          )}

          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-accent text-white shadow-[0_4px_12px_rgba(var(--accent-rgb),0.3)]' : 'bg-white/5 text-text-gray group-hover:text-text-dark'}`}>
            {item.parent_id === null ? <Building2 className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className={`text-[0.85rem] font-bold truncate ${isSelected ? 'text-accent' : 'text-text-dark group-hover:text-accent'}`}>
              {item.name}
            </div>
            {item.description && (
                <div className="text-[0.65rem] text-text-gray truncate opacity-60 font-semibold uppercase tracking-wider">
                    {item.description}
                </div>
            )}
          </div>
          
          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_#22c55e]" />}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-white/5 pl-2">
            {item.children.map(child => renderItem(child))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(areas);

  return (
    <div className="w-[280px] h-full flex flex-col bg-card/40 backdrop-blur-xl border-r border-border p-5 gap-6">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[1.1rem] font-black text-text-dark tracking-tight uppercase">Zone Matrix</h3>
          <p className="text-[0.6rem] font-black text-text-gray uppercase tracking-[0.1em] opacity-60">Facility Navigation</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray pointer-events-none" />
        <input 
          type="text" 
          placeholder="Filter areas..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-[0.85rem] font-bold text-text-dark placeholder:text-text-gray/40 focus:outline-none focus:border-accent/40 transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
        <div 
          onClick={() => handleSelect(null)}
          className={`
            flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all
            ${selectedId === null ? 'bg-accent/10 border border-accent/20 text-accent font-black' : 'hover:bg-white/5 border border-transparent text-text-dark font-bold'}
          `}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-[0.85rem] uppercase tracking-wider">Global Overview</span>
        </div>

        <div className="mt-4 flex flex-col gap-1">
            <p className="text-[0.65rem] font-black text-text-gray uppercase tracking-widest px-3 mb-2 opacity-50">Hierarchy</p>
            {loading ? (
                <div className="flex flex-col gap-3 px-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : (
                tree.map(root => renderItem(root))
            )}
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
            <Box className="w-3.5 h-3.5 text-accent" />
            <span className="text-[0.65rem] font-black text-text-dark uppercase tracking-wider">Intelligence Node</span>
        </div>
        <p className="text-[0.7rem] text-text-gray font-semibold leading-relaxed">
            Switching zones will automatically recalibrate the AI neural stream.
        </p>
      </div>
    </div>
  );
}
