import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Loader2, RefreshCw } from 'lucide-react';
import { VIDEO_FEED_URL, fetchHealth } from '../../api';

export default function CameraFeed({ 
  streamUrl = VIDEO_FEED_URL, 
  hideOverlay = false 
}) {
  const [status, setStatus] = useState('connecting'); // connecting, streaming, error
  const [errorCount, setErrorCount] = useState(0);
  const retryTimerRef = useRef(null);
  const imgRef = useRef(null);

  // Auto-retry logic: when error occurs, schedule a retry after a delay
  useEffect(() => {
    if (status === 'error') {
      // Auto-retry after 8 seconds (avoids hammering the server)
      retryTimerRef.current = setTimeout(() => {
        setStatus('connecting');
        setErrorCount(prev => prev + 1);
      }, 8000);
    }

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [status]);

  // Health check on mount and when errorCount changes
  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const res = await fetchHealth();
        if (isMounted) {
          setStatus(res ? 'streaming' : 'error');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    checkBackend();
    return () => {
      isMounted = false;
    };
  }, [errorCount]);

  const handleRetry = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }
    setStatus('connecting');
    setErrorCount(prev => prev + 1);
  };

  // Force-refresh the image src periodically to recover from stale streams
  const handleImgError = useCallback(() => {
    setStatus('error');
  }, []);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden border border-border group">
      {status === 'streaming' ? (
        <img 
          ref={imgRef}
          src={`${streamUrl}?t=${errorCount}`} 
          alt="Live Camera Feed"
          className="w-full h-full object-cover"
          onLoad={() => setStatus('streaming')}
          onError={handleImgError}
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
                <div className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">Auto-reconnecting...</div>
              </div>
              <button 
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[0.6rem] font-black hover:bg-blue-600/30 transition-all uppercase tracking-widest"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Now
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
