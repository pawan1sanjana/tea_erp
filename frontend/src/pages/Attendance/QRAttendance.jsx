import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, MapPin, ShieldCheck, AlertTriangle, RefreshCcw, Loader2, CheckCircle } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function QRAttendance() {
  const [scanResult, setScanResult] = useState(null);
  const [lastWorker, setLastWorker] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | verifying | success | error
  const [mode, setMode] = useState('check-in'); // 'check-in' | 'check-out'
  const modeRef = useRef('check-in');
  const isProcessingRef = useRef(false);
  
  // Keep ref in sync for scanner closure
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const [errorMsg, setErrorMsg] = useState('');
  const [location, setLocation] = useState(null);
  const locationRef = useRef(null);
  const qrRef = useRef(null);
  const scannerRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Initialize Audio Context on user interaction (if needed) or first mount
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playBeep = (freq, duration, type = 'sine') => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio feedback failed", e);
    }
  };

  const playSuccessSound = () => playBeep(880, 0.15, 'square'); // High crisp beep
  const playErrorSound = () => playBeep(220, 0.4, 'sawtooth'); // Low buzz

  const getPreciseLocation = () => {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) return resolve(locationRef.current);
      
      const timeout = setTimeout(() => resolve(locationRef.current), 3000); // Allow 3s, use last known if too slow

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout);
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          locationRef.current = newLoc;
          setLocation(newLoc);
          resolve(newLoc);
        },
        (err) => {
          clearTimeout(timeout);
          console.warn("GPS lock failed", err);
          resolve(locationRef.current); // Use last known on failure
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  useEffect(() => {
    // Initial coarse location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
           const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
           locationRef.current = loc;
           setLocation(loc);
        },
        (err) => console.warn("Location access denied", err)
      );
    }

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20, // Increased for tactical feel
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minSide = Math.min(viewfinderWidth, viewfinderHeight);
                const size = Math.floor(minSide * 0.7);
                return { width: size, height: size };
            },
            aspectRatio: 1.0
          },
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.error("Scanner init failed", err);
        setErrorMsg("Camera access failed. Check permissions.");
        setStatus('error');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        // Only stop if the scanner was actually started and is in a state that can be stopped
        const scanner = scannerRef.current;
        if (scanner.getState() !== 1) { // 1 is Html5QrcodeScannerState.NOT_STARTED
          scanner.stop()
            .catch(e => console.warn("Scanner stop suppressed", e))
            .finally(() => {
              scanner.clear();
            });
        }
      }
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setScanResult(decodedText);
    setStatus('verifying');
    
    try {
      // Get fresh GPS lock for every scan
      const freshLoc = await getPreciseLocation();
      
      // Worker ID is expected in decodedText (e.g. "WKR-12345")
      const response = await apiClient.post('/workforce/attendance', {
        worker_id: decodedText,
        latitude: freshLoc?.lat || null,
        longitude: freshLoc?.lng || null,
        auth_method: 'qr',
        action: modeRef.current
      });

      if (response.success) {
        playSuccessSound();
        const workerInfo = response.worker || { name: decodedText, worker_id: decodedText };
        setLastWorker(workerInfo);
        
        // Add to history
        setRecentScans(prev => [{
          ...workerInfo,
          time: new Date().toLocaleTimeString(),
          id: Date.now(),
          coords: freshLoc
        }, ...prev].slice(0, 5));

        setStatus('success');
        // Auto reset after 2.5 seconds
        setTimeout(() => resetScanner(), 2500);
      } else {
        throw new Error(response.error || "Verification failed");
      }
    } catch (err) {
      playErrorSound();
      setErrorMsg(err.message);
      setStatus('error');
      
      // Auto reset on error as well so they can try again
      setTimeout(() => resetScanner(), 3000);
    }
  };

  const onScanFailure = (err) => {
    // Silence errors to keep console clean
  };

  const resetScanner = () => {
    setScanResult(null);
    setErrorMsg('');
    setStatus('scanning');
    
    // Unlock the scanner for the next read
    isProcessingRef.current = false;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Tactical QR Scanner</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <QrCode size={20} className="text-tea-500" /> Identity Verification Loop — Sensor Active
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Mode Switcher */}
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <button 
               onClick={() => setMode('check-in')}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'check-in' ? 'bg-tea-600 text-white shadow-lg shadow-tea-600/20' : 'text-slate-500 hover:text-tea-600'}`}
             >
                Check-In
             </button>
             <button 
               onClick={() => setMode('check-out')}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'check-out' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:text-rose-600'}`}
             >
                Off-Time
             </button>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-tea-500/30">
            <div className="relative">
              <MapPin size={16} className={location ? "text-tea-500" : "text-slate-400 animate-pulse"} />
              {location && <div className="absolute -top-1 -right-1 w-2 h-2 bg-tea-500 rounded-full animate-ping" />}
            </div>
            <div className="text-left">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">GPS LOCK</p>
              <p className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5 tracking-tight font-mono">
                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "RESOLVING..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card p-0 overflow-hidden relative border-none shadow-2xl">
        {/* Futuristic HUD Overlays */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tea-500 to-transparent z-10 animate-pulse"></div>
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-tea-500 to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-tea-500 to-transparent z-10"></div>
        
        <div className="relative aspect-square md:aspect-video bg-black overflow-hidden flex items-center justify-center">
          <div id="qr-reader" className="w-full h-full object-cover"></div>
          
          {/* HUD Brackets */}
          <div className="absolute inset-0 pointer-events-none p-12 flex items-center justify-center">
             <div className="w-[250px] h-[250px] border-2 border-tea-500/30 rounded-3xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-tea-500 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-tea-500 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-tea-500 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-tea-500 rounded-br-lg"></div>
                
                {/* Rolling Scanline */}
                <div className="absolute inset-x-0 h-0.5 bg-tea-500/50 shadow-[0_0_15px_rgba(20,184,166,0.8)] animate-[scan_2s_linear_infinite] top-0"></div>
             </div>
          </div>

          {/* Status Overlays */}
          {status === 'verifying' && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
              <Loader2 className="animate-spin text-tea-500" size={48} />
              <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Syncing Neural Identity...</p>
            </div>
          )}

          {status === 'success' && lastWorker && (
            <div className={`absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-20 animate-in zoom-in-95 duration-300 ${mode === 'check-out' ? 'bg-rose-600/90' : 'bg-tea-600/90'}`}>
              <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-2xl relative">
                 <img src={lastWorker.photo || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop"} className="w-full h-full object-cover rounded-2xl" />
                 <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white ${mode === 'check-out' ? 'bg-rose-500' : 'bg-tea-500'}`}>
                    <CheckCircle size={16} />
                 </div>
              </div>
              <div className="text-center">
                <p className="text-white font-black text-2xl uppercase tracking-tighter leading-none">{lastWorker.name}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                    {mode === 'check-out' ? 'EXTRACTED' : 'DEPLOYED'}
                  </span>
                  <span className="text-white/60 text-[10px] font-bold">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 bg-rose-600/95 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="text-white" size={32} />
              </div>
              <div className="text-center px-6">
                <p className="text-white font-black text-xl uppercase tracking-tighter italic">Link Rejected</p>
                <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">
                  {errorMsg.toLowerCase().includes('already') ? 'Duplicate Activity Detected' : 'Identity Verification Failed'}
                </p>
                <div className="mt-4 bg-black/20 px-4 py-2 rounded-xl border border-white/10">
                   <p className="text-white text-xs font-bold">{errorMsg}</p>
                </div>
              </div>
              <button 
                onClick={resetScanner}
                className="mt-4 px-8 py-3 bg-white text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
              >
                Reset Scanner
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-slate-50 dark:bg-slate-900 p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                 <MapPin size={18} />
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">GPS LOCK STATUS</p>
                 <p className="text-xs font-bold dark:text-white mt-1 uppercase tracking-tighter">
                   {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "ACQUIRING..."}
                 </p>
              </div>
           </div>

           <div className="flex gap-2">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 dark:border-slate-700">
                Method: QR INTEGRITY
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <RefreshCcw size={16} className="text-slate-400" />
              </button>
           </div>
        </div>
      </div>

      {/* Recent Scans History */}
      <div className="premium-card p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
          <RefreshCcw size={14} className="animate-spin-slow" /> Recent Scanning Activity
        </h3>
        <div className="space-y-3">
          {recentScans.length === 0 ? (
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest text-center py-4 opacity-50">
              Waiting for initial tactical link...
            </p>
          ) : recentScans.map(scan => (
            <div key={scan.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 animate-in slide-in-from-left duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-[10px]">
                  {scan.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{scan.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{scan.worker_id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">VERIFIED</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{scan.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .bounce-in {
          animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes bounceIn {
          from { opacity: 0; transform: scale(0.3); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}
