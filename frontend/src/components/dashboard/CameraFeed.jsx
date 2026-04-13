import React, { useState, useEffect } from 'react';
import { Camera, CameraOff, Loader2, RefreshCw } from 'lucide-react';

export default function CameraFeed({ streamUrl = 'http://localhost:8000/video_feed' }) {
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-gray bg-card/40 backdrop-blur-sm gap-4">
          {status === 'connecting' ? (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <div className="text-sm font-bold uppercase tracking-widest">Initializing AI Stream...</div>
            </>
          ) : (
            <>
              <CameraOff className="w-12 h-12 text-danger opacity-50" />
              <div className="text-center px-6">
                <div className="text-sm font-bold text-text-dark mb-1 underline decoration-danger/30">Backend Offline</div>
                <div className="text-[0.7rem] font-semibold opacity-70">Please start the Python backend (main.py)</div>
              </div>
              <button 
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </>
          )}
        </div>
      )}

      {/* Overlay UI */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg">
        <div className={`w-2 h-2 rounded-full ${status === 'streaming' ? 'bg-success animate-pulse' : 'bg-danger'}`} />
        <span className="text-[0.65rem] font-black uppercase tracking-widest text-text-dark">
          {status === 'streaming' ? 'Neural Network Active' : 'Offline'}
        </span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-2 bg-card/80 backdrop-blur-md border border-border rounded-xl shadow-lg">
          <Camera className="w-4 h-4 text-accent" />
        </div>
      </div>
    </div>
  );
}
