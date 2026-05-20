import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, Search, Filter, Clock, MapPin, Briefcase, ChevronRight, Activity, LogOut } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function DutyRelease() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActiveAssignments();
  }, []);

  const fetchActiveAssignments = async () => {
    try {
      const res = await apiClient.get('/workforce/workers');
      if (res.success) {
        // Filter only those who have an active task
        const active = res.data.filter(w => w.task && w.block_id);
        setWorkers(active);
      }
    } catch (error) {
      console.error('Fetch assignments failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (workerId) => {
    setReleasing(prev => ({ ...prev, [workerId]: true }));
    try {
      const res = await apiClient.post('/workforce/muster/release', { worker_id: workerId });
      if (res.success) {
        // Optimistic UI update
        setWorkers(prev => prev.filter(w => w.id !== workerId));
      }
    } catch (error) {
      console.error('Release failed', error);
      alert('Failed to release worker from duty.');
    } finally {
      setReleasing(prev => ({ ...prev, [workerId]: false }));
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.full_name_initials?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.worker_id?.toString().includes(searchTerm) ||
    w.task?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Duty Release Hub</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Task Reassignment & Duty Release Registry</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search by Name, ID or Task..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-amber-500 transition-all w-full md:w-64"
                />
            </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-amber-600 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 border-dashed">
          <Activity className="animate-pulse mb-3" size={32} />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Synchronizing Assignments...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.length > 0 ? (
            filteredWorkers.map(worker => (
              <div key={worker.id} className="premium-card group hover:border-amber-500/30 transition-all">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden relative">
                      {worker.photo ? (
                        <img 
                          src={worker.photo.startsWith('data:') ? worker.photo : `/api/uploads/${worker.photo}`} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                         <Users size={24} />
                      )}
                      <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm font-outfit italic">{worker.full_name_initials}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{worker.worker_id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">Active Duty</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase flex items-center gap-2"><MapPin size={12}/> Assigned Field</span>
                        <span className="text-slate-900 dark:text-white font-black uppercase italic">{worker.block_name || 'Block '+worker.block_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase flex items-center gap-2"><Briefcase size={12}/> Task Profile</span>
                        <span className="text-slate-900 dark:text-white font-black uppercase italic">{worker.task}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase flex items-center gap-2"><Clock size={12}/> Duty Started</span>
                        <span className="text-slate-900 dark:text-white font-black uppercase italic">07:00 AM</span>
                    </div>
                </div>

                <button 
                  onClick={() => handleRelease(worker.id)}
                  disabled={releasing[worker.id]}
                  className="w-full py-4 bg-slate-900 hover:bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 group"
                >
                  {releasing[worker.id] ? (
                    <Activity className="animate-spin" size={16} />
                  ) : (
                    <>
                      <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                      Complete Task & Release Duty
                    </>
                  )}
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <CheckCircle2 size={48} className="mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-50 italic">No workers currently on duty</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">All personnel are either off-duty or unassigned</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
