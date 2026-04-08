import React, { useEffect, useState, useRef } from 'react';

const SECTORS = ["ICU-Zone-A", "Reception", "Emergency-B", "Ward-A", "Lab-1", "Perimeter", "Hallway-B", "Research-Lab"];
const ACTIONS = [
  "Movement Detected",
  "Cleaning Verified",
  "Mask Check: Pass",
  "Sanitary Log Update",
  "Person Identified",
  "Vehicle Spotted",
  "Object Removed",
  "Area Secured"
];

function getActionColor(action) {
  if (action.includes('Detected') || action.includes('Spotted')) return 'text-warning';
  if (action.includes('Pass') || action.includes('Verified')) return 'text-success';
  if (action.includes('Alert') || action.includes('Warning') || action.includes('Removed')) return 'text-danger';
  return 'text-accent';
}

export default function NeuralStream() {
  const [logs, setLogs] = useState([]);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const newLog = {
        id: Date.now() + Math.random(),
        time,
        sector,
        action,
        colorClass: getActionColor(action)
      };

      setLogs(prev => {
        const next = [newLog, ...prev];
        if (next.length > 15) next.pop();
        return next;
      });
      
      setEventCount(c => c + 1);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card rounded-3xl p-6 border border-border shadow-premium h-[400px] flex flex-col w-full">
      <div className="flex justify-between items-center mb-5 shrink-0">
        <div>
          <h3 className="text-[1.1rem] font-bold text-text-dark m-0">Neural Detection Stream</h3>
          <div className="text-[0.75rem] text-text-gray font-medium mt-0.5">
            Real-time AI inference events
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="bg-accent-soft text-accent px-3 py-1 rounded-xl text-[0.7rem] font-extrabold flex items-center gap-1.5 border border-accent-soft relative ml-2">
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-success rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
            STREAM ACTIVE
          </span>
          <div className="text-[0.8rem] font-extrabold text-accent ml-1">{eventCount}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col gap-3 font-mono pr-2">
        {logs.map(log => (
          <div 
            key={log.id} 
            className="flex justify-between items-center px-4 py-3 rounded-xl bg-bg text-[0.82rem] border-l-4 border-accent animate-[slideIn_0.3s_ease]"
            style={{ animation: 'slideDown 0.3s ease-out forwards' }}
          >
            <style>{`
              @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div>
              <span className="text-text-gray text-[0.75rem] mr-3">[{log.time}]</span>
              <strong className="text-accent">{log.sector}</strong>
            </div>
            <span className={`font-semibold ${log.colorClass}`}>
              {log.action}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center text-text-gray py-10 opacity-60 text-sm">Waiting for neural events...</div>
        )}
      </div>
    </div>
  );
}
