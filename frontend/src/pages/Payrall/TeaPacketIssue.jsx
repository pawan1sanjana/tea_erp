import React, { useState, useEffect, useRef } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  AlertCircle,
  Tag,
  History,
  X,
  Check,
  ChevronDown,
  User,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from '../../api/client';

export default function TeaPacketIssue() {
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const [stock, setStock] = useState([]);
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
    issue_date: new Date().toISOString().split('T')[0],
    grade: "BOPF",
    size_grams: 500,
    quantity: 1,
    unit_price: ""
  });

  useEffect(() => {
    fetchIssues();
    fetchStock();
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

  useEffect(() => {
    const selectedStock = stock.find(s => s.grade === formData.grade && s.size_grams === parseInt(formData.size_grams));
    if (selectedStock) {
      setFormData(prev => ({ ...prev, unit_price: selectedStock.unit_price }));
    } else {
      // If the current size doesn't exist for this grade, pick the first available size
      const firstAvailable = stock.find(s => s.grade === formData.grade);
      if (firstAvailable) {
        setFormData(prev => ({ 
          ...prev, 
          size_grams: firstAvailable.size_grams,
          unit_price: firstAvailable.unit_price 
        }));
      }
    }
  }, [formData.grade, formData.size_grams, stock]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/tea-packets/issues?year=${selectedDate.year}&month=${selectedDate.month}`);
      if (res.success) setIssues(res.data);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStock = async () => {
    try {
      const res = await apiClient.get('/tea-packets/stock');
      if (res.success) setStock(res.data);
    } catch (error) {
      console.error("Failed to fetch stock:", error);
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

  const handleAddIssue = async (e) => {
    e.preventDefault();
    const currentStock = stock.find(s => s.grade === formData.grade && s.size_grams === parseInt(formData.size_grams))?.current_stock || 0;
    
    if (formData.quantity > currentStock) {
      alert(`Insufficient stock! Available: ${currentStock}`);
      return;
    }

    try {
      const res = await apiClient.post('/tea-packets/issues', formData);
      if (res.success) {
        setShowAddModal(false);
        fetchIssues();
        fetchStock();
        setFormData({ ...formData, worker_id: "", worker_name: "", quantity: 1 });
        setWorkerSearch("");
      }
    } catch (error) {
      alert("Failed to log issue: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this issue? Stock will NOT be automatically returned.")) return;
    try {
      const res = await apiClient.delete(`/tea-packets/issues/${id}`);
      if (res.success) fetchIssues();
    } catch (error) {
      alert("Failed to delete issue");
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

  const selectedPacket = stock.find(s => s.grade === formData.grade && s.size_grams === parseInt(formData.size_grams));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Tea Packet Distribution</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
            <Package size={12} className="text-tea-500" /> Payroll Deductions & Logistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/inventory/tea-packets"
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700"
          >
            Manage Stock <ArrowRight size={14} />
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronLeft size={16} /></button>
            <span className="text-[10px] font-black uppercase tracking-widest px-2">{monthNames[selectedDate.month - 1]} {selectedDate.year}</span>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight size={16} /></button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-tea-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-tea-700 transition-all shadow-lg shadow-tea-600/20"
          >
            <Plus size={16} /> Log Issue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-tea-100 dark:bg-tea-900/30 text-tea-600"><Package size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Packets Issued</p>
            <h3 className="text-xl font-black">{issues.reduce((acc, i) => acc + i.quantity, 0)} <span className="text-xs text-slate-400">Units</span></h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600"><Tag size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Financial Impact</p>
            <h3 className="text-xl font-black text-rose-600">Rs {issues.reduce((acc, i) => acc + parseFloat(i.total_price), 0).toLocaleString()}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"><User size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Beneficiaries</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{[...new Set(issues.map(i => i.worker_id))].length} <span className="text-xs text-slate-400 font-bold">Workers</span></h3>
          </div>
        </div>
      </div>

      <div className="premium-card p-0 overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History size={14} className="text-tea-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Distribution Registry</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search worker..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-tea-500/20"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[8px] uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Worker</th>
                <th className="px-6 py-3 text-left">Packet Details</th>
                <th className="px-6 py-3 text-center">Qty</th>
                <th className="px-6 py-3 text-right">Total Value</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="py-10 text-center"><Activity className="animate-spin inline text-tea-500" /></td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan="6" className="py-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">No issues logged for this period</td></tr>
              ) : issues.filter(i => i.worker_name.toLowerCase().includes(searchTerm.toLowerCase())).map(issue => (
                <tr key={issue.id} className="hover:bg-slate-50/50 text-[10px]">
                  <td className="px-6 py-3 font-bold text-slate-500">{new Date(issue.issue_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <div className="font-black text-slate-900">{issue.worker_name}</div>
                    <div className="text-[8px] text-slate-400 uppercase tracking-tighter">ID: {issue.worker_epf}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-tea-50 text-tea-700 px-2 py-0.5 rounded-full font-bold uppercase text-[8px]">{issue.grade}</span>
                      <span className="text-slate-500">{issue.size_grams}g</span>
                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${issue.current_stock < 10 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        In Stock: {issue.current_stock || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center font-black">{issue.quantity}</td>
                  <td className="px-6 py-3 text-right font-black text-rose-600">Rs {parseFloat(issue.total_price).toLocaleString()}</td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => handleDelete(issue.id)} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Issue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Issue Packet to Worker</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddIssue} className="p-6 space-y-4">
              
              <div className="space-y-1 relative" ref={workerDropdownRef}>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Worker</label>
                <div 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer group hover:border-tea-500/40 transition-all"
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
                          className="px-4 py-2 hover:bg-tea-50 dark:hover:bg-tea-900/20 cursor-pointer flex items-center justify-between group"
                          onClick={() => {
                            setFormData({...formData, worker_id: w.id, worker_name: `${w.first_name} ${w.last_name}`});
                            setShowWorkerDropdown(false);
                            setWorkerSearch("");
                          }}
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-white group-hover:text-tea-700 transition-colors">{w.first_name} {w.last_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {w.worker_id}</p>
                          </div>
                          {formData.worker_id === w.id && <Check size={14} className="text-tea-500" />}
                        </div>
                      )) : (
                        <div className="p-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No workers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Date</label>
                  <input 
                    type="date" required
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tea Grade</label>
                  <select 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  >
                    {[...new Set(stock.map(s => s.grade))].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Size (Grams)</label>
                  <select 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    value={formData.size_grams}
                    onChange={(e) => setFormData({...formData, size_grams: parseInt(e.target.value)})}
                  >
                    {stock.filter(s => s.grade === formData.grade).map(s => (
                      <option key={s.size_grams} value={s.size_grams}>{s.size_grams}g</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                  <input 
                    type="number" min="1" required
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {selectedPacket && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border flex flex-col justify-center ${selectedPacket.current_stock < formData.quantity ? 'bg-rose-50 border-rose-100' : 'bg-tea-50 border-tea-100'}`}>
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1 leading-none">In Inventory</p>
                    <div className="flex items-end gap-1">
                      <span className={`text-2xl font-black leading-none ${selectedPacket.current_stock < formData.quantity ? 'text-rose-600' : 'text-tea-600'}`}>
                        {selectedPacket.current_stock}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 pb-0.5 uppercase">Units</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1 leading-none">Deduction</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black leading-none text-slate-900 dark:text-white">
                        {parseFloat(selectedPacket.unit_price).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 pb-0.5 uppercase">Rs</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedPacket && selectedPacket.current_stock < formData.quantity && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Warning: Insufficient inventory</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={!formData.worker_id || (selectedPacket && selectedPacket.current_stock < formData.quantity)}
                className="w-full py-4 bg-tea-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-tea-700 transition-all shadow-lg shadow-tea-600/20 disabled:opacity-50 disabled:grayscale"
              >
                Confirm Distribution
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
