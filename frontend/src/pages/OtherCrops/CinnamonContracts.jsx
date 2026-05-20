import React, { useState, useEffect, useRef } from 'react';
import { 
  Scissors, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Layers, 
  Weight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check
} from 'lucide-react';
import { apiClient } from '../../api/client';

export default function CinnamonContracts() {
  const [contracts, setContracts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const itemsPerPage = 9;

  const [workerSearch, setWorkerSearch] = useState("");
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const workerDropdownRef = useRef(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState("");

  const [form, setForm] = useState({
    contract_date: new Date().toISOString().split('T')[0],
    block_id: '',
    contractor_id: '',
    peeled_weight: '',
    rate_per_kg: '450' // default rate in LKR
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (workerDropdownRef.current && !workerDropdownRef.current.contains(event.target)) {
        setShowWorkerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredWorkers = workers.filter(w => 
    (w.first_name + " " + w.last_name).toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.worker_id.toString().includes(workerSearch)
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, bRes, wRes] = await Promise.all([
        apiClient.get('/cinnamon/contracts'),
        apiClient.get('/crop/blocks'),
        apiClient.get('/workforce/workers')
      ]);
      if (cRes.success) setContracts(cRes.data);
      if (bRes.success) setBlocks(bRes.data.filter(b => b.cropType === 'Cinnamon'));
      if (wRes.success) setWorkers(wRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.post('/cinnamon/contracts', form);
      if (response.success) {
        setShowForm(false);
        fetchData();
        setForm({
          contract_date: new Date().toISOString().split('T')[0],
          block_id: '',
          contractor_id: '',
          peeled_weight: '',
          rate_per_kg: '450'
        });
        setSelectedWorkerName("");
        setWorkerSearch("");
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContracts = React.useMemo(() => {
    let result = contracts;
    if (filterDate) {
      result = result.filter(c => new Date(c.contract_date).toISOString().split('T')[0] === filterDate);
    }
    return result;
  }, [contracts, filterDate]);

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filterDate]);

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight flex items-center gap-3">
            Cinnamon <span className="text-amber-600">Contracts</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1 uppercase tracking-widest text-[10px]">
            <Scissors size={14} className="text-amber-600" />
            Cutting & Peeling Management
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/30"
          >
            <Plus size={16} /> Record New Contract
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main List */}
        <div className="lg:col-span-12 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
               <FileText className="text-amber-600" /> Contract Registry
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-600 dark:text-slate-300"
                />
              </div>
              {filterDate && (
                <button 
                  onClick={() => setFilterDate("")}
                  className="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300">
               <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
               <p className="mt-4 text-slate-500 font-medium tracking-wide">Syncing contract ledger...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 text-slate-400">
               <Scissors size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-bold">No contracts found.</p>
               <p className="text-sm">Start by recording a cutting and peeling contract.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedContracts.map(c => (
                  <div key={c.id} className="premium-card p-6 hover:scale-[1.02] transition-all cursor-default group">
                     <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                              <Calendar size={20} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(c.contract_date).toLocaleDateString()}</p>
                              <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{c.block_name}</p>
                           </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {c.status}
                        </span>
                     </div>

                     <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contractor</span>
                           <span className="text-sm font-black text-slate-900 dark:text-white">{c.first_name} {c.last_name}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                           <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Peeled (Dry)</p>
                              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{c.peeled_weight} <span className="text-xs">kg</span></p>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout Due</p>
                           <p className="text-xl font-black text-amber-600">Rs. {Number(c.total_payable).toLocaleString()}</p>
                        </div>
                        <button className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-600 transition-all">
                           <ChevronRight size={20} />
                        </button>
                     </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                 <div className="p-4 mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                   <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredContracts.length)} of {filteredContracts.length} records</span>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                       disabled={currentPage === 1}
                       className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                     >
                       <ChevronLeft size={16} />
                     </button>
                     <span className="px-4">Page {currentPage} of {totalPages}</span>
                     <button 
                       onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                       disabled={currentPage === totalPages}
                       className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                     >
                       <ChevronRight size={16} />
                     </button>
                   </div>
                 </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                       <Plus size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Contract</h3>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Peeling & Cutting Entry</p>
                    </div>
                 </div>
                 <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">✕</button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contract Date</label>
                       <div className="relative">
                          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                          <input 
                            type="date"
                            value={form.contract_date}
                            onChange={(e) => setForm({...form, contract_date: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Block</label>
                       <div className="relative">
                          <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                          <select 
                            value={form.block_id}
                            onChange={(e) => setForm({...form, block_id: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all"
                          >
                            <option value="">Select Block</option>
                            {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="md:col-span-2 space-y-2 relative" ref={workerDropdownRef}>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contractor / Worker Team</label>
                       
                       <div 
                         className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl flex items-center justify-between cursor-pointer group hover:ring-2 hover:ring-amber-500/20 transition-all"
                         onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
                       >
                         <div className="flex items-center gap-3 overflow-hidden">
                           <User size={18} className="text-amber-500" />
                           <span className={`text-sm font-bold truncate ${form.contractor_id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                             {selectedWorkerName || "Search and select contractor..."}
                           </span>
                         </div>
                         <ChevronDown size={18} className={`text-slate-400 transition-transform ${showWorkerDropdown ? 'rotate-180' : ''}`} />
                       </div>

                       {showWorkerDropdown && (
                         <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                             <div className="relative">
                               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                               <input 
                                 autoFocus
                                 type="text" 
                                 placeholder="Search name or ID..."
                                 value={workerSearch}
                                 onChange={(e) => setWorkerSearch(e.target.value)}
                                 className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-0 outline-none"
                               />
                             </div>
                           </div>
                           <div className="max-h-60 overflow-y-auto">
                             {filteredWorkers.length > 0 ? filteredWorkers.map(w => (
                               <div 
                                 key={w.id}
                                 className="px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer flex items-center justify-between group"
                                 onClick={() => {
                                   setForm({...form, contractor_id: w.id});
                                   setSelectedWorkerName(`${w.first_name} ${w.last_name} (${w.worker_id})`);
                                   setShowWorkerDropdown(false);
                                   setWorkerSearch("");
                                 }}
                               >
                                 <div>
                                   <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-amber-700 transition-colors">{w.first_name} {w.last_name}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {w.worker_id}</p>
                                 </div>
                                 {form.contractor_id === w.id && <Check size={16} className="text-amber-500" />}
                               </div>
                             )) : (
                               <div className="p-6 text-center text-slate-400 text-xs font-black uppercase tracking-widest">No contractors found</div>
                             )}
                           </div>
                         </div>
                       )}
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Peeled Weight (kg)</label>
                       <div className="relative">
                          <Weight size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={form.peeled_weight}
                            onChange={(e) => setForm({...form, peeled_weight: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rate per peeled kg (LKR)</label>
                       <input 
                         type="number"
                         value={form.rate_per_kg}
                         onChange={(e) => setForm({...form, rate_per_kg: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all"
                       />
                    </div>
                 </div>

                 <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Estimated Total Payout</p>
                          <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-1">Rs. {(Number(form.peeled_weight || 0) * Number(form.rate_per_kg || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                       </div>
                       <AlertCircle size={32} className="text-amber-500/40" />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                 <button 
                   onClick={handleSave}
                   disabled={isSaving || !form.block_id || !form.contractor_id || !form.peeled_weight}
                   className="w-full py-5 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSaving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={20} />}
                    Commit Contract Record
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
