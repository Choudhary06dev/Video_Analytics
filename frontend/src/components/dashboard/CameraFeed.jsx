import React, { useState, useEffect } from 'react';
import { Camera, CameraOff, Loader2, RefreshCw } from 'lucide-react';

export default function CameraFeed({ 
  streamUrl = 'http://localhost:8000/video_feed', 
  hideOverlay = false 
}) {
  const [status, setStatus] = useState('connecting'); // connecting, streaming, error
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // Basic health check to see if backend is reachable
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
          setStatus('streaming');
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };

    checkBackend();
  }, [errorCount]);

  const handleRetry = () => {
    setStatus('connecting');
    setErrorCount(prev => prev + 1);
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-border group">
      {status === 'streaming' ? (
        <img 
          src={`${streamUrl}?t=${errorCount}`} 
          alt="Live Camera Feed"
          className="w-full h-full object-cover"
          onError={() => setStatus('error')}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/60 backdrop-blur-sm gap-4">
          {status === 'connecting' ? (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <div className="text-[0.65rem] font-black uppercase tracking-widest text-slate-300">Initializing AI Stream...</div>
            </>
          ) : (
            <>
              <CameraOff className="w-10 h-10 text-rose-500/50" />
              <div className="text-center px-6">
                <div className="text-[0.65rem] font-black text-rose-400 mb-1 uppercase tracking-widest">Source Offline</div>
              </div>
              <button 
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[0.6rem] font-black hover:bg-blue-600/30 transition-all uppercase tracking-widest"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Connection
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
