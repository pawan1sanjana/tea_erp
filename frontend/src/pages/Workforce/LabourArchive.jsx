import React, { useState, useEffect } from 'react';
import { Archive, Search, RotateCcw, AlertTriangle, UserCheck, Loader2, X, MapPin, Phone, Shield, FileText, User, Leaf } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function WorkerArchive() {
  const [searchTerm, setSearchTerm] = useState('');
  const [archivedWorkers, setArchivedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  
  const fetchArchive = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/workforce/archived');
      if (response.success) {
        setArchivedWorkers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch archive:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Are you sure you want to restore ${name} to active duty?`)) return;
    try {
      const response = await apiClient.put(`/workforce/workers/${id}/status`, { status: 'active' });
      if (response.success) {
        setSelectedWorker(null);
        fetchArchive(); // Refresh list after restore
      }
    } catch (error) {
      console.error('Failed to restore worker:', error);
    }
  };

  const filteredWorkers = archivedWorkers.filter(worker => 
    (worker.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (worker.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (worker.worker_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit">Worker Archive</h1>
          <p className="text-sm text-slate-500">Historical records of inactive or former field workers</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search archive by ID or Name..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-tea-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
                <th className="px-6 py-4 text-left font-bold">Worker ID</th>
                <th className="px-6 py-4 text-left font-bold">Worker Name</th>
                <th className="px-6 py-4 text-left font-bold">Archival Reason</th>
                <th className="px-6 py-4 text-left font-bold">Inactive Since</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-tea-500 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Accessing Archive...</p>
                  </td>
                </tr>
              ) : filteredWorkers.length > 0 ? (
                filteredWorkers.map((worker) => (
                  <tr 
                    key={worker.id} 
                    onClick={() => setSelectedWorker(worker)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-500">{worker.worker_id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100 font-outfit">{worker.first_name} {worker.last_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        {worker.status === 'archived' ? 'Historical Record' : worker.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(worker.archived_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRestore(worker.id, worker.first_name); }}
                        className="p-2 hover:bg-tea-50 dark:hover:bg-tea-900/40 rounded-lg text-tea-600 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 ml-auto"
                      >
                         <UserCheck size={14} /> Restore
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    No matching archived records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-4 p-5 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
        <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Compliance Warning</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500">Archived records must be retained for at least 7 years according to estate labor regulations for audit compliance.</p>
        </div>
      </div>

      {selectedWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedWorker(null)}></div>
          <div className="relative w-full max-w-5xl md:h-[85vh] bg-white dark:bg-slate-950 rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in border border-white/10 my-auto">
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col shrink-0">
               <div className="relative mx-auto md:mx-0 w-32 h-32 md:w-48 md:h-48 group">
                  <div className="absolute inset-0 bg-tea-500/20 rounded-full blur-2xl animate-pulse group-hover:bg-tea-500/30 transition-all"></div>
                  <div className="relative w-full h-full rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-xl">
                    {selectedWorker.photo ? (
                      <img 
                        src={selectedWorker.photo.startsWith('data:') ? selectedWorker.photo : `/api/uploads/${selectedWorker.photo}`} 
                        className="w-full h-full object-cover" 
                        alt=""
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <User size={64} className="text-slate-400" />
                      </div>
                    )}
                  </div>
               </div>
               <div className="mt-6 text-center md:text-left">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight">
                    {selectedWorker.first_name} {selectedWorker.last_name}
                  </h2>
                  <p className="text-tea-600 dark:text-tea-400 font-mono font-black text-sm tracking-widest mt-1 bg-tea-500/10 px-3 py-1 rounded-full inline-block">
                    {selectedWorker.worker_id}
                  </p>
                  <div className="mt-4 flex justify-center md:justify-start">
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      selectedWorker.wage_type === 'permanent' || !selectedWorker.wage_type ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      selectedWorker.wage_type === 'daily_cash' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {selectedWorker.wage_type?.replace('_', ' ') || 'Permanent'}
                    </span>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Shield size={18} className="text-slate-300" />
                      <span className="text-sm font-bold tracking-tight">{selectedWorker.nic}</span>
                    </div>
                    <div className="flex items-start gap-3 text-slate-500 dark:text-slate-400">
                      <MapPin size={18} className="text-slate-300 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium leading-relaxed">{selectedWorker.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Phone size={18} className="text-slate-300" />
                      <span className="text-sm font-bold">{selectedWorker.tel}</span>
                    </div>
                  </div>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-12">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">Archived Personnel Record</h3>
                    <p className="text-slate-500 text-sm">Full historical breakdown and verified documents</p>
                  </div>
                  <button onClick={() => setSelectedWorker(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24} /></button>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity Preview (Historical)</h4>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 p-8">
                         <div style={{ aspectRatio: '1.6/1', width: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%)', padding: '16px', color: 'white', borderRadius: '0px' }}>
                            <div className="flex justify-between items-start">
                               <div className="flex flex-col">
                                  <div className="flex items-center gap-2 mb-1">
                                     <Leaf size={14} className="text-tea-400" />
                                     <span className="text-[8px] font-black tracking-[3px]">TeaERP PRO</span>
                                  </div>
                                  <span className="text-[6px] font-bold opacity-50 uppercase tracking-widest">Official Identity</span>
                               </div>
                               <div className="bg-white p-1 rounded-sm">
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedWorker.worker_id}`} className="w-8 h-8" />
                               </div>
                            </div>
                            <div className="mt-2 text-center flex flex-col items-center">
                               <div className="w-16 h-16 border border-white/20 overflow-hidden mb-2">
                                  {selectedWorker.photo ? (
                                    <img 
                                      src={selectedWorker.photo.startsWith('data:') ? selectedWorker.photo : `/api/uploads/${selectedWorker.photo}`} 
                                      className="w-full h-full object-cover" 
                                      alt=""
                                    />
                                  ) : (
                                    <User size={24} className="opacity-30 mt-4 mx-auto" />
                                  )}
                               </div>
                               <h5 className="text-[10px] font-black uppercase text-center">{selectedWorker.first_name} {selectedWorker.last_name}</h5>
                               <p className="text-[7px] font-mono text-tea-400 mt-1">{selectedWorker.worker_id}</p>
                            </div>
                         </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Compliance Documents</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">NIC Front</p>
                          <div className="aspect-[1.6/1] bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                             {selectedWorker.nic_front ? <img src={selectedWorker.nic_front} className="w-full h-full object-cover" /> : <FileText className="text-slate-300" />}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">NIC Back</p>
                          <div className="aspect-[1.6/1] bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                             {selectedWorker.nic_back ? <img src={selectedWorker.nic_back} className="w-full h-full object-cover" /> : <FileText className="text-slate-300" />}
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
               <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                 <button 
                   onClick={() => setSelectedWorker(null)}
                   className="px-8 py-3 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                 >
                   Back to Archive
                 </button>
                 <button 
                   onClick={() => handleRestore(selectedWorker.id, selectedWorker.first_name)}
                   className="px-10 py-3 text-xs font-black uppercase tracking-widest bg-tea-600 hover:bg-tea-700 text-white rounded-full shadow-lg shadow-tea-500/20 transition-all flex items-center gap-2"
                 >
                   <RotateCcw size={16} /> Restore to Active Duty
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
