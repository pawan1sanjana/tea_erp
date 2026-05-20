import React, { useState, useEffect, useRef } from "react";
import { 
  Banknote, 
  Plus, 
  Search, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  AlertCircle,
  User,
  History,
  X,
  Check,
  ChevronDown,
  TrendingUp,
  Wallet,
  Calendar,
  DollarSign
} from "lucide-react";
import { apiClient } from '../../api/client';

export default function CashAdvance() {
  const [loading, setLoading] = useState(false);
  const [advances, setAdvances] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Searchable Worker State
  const [workerSearch, setWorkerSearch] = useState("");
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const workerDropdownRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const [formData, setFormData] = useState({
    worker_id: "",
    worker_name: "",
    advance_date: new Date().toISOString().split('T')[0],
    amount: "",
    reason: "Monthly Advance"
  });

  const [workerEarnings, setWorkerEarnings] = useState(0);

  useEffect(() => {
    fetchAdvances();
    fetchWorkers();
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (workerDropdownRef.current && !workerDropdownRef.current.contains(event.target)) {
        setShowWorkerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch earnings when worker is selected
  useEffect(() => {
    if (formData.worker_id) {
      fetchWorkerEarnings(formData.worker_id);
    } else {
      setWorkerEarnings(0);
    }
  }, [formData.worker_id, selectedDate]);

  const fetchAdvances = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/payrall/advances?year=${selectedDate.year}&month=${selectedDate.month}`);
      if (res.success) setAdvances(res.data);
    } catch (error) {
      console.error("Failed to fetch advances:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await apiClient.get('/workforce/workers');
      if (res.success) setWorkers(res.data);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    }
  };

  const fetchWorkerEarnings = async (id) => {
    try {
      const res = await apiClient.get(`/payrall/worker-earnings/${id}?year=${selectedDate.year}&month=${selectedDate.month}`);
      if (res.success) setWorkerEarnings(res.earnings);
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.amount) > workerEarnings) {
      if (!window.confirm(`Warning: Advance amount (Rs ${formData.amount}) exceeds current earnings (Rs ${workerEarnings}). Proceed anyway?`)) return;
    }

    try {
      const res = await apiClient.post('/payrall/advances', formData);
      if (res.success) {
        setShowAddModal(false);
        fetchAdvances();
        setFormData({ ...formData, worker_id: "", worker_name: "", amount: "" });
        setWorkerSearch("");
      }
    } catch (error) {
      alert("Failed to log advance");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this advance record?")) return;
    try {
      const res = await apiClient.delete(`/payrall/advances/${id}`);
      if (res.success) fetchAdvances();
    } catch (error) {
      alert("Failed to delete record");
    }
  };

  const changeMonth = (delta) => {
    setSelectedDate(prev => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth > 12) { newMonth = 1; newYear++; }
      else if (newMonth < 1) { newMonth = 12; newYear--; }
      return { year: newYear, month: newMonth };
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const filteredWorkers = workers.filter(w => 
    (w.first_name + " " + w.last_name).toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.worker_id.toString().includes(workerSearch)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Cash Advance Portal</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
            <Banknote size={12} className="text-amber-500" /> Financial Assistance & Deductions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronLeft size={16} /></button>
            <span className="text-[10px] font-black uppercase tracking-widest px-2">{monthNames[selectedDate.month - 1]} {selectedDate.year}</span>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight size={16} /></button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
          >
            <Plus size={16} /> New Advance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card flex items-center gap-4 border-amber-500/20">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600"><Wallet size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Total Issued ({monthNames[selectedDate.month-1]})</p>
            <h3 className="text-xl font-black text-amber-600">Rs {advances.reduce((acc, i) => acc + parseFloat(i.amount), 0).toLocaleString()}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"><User size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Active Beneficiaries</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{[...new Set(advances.map(i => i.worker_id))].length} <span className="text-xs text-slate-400 font-bold">Workers</span></h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"><TrendingUp size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Avg. Advance / Worker</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
               Rs {(advances.length > 0 ? (advances.reduce((acc, i) => acc + parseFloat(i.amount), 0) / [...new Set(advances.map(i => i.worker_id))].length) : 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
            </h3>
          </div>
        </div>
      </div>

      <div className="premium-card p-0 overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History size={14} className="text-amber-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Advance Disbursement History</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search worker..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[8px] uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Worker</th>
                <th className="px-6 py-3 text-left">Reason / Context</th>
                <th className="px-6 py-3 text-right">Advance Amount</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-10 text-center"><Activity className="animate-spin inline text-amber-500" /></td></tr>
              ) : advances.length === 0 ? (
                <tr><td colSpan="5" className="py-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">No advances issued for this period</td></tr>
              ) : advances.filter(i => i.worker_name.toLowerCase().includes(searchTerm.toLowerCase())).map(advance => (
                <tr key={advance.id} className="hover:bg-slate-50/50 text-[10px]">
                  <td className="px-6 py-3 font-bold text-slate-500">{new Date(advance.advance_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <div className="font-black text-slate-900">{advance.worker_name}</div>
                    <div className="text-[8px] text-slate-400 uppercase tracking-tighter">ID: {advance.worker_epf}</div>
                  </td>
                  <td className="px-6 py-3 text-slate-500 italic">{advance.reason}</td>
                  <td className="px-6 py-3 text-right font-black text-amber-600">Rs {parseFloat(advance.amount).toLocaleString()}</td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => handleDelete(advance.id)} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Advance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Disburse Cash Advance</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddAdvance} className="p-6 space-y-4">
              
              <div className="space-y-1 relative" ref={workerDropdownRef}>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identify Beneficiary</label>
                <div 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer group hover:border-amber-500/40 transition-all"
                  onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <User size={14} className="text-slate-400" />
                    <span className={`text-xs font-bold truncate ${formData.worker_id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {formData.worker_name || "Search and select worker..."}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${showWorkerDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showWorkerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Search name or ID..."
                          value={workerSearch}
                          onChange={(e) => setWorkerSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-0 outline-none"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredWorkers.length > 0 ? filteredWorkers.map(w => (
                        <div 
                          key={w.id}
                          className="px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer flex items-center justify-between group"
                          onClick={() => {
                            setFormData({...formData, worker_id: w.id, worker_name: `${w.first_name} ${w.last_name}`});
                            setShowWorkerDropdown(false);
                            setWorkerSearch("");
                          }}
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-white group-hover:text-amber-700 transition-colors">{w.first_name} {w.last_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {w.worker_id}</p>
                          </div>
                          {formData.worker_id === w.id && <Check size={14} className="text-amber-500" />}
                        </div>
                      )) : (
                        <div className="p-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No workers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {formData.worker_id && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between group overflow-hidden relative">
                   <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                      <TrendingUp size={80} className="text-white" />
                   </div>
                   <div className="z-10">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Month Earnings</p>
                      <p className="text-2xl font-black text-white leading-none">Rs {workerEarnings.toLocaleString()}</p>
                   </div>
                   <div className="text-right z-10">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Recommended</p>
                      <p className="text-xs font-black text-emerald-400">Rs {(workerEarnings * 0.75).toLocaleString()}</p>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Date</label>
                  <input 
                    type="date" required
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    value={formData.advance_date}
                    onChange={(e) => setFormData({...formData, advance_date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount (Rs)</label>
                  <input 
                    type="number" required min="1"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black text-amber-600"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason / Memo</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  placeholder="E.g. Medical emergency, School fees..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={!formData.worker_id || !formData.amount}
                className="w-full py-4 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 disabled:grayscale"
              >
                Confirm Disbursement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
