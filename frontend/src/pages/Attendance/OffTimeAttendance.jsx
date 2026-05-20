import React, { useState, useEffect } from 'react';
import { UserCheck, Search, MapPin, ClipboardList, Database, Save, AlertCircle, CheckCircle2, ChevronRight, User, Loader2, LogOut, Clock, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export default function OffTimeAttendance() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [activeAttendance, setActiveAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const response = await apiClient.post('/workforce/attendance/checkout', {
        worker_id: selectedWorker.worker_id,
        latitude: location?.lat || null,
        longitude: location?.lng || null
      });

      if (response.success) {
        setStatus({ type: 'success', message: `Off-time Confirmed: ${selectedWorker.first_name} has left duty.` });
        // Update local state to show they checked out
        setActiveAttendance(prev => prev.map(a => 
          a.worker_id === selectedWorker.worker_id 
          ? { ...a, check_out_time: new Date().toLocaleTimeString([], { hour12: false }) } 
          : a
        ));
        
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
  }).slice(0, 5);

  const getWorkerAttendance = (workerId) => {
    return activeAttendance.find(a => String(a.worker_id) === String(workerId));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Post-Shift Logistics</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <LogOut size={14} className="text-rose-500" /> Off-Time Egress Terminal — {activeAttendance.length} personnel on duty
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800">
           <MapPin size={16} className={location ? "text-tea-500" : "text-slate-400 animate-pulse"} />
           <div className="text-left">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">GEOSPATIAL LOCK</p>
              <p className="text-[10px] font-bold dark:text-white mt-0.5 tracking-tighter">
                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "RESOLVING..."}
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Selection Sidebar */}
        <div className="md:col-span-6 space-y-6">
           <div className="premium-card space-y-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="SEARCH RECORDS FOR EXTRACTION..." 
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-tea-500 transition-all text-xs font-black tracking-widest dark:text-white"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              <div className="space-y-2">
                 {searchTerm && filteredWorkers.map(worker => {
                    const att = getWorkerAttendance(worker.worker_id);
                    return (
                      <button 
                        key={worker.id}
                        onClick={() => setSelectedWorker(worker)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          selectedWorker?.id === worker.id 
                            ? att?.check_out_time ? 'bg-slate-100 border-slate-300 opacity-50' : 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-rose-500/30'
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
                                   <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest ${att.check_out_time ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                     {att.check_out_time ? "COMPLETED" : "ON DUTY"}
                                   </span>
                                 )}
                               </div>
                            </div>
                         </div>
                         <ChevronRight size={14} className="opacity-30" />
                      </button>
                    );
                 })}
                 {!searchTerm && <div className="py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Search personnel records to mark egress</div>}
              </div>
           </div>
        </div>

        {/* Confirmation & Action */}
        <div className="md:col-span-6">
           <div className="premium-card space-y-8 py-10 text-center">
              {selectedWorker ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-rose-500 shadow-2xl relative">
                         {selectedWorker.photo ? <img src={selectedWorker.photo} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-300" />}
                         <div className="absolute bottom-0 inset-x-0 bg-rose-500 py-1">
                            <p className="text-[8px] font-black text-white uppercase tracking-tighter leading-none italic">TARGET IDENTIFIED</p>
                         </div>
                      </div>
                      <div>
                         <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.3em]">SHIFT TERMINATION</p>
                         <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic leading-tight mt-1">{selectedWorker.first_name} {selectedWorker.last_name}</h3>
                         
                         {getWorkerAttendance(selectedWorker.worker_id) ? (
                            <div className="flex flex-col items-center mt-3 gap-2">
                               <div className="inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black border border-emerald-500/20 uppercase tracking-widest items-center gap-2">
                                  <Clock size={12} /> Deployment Time: {getWorkerAttendance(selectedWorker.worker_id).check_in_time}
                               </div>
                               {getWorkerAttendance(selectedWorker.worker_id).check_out_time && (
                                  <div className="inline-flex px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[9px] font-black border border-slate-200 dark:border-slate-700 uppercase tracking-widest items-center gap-2">
                                    <CheckCircle2 size={12} /> Extraction Logged: {getWorkerAttendance(selectedWorker.worker_id).check_out_time}
                                  </div>
                               )}
                            </div>
                         ) : (
                           <div className="mt-4 px-4 py-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest max-w-xs mx-auto">
                              No Check-in record found for today. Shift must be active to log off-time.
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="h-px bg-slate-100 dark:bg-slate-800 w-1/2 mx-auto" />

                   <div className="space-y-4">
                      {status && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 max-w-xs mx-auto ${
                          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                          <span className="text-[10px] font-black uppercase text-left leading-tight">{status.message}</span>
                        </div>
                      )}

                      <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !getWorkerAttendance(selectedWorker.worker_id)}
                        className={`w-full max-w-xs mx-auto py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 shadow-2xl shadow-rose-600/30 ${isSubmitting || !getWorkerAttendance(selectedWorker.worker_id) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
                        {isSubmitting ? "FINALIZING..." : "CONFIRM OFF-TIME"}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="py-12 space-y-4 opacity-40">
                   <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center text-slate-400">
                      <Clock size={40} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select active personnel record<br/>to terminate shift cycle</p>
                </div>
              )}
           </div>

           <div className="mt-8 flex items-center gap-4 px-6 opacity-60">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                 <Clock size={24} />
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">SHIFT CYCLE AUDIT</h4>
                 <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider leading-relaxed">Off-time requests generate a permanent egress log. Timestamps cannot be modified once synchronized with the neural ledger.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
