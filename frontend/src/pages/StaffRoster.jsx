import React from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  UserPlus, 
  Search,
  CheckCircle,
  XCircle,
  MoreVertical,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Line, 
  ComposedChart,
  Cell
} from 'recharts';

const SHIFT_STATS = [
  { label: 'Morning Shift', count: 15, total: 15, color: 'text-accent', bg: 'bg-accent/10', icon: Clock },
  { label: 'Afternoon Shift', count: 22, total: 20, color: 'text-accent', bg: 'bg-accent/10', icon: Clock },
  { label: 'Night Shift', count: 12, total: 18, color: 'text-warning', bg: 'bg-warning/10', icon: Clock },
  { label: 'On-Call', count: 8, total: 8, color: 'text-success', bg: 'bg-success/10', icon: Briefcase },
];

const CHART_DATA = [
  { name: 'Morning', active: 15, required: 15 },
  { name: 'Afternoon', active: 22, required: 20 },
  { name: 'Night', active: 12, required: 18 },
  { name: 'On-Call', active: 8, required: 8 },
];

const STAFF_MEMBERS = [
  { id: 'STF-001', name: 'Ali Raza', role: 'Head Supervisor', shift: 'Morning', status: 'on-duty', avatar: 'AR' },
  { id: 'STF-002', name: 'Mehak Fatima', role: 'Security Lead', shift: 'Afternoon', status: 'on-duty', avatar: 'MF' },
  { id: 'STF-003', name: 'Zeeshan Ahmed', role: 'Floor monitor', shift: 'Night', status: 'on-break', avatar: 'ZA' },
  { id: 'STF-004', name: 'Hina Kousar', role: 'Access Control', shift: 'Morning', status: 'on-duty', avatar: 'HK' },
  { id: 'STF-005', name: 'Omer Farooq', role: 'Technician', shift: 'On-Call', status: 'off-duty', avatar: 'OF' },
  { id: 'STF-006', name: 'Mariam Nawaz', role: 'Front Desk', shift: 'Morning', status: 'on-duty', avatar: 'MN' },
];

export default function StaffRoster() {
  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-[1.8rem] font-black text-text-dark mb-1 tracking-tight uppercase">Staff Roster</h2>
          <div className="text-[0.9rem] text-text-gray font-semibold flex items-center gap-2">
            Real-time Personnel Management
            <span className="w-1 h-1 bg-text-gray rounded-full opacity-30" />
            57 Active Staff
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[0.75rem] font-bold cursor-pointer transition-all hover:opacity-90 shadow-[0_4px_12px_rgba(14,165,233,0.3)]">
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-card text-text-dark border border-border rounded-xl text-[0.75rem] font-bold cursor-pointer hover:border-accent hover:text-accent shadow-sm">
            <Calendar className="w-4 h-4" />
            Manage Schedule
          </button>
        </div>
      </div>

      {/* Shift Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SHIFT_STATS.map((stat, i) => (
          <div key={i} className="bg-card rounded-[22px] p-6 border border-border shadow-premium flex items-center justify-between group hover:-translate-y-1 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[0.7rem] font-bold text-text-gray uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[1.8rem] font-black text-text-dark">{stat.count}</span>
                <span className="text-[0.8rem] font-bold text-text-gray">/ {stat.total}</span>
              </div>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <div className={`h-1.5 w-8 rounded-full ${stat.color.replace('text', 'bg')} opacity-40 rotate-90`} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Summary Row */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-[24px] p-6 md:p-8 border border-border shadow-premium flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Shift Capacity vs Requirements</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-[0.7rem] font-bold text-text-gray uppercase">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-dashed border-danger rounded-full" />
                <span className="text-[0.7rem] font-bold text-text-gray uppercase">Required</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[320px] relative min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <ComposedChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--color-text-gray)', fontSize: 13, fontWeight: 600}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--color-text-gray)', fontSize: 13, fontWeight: 600}} 
                />
                <Tooltip 
                  cursor={{fill: 'var(--color-accent-soft)', opacity: 0.4}}
                  contentStyle={{ borderRadius: '14px', border: '1px solid var(--color-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                />
                <Bar 
                  dataKey="active" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                >
                  {CHART_DATA.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.active >= entry.required ? 'var(--color-accent)' : 'var(--color-warning)'} 
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="required" 
                  stroke="var(--color-danger)" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 6, fill: 'var(--color-danger)', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-card rounded-[24px] p-8 border border-border shadow-premium flex flex-col">
          <h3 className="text-[1.1rem] font-bold text-text-dark mb-6">Duty Summary</h3>
          <div className="space-y-6 flex-1">
            <div className="flex justify-between items-center p-4 bg-bg rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-[0.85rem] font-bold text-text-gray">On Duty</span>
              </div>
              <span className="text-[1.2rem] font-black text-text-dark">42</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-bg rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[0.85rem] font-bold text-text-gray">On Break</span>
              </div>
              <span className="text-[1.2rem] font-black text-text-dark">6</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-bg rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                  <XCircle className="w-5 h-5" />
                </div>
                <span className="text-[0.85rem] font-bold text-text-gray">Off Duty</span>
              </div>
              <span className="text-[1.2rem] font-black text-text-dark">9</span>
            </div>
          </div>
          <button className="mt-8 w-full py-4 bg-bg border border-border rounded-xl text-[0.85rem] font-bold text-text-dark hover:border-accent hover:text-accent transition-all">
            Export Roster Report
          </button>
        </div>
      </div>

      {/* Staff Grid Section */}
      <div className="bg-card rounded-[24px] border border-border shadow-premium overflow-hidden">
        <div className="p-8 border-b border-border flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Staff Member Directory</h3>
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-gray" />
              <input 
                type="text" 
                placeholder="Search staff by name or role..." 
                className="w-full pl-11 pr-4 py-2.5 bg-bg border border-border rounded-xl text-[0.85rem] focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
          {STAFF_MEMBERS.map((member) => (
            <div key={member.id} className="p-5 rounded-2xl bg-bg border border-border group hover:border-accent hover:shadow-premium transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-black text-[1.1rem] shadow-md">
                    {member.avatar}
                  </div>
                  <div>
                    <h4 className="text-[0.95rem] font-bold text-text-dark mb-0.5">{member.name}</h4>
                    <p className="text-[0.7rem] font-bold text-text-gray uppercase tracking-wider">{member.id}</p>
                  </div>
                </div>
                <button className="text-text-gray hover:text-text-dark transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-card p-3 rounded-xl border border-border">
                  <p className="text-[0.6rem] text-text-gray font-bold uppercase mb-1">Role</p>
                  <p className="text-[0.8rem] text-text-dark font-bold">{member.role}</p>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border">
                  <p className="text-[0.6rem] text-text-gray font-bold uppercase mb-1">Current Shift</p>
                  <p className="text-[0.8rem] text-text-dark font-bold">{member.shift}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className={`px-3 py-1 rounded-full text-[0.7rem] font-extrabold flex items-center gap-1.5 
                  ${member.status === 'on-duty' ? 'bg-success/10 text-success' : 
                    member.status === 'on-break' ? 'bg-accent-soft text-accent' : 
                    'bg-text-gray/10 text-text-gray'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'on-duty' ? 'bg-success animate-pulse' : 
                    member.status === 'on-break' ? 'bg-accent' : 
                    'bg-text-gray'}`} />
                  {member.status.toUpperCase().replace('-', ' ')}
                </div>
                <button className="text-[0.75rem] font-bold text-accent hover:underline decoration-2 underline-offset-4 transition-all">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
