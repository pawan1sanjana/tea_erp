import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Search, MapPin, ClipboardList, 
  Database, Save, AlertCircle, CheckCircle2, 
  ChevronRight, User, Loader2, LogOut, 
  Clock, ArrowLeft, ShieldCheck, Zap
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export default function AttendanceTerminal() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [activeAttendance, setActiveAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Contextual initialization based on route
  const initialMode = window.location.pathname.includes('off-time') ? 'check-out' : 'check-in';
  const [mode, setMode] = useState(initialMode); 
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: '' }

  useEffect(() => {
    // Acquire GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location error", err)
      );
    }

    const fetchData = async () => {
      try {
        const [wRes, aRes] = await Promise.all([
          apiClient.get('/workforce/workers'),
          apiClient.get('/workforce/attendance-today').catch(() => ({ success: false, data: [] }))
        ]);
        
        if (wRes.success) setWorkers(wRes.data);
        if (aRes.success) setActiveAttendance(aRes.data);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedWorker || isSubmitting) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await apiClient.post('/workforce/attendance', {
        worker_id: selectedWorker.worker_id,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        auth_method: 'manual',
        action: mode
      });

      if (response.success) {
        setStatus({ 
          type: 'success', 
          message: mode === 'check-in' 
            ? `Deployment Logged: ${selectedWorker.first_name} is now on duty.` 
            : `Egress Logged: ${selectedWorker.first_name} has completed shift.` 
        });

        // Sync local attendance state
        if (mode === 'check-in') {
          setActiveAttendance(prev => [...prev, { 
            worker_id: selectedWorker.worker_id, 
            check_in_time: new Date().toLocaleTimeString([], { hour12: false }) 
          }]);
        } else {
          setActiveAttendance(prev => prev.map(a => 
            a.worker_id === selectedWorker.worker_id 
            ? { ...a, check_out_time: new Date().toLocaleTimeString([], { hour12: false }) } 
            : a
          ));
        }
        
        // Reset after bit
        setTimeout(() => {
          setSelectedWorker(null);
          setStatus(null);
          setSearchTerm('');
        }, 2000);
      } else {
        throw new Error(response.error || "Muster sync failed");
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter(w => {
    const term = searchTerm.toLowerCase();
    return (
      w.first_name.toLowerCase().includes(term) ||
      w.last_name.toLowerCase().includes(term) ||
      (w.worker_id && w.worker_id.toLowerCase().includes(term))
    );
  }).slice(0, 10);

  const getWorkerAttendance = (workerId) => {
    return activeAttendance.find(a => String(a.worker_id) === String(workerId));
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-tea-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Personnel Grid...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Premium Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Manual Override Terminal</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ShieldCheck size={14} className="text-tea-500" /> Administrative Override & Personnel Logistics Hub — {workers.length} registered
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Mode Switcher */}
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full lg:w-auto">
             <button 
               onClick={() => setMode('check-in')}
               className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'check-in' ? 'bg-tea-600 text-white shadow-xl shadow-tea-600/20' : 'text-slate-500 hover:text-tea-600'}`}
             >
                <Zap size={14} /> Check-In
             </button>
             <button 
               onClick={() => setMode('check-out')}
               className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'check-out' ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20' : 'text-slate-500 hover:text-rose-600'}`}
             >
                <LogOut size={14} /> Off-Time
             </button>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-tea-500/30">
            <div className="relative">
              <MapPin size={18} className={location ? "text-tea-500" : "text-slate-400 animate-pulse"} />
              {location && <div className="absolute -top-1 -right-1 w-2 h-2 bg-tea-500 rounded-full animate-ping" />}
            </div>
            <div className="text-left">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">TERMINAL LOCK</p>
              <p className="text-[10px] font-black text-slate-900 dark:text-white mt-1 tracking-tight font-mono">
                {location ? `${location.lat.toFixed(4)} / ${location.lng.toFixed(4)}` : "RESOLVING..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Selection Sidebar */}
        <div className="md:col-span-5 space-y-6">
           <div className="premium-card space-y-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="SEARCH PERSONNEL REGISTRY..." 
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-tea-500 transition-all text-xs font-black tracking-widest dark:text-white uppercase"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {searchTerm && filteredWorkers.map(worker => {
                    const att = getWorkerAttendance(worker.worker_id);
                    const isCheckInMode = mode === 'check-in';
                    const alreadyCheckedIn = !!att?.check_in_time;
                    const alreadyCheckedOut = !!att?.check_out_time;

                    return (
                      <button 
                        key={worker.id}
                        onClick={() => setSelectedWorker(worker)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                          selectedWorker?.id === worker.id 
                            ? isCheckInMode ? 'bg-tea-500/10 border-tea-500 text-tea-700 dark:text-tea-400' : 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400'
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                               {worker.photo ? <img src={worker.photo} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
                            </div>
                            <div>
                               <p className={`text-xs font-black uppercase tracking-tight ${selectedWorker?.id === worker.id ? '' : 'dark:text-white'}`}>{worker.first_name} {worker.last_name}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[9px] font-bold text-slate-500 uppercase">{worker.worker_id}</span>
                                 {att && (
                                   <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest ${alreadyCheckedOut ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                     {alreadyCheckedOut ? "SHIFT ENDED" : "ON DUTY"}
                                   </span>
                                 )}
                               </div>
                            </div>
                         </div>
                         <ChevronRight size={14} className="opacity-30 group-hover:translate-x-1 transition-transform" />
                      </button>
                    );
                 })}
                 {!searchTerm && (
                   <div className="py-20 text-center space-y-3 opacity-50">
                      <Search className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Search personnel to begin override</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Confirmation & Action */}
        <div className="md:col-span-7">
           <div className="premium-card space-y-8 py-12 text-center relative overflow-hidden">
              {/* Glass background effect */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-tea-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

              {selectedWorker ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-300 z-10 relative">
                   <div className="flex flex-col items-center gap-6">
                      <div className={`w-32 h-32 rounded-[2.5rem] bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative transform transition-all duration-500 ${mode === 'check-in' ? 'border-tea-500' : 'border-rose-500'}`}>
                         {selectedWorker.photo ? <img src={selectedWorker.photo} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-300" />}
                         <div className={`absolute bottom-0 inset-x-0 py-1.5 ${mode === 'check-in' ? 'bg-tea-500' : 'bg-rose-500'}`}>
                            <p className="text-[9px] font-black text-white uppercase tracking-tighter leading-none italic">
                              {mode === 'check-in' ? 'IDENTITY LOCKED' : 'EXTRACTION TARGET'}
                            </p>
                         </div>
                      </div>

                      <div className="space-y-1">
                         <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${mode === 'check-in' ? 'text-tea-600 dark:text-tea-400' : 'text-rose-600 dark:text-rose-400'}`}>
                           {mode === 'check-in' ? 'LOGISTICS DEPLOYMENT' : 'SHIFT TERMINATION'}
                         </p>
                         <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter italic leading-tight">{selectedWorker.first_name} {selectedWorker.last_name}</h3>
                         
                         <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black border border-slate-200 dark:border-slate-700 uppercase tracking-widest flex items-center gap-2">
                               <ShieldCheck size={14} /> ID: {selectedWorker.worker_id}
                            </span>
                            {getWorkerAttendance(selectedWorker.worker_id) && (
                               <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest flex items-center gap-2">
                                  <Clock size={14} /> IN: {getWorkerAttendance(selectedWorker.worker_id).check_in_time}
                               </span>
                            )}
                         </div>
                      </div>
                   </div>

                   <div className="h-px bg-slate-100 dark:bg-slate-800 w-1/3 mx-auto" />

                   <div className="space-y-4 max-w-sm mx-auto">
                      {status && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
                          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                          <span className="text-[10px] font-black uppercase text-left leading-tight">{status.message}</span>
                        </div>
                      )}

                      {/* Dynamic Action Button */}
                      {mode === 'check-in' ? (
                        <button 
                          onClick={handleSubmit}
                          disabled={isSubmitting || !!getWorkerAttendance(selectedWorker.worker_id)?.check_in_time}
                          className={`w-full py-5 bg-tea-600 hover:bg-tea-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 shadow-2xl shadow-tea-600/30 ${isSubmitting || !!getWorkerAttendance(selectedWorker.worker_id)?.check_in_time ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
                          {getWorkerAttendance(selectedWorker.worker_id)?.check_in_time ? "ALREADY PRESENT" : "CONFIRM DEPLOYMENT"}
                        </button>
                      ) : (
                        <button 
                          onClick={handleSubmit}
                          disabled={isSubmitting || !getWorkerAttendance(selectedWorker.worker_id)?.check_in_time || !!getWorkerAttendance(selectedWorker.worker_id)?.check_out_time}
                          className={`w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 shadow-2xl shadow-rose-600/30 ${isSubmitting || !getWorkerAttendance(selectedWorker.worker_id)?.check_in_time || !!getWorkerAttendance(selectedWorker.worker_id)?.check_out_time ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
                          {!getWorkerAttendance(selectedWorker.worker_id)?.check_in_time 
                            ? "SHIFT NOT ACTIVE" 
                            : getWorkerAttendance(selectedWorker.worker_id)?.check_out_time 
                              ? "ALREADY EXTRACTED" 
                              : "CONFIRM OFF-TIME"}
                        </button>
                      )}
                      
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                        Override requires high-fidelity supervisor clearance
                      </p>
                   </div>
                </div>
              ) : (
                <div className="py-20 space-y-6 opacity-30 animate-in fade-in duration-1000">
                   <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2rem] mx-auto flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <ClipboardList size={48} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Muster Waiting</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Select a record from the registry to begin manual logging</p>
                   </div>
                </div>
              )}
           </div>

           <div className="mt-8 flex items-center gap-4 px-8 py-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/50">
              <div className={`p-4 rounded-2xl transition-colors duration-500 ${mode === 'check-in' ? 'bg-tea-500/10 text-tea-500' : 'bg-rose-500/10 text-rose-500'}`}>
                 <Database size={24} />
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">TERMINAL SYNC STATUS: READY</h4>
                 <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider leading-relaxed">
                   Manual entries bypass biometric/QR verification but are logged with persistent geospatial audit trails and supervisor metadata.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
