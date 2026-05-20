import React, { useState, useEffect } from 'react';
import { UserCheck, Search, MapPin, ClipboardList, Database, Save, AlertCircle, CheckCircle2, ChevronRight, User, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function ManualAttendance() {
  const [workers, setWorkers] = useState([]);
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
        const response = await apiClient.get('/workforce/workers');
        if (response.success) setWorkers(response.data);
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
        auth_method: 'manual'
      });

      if (response.success) {
        setStatus({ type: 'success', message: `Identity Confirmed: ${selectedWorker.first_name} marked present.` });
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

  const filteredWorkers = workers.filter(w => 
    w.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.worker_id && w.worker_id.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Manual Muster Override</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ClipboardList size={14} className="text-tea-500" /> Direct Field Logistics Entry — {workers.length} active personnel
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Selection Sidebar */}
        <div className="md:col-span-6 space-y-6">
           <div className="premium-card space-y-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="SEARCH PERSONNEL BY NAME OR ID..." 
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-tea-500 transition-all text-xs font-bold dark:text-white"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              <div className="space-y-2">
                 {searchTerm && filteredWorkers.map(worker => (
                    <button 
                      key={worker.id}
                      onClick={() => setSelectedWorker(worker)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        selectedWorker?.id === worker.id 
                          ? 'bg-tea-500/10 border-tea-500 text-tea-700 dark:text-tea-400' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-tea-500/50 dark:text-white'
                      }`}
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                             {worker.photo ? <img src={worker.photo} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
                          </div>
                          <div>
                             <p className="text-xs font-black uppercase tracking-tight">{worker.first_name} {worker.last_name}</p>
                             <p className="text-[9px] font-bold text-slate-500">{worker.worker_id}</p>
                          </div>
                       </div>
                       <ChevronRight size={14} className="opacity-30" />
                    </button>
                 ))}
                 {!searchTerm && <div className="py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Search personnel records to begin</div>}
              </div>
           </div>
        </div>

        {/* Confirmation & Action */}
        <div className="md:col-span-6">
           <div className="premium-card space-y-8 py-10 text-center">
              {selectedWorker ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-tea-500 shadow-2xl relative">
                         {selectedWorker.photo ? <img src={selectedWorker.photo} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-300" />}
                         <div className="absolute bottom-0 inset-x-0 bg-tea-500 py-0.5">
                            <p className="text-[8px] font-black text-white uppercase tracking-tighter">VERIFIED</p>
                         </div>
                      </div>
                      <div>
                         <p className="text-[11px] font-black text-tea-600 dark:text-tea-400 uppercase tracking-[0.3em]">RECORD SELECTED</p>
                         <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic leading-tight mt-1">{selectedWorker.first_name} {selectedWorker.last_name}</h3>
                         <div className="inline-flex mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                            Identity: {selectedWorker.worker_id}
                         </div>
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
                        disabled={isSubmitting}
                        className={`w-full max-w-xs mx-auto py-5 bg-tea-600 hover:bg-tea-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 shadow-2xl shadow-tea-600/30 ${isSubmitting ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
                        {isSubmitting ? "SYNCING..." : "MARK AS PRESENT"}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="py-12 space-y-4 opacity-40">
                   <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center text-slate-400">
                      <User size={40} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select a personnel record<br/>from the left to log presence</p>
                </div>
              )}
           </div>

           <div className="mt-8 flex items-center gap-4 px-6 opacity-60">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                 <Database size={24} />
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">AUDIT LOGGING ACTIVE</h4>
                 <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider leading-relaxed">Manual check-ins are recorded with GPS metadata and supervisor ID for security verification.</p>
              </div>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loader {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}} />
    </div>
  );
}
