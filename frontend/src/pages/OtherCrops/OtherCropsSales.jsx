import React, { useState, useEffect, useMemo } from 'react';
import { 
  Banknote, 
  Plus, 
  Search, 
  Calendar, 
  Tag, 
  Scale, 
  TrendingUp, 
  CheckCircle2, 
  Wallet,
  Building,
  ChevronRight,
  ChevronLeft,
  FileText,
  Download,
  Filter,
  CircleDot,
  Package,
  Layers
} from 'lucide-react';
import { apiClient } from '../../api/client';

const CINNAMON_GRADES = ['Alba', 'C5 Special', 'C5', 'C4', 'M5', 'M4', 'H1', 'H2', 'Quillings', 'Other'];
const COCONUT_CATEGORIES = ['Fresh Nuts', 'Copra', 'Husks', 'Charcoal', 'Seedlings', 'Other'];
const PEPPER_GRADES = ['Black Pepper (G1)', 'Black Pepper (G2)', 'White Pepper', 'Pepper Husks', 'Other'];

export default function OtherCropsSales() {
  const [activeTab, setActiveTab] = useState('cinnamon'); // 'cinnamon', 'coconut', or 'pepper'
  const [sales, setSales] = useState({ cinnamon: [], coconut: [], pepper: [] });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const itemsPerPage = 10;

  const [form, setForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    buyer_name: '',
    grade: 'Alba', // for cinnamon
    category: 'Fresh Nuts', // for coconut
    quantity_kg: '', // for cinnamon
    quantity: '', // for coconut
    unit: 'nuts', // for coconut
    rate_per_kg: '', // for cinnamon
    rate_per_unit: '', // for coconut
    incomeAccountId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cinRes, cocRes, pepRes, aRes] = await Promise.all([
        apiClient.get('/cinnamon/sales'),
        apiClient.get('/coconut/sales'),
        apiClient.get('/pepper/sales'),
        apiClient.get('/finance/accounts')
      ]);
      
      setSales({
        cinnamon: cinRes.success ? cinRes.data : [],
        coconut: cocRes.success ? cocRes.data : [],
        pepper: pepRes.success ? pepRes.data : []
      });

      if (aRes.success) {
        const incomeAccs = aRes.data.filter(a => a.type === 'income');
        setAccounts(incomeAccs);
        updateAccountSelection(incomeAccs, activeTab);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAccountSelection = (accs, tab) => {
    const targetAcc = accs.find(a => a.name.toLowerCase().includes(tab));
    if (targetAcc) setForm(prev => ({ ...prev, incomeAccountId: targetAcc.id }));
    else setForm(prev => ({ ...prev, incomeAccountId: '' }));
  };

  useEffect(() => {
    updateAccountSelection(accounts, activeTab);
    setCurrentPage(1);
  }, [activeTab, accounts]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const endpoint = activeTab === 'cinnamon' ? '/cinnamon/sales' : activeTab === 'coconut' ? '/coconut/sales' : '/pepper/sales';
      const response = await apiClient.post(endpoint, form);
      if (response.success) {
        setShowForm(false);
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setForm(prev => ({
      ...prev,
      buyer_name: '',
      quantity_kg: '',
      quantity: '',
      rate_per_kg: '',
      rate_per_unit: ''
    }));
  };

  const filteredSales = useMemo(() => {
    let result = sales[activeTab] || [];
    if (filterDate) {
      result = result.filter(s => new Date(s.sale_date).toISOString().split('T')[0] === filterDate);
    }
    return result;
  }, [sales, activeTab, filterDate]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + (activeTab === 'cinnamon' 
          ? "Date,Buyer,Grade,Quantity(kg),Rate,Total\n" 
          : activeTab === 'coconut'
            ? "Date,Buyer,Category,Quantity,Unit,Rate,Total\n"
            : "Date,Buyer,Grade,Quantity(kg),Rate,Total\n")
      + filteredSales.map(s => {
          if (activeTab === 'cinnamon' || activeTab === 'pepper') {
            return `${s.sale_date},${s.buyer_name},${s.grade},${s.quantity_kg},${s.rate_per_kg},${s.total_amount}`;
          } else {
            return `${s.sale_date},${s.buyer_name},${s.category},${s.quantity},${s.unit},${s.rate_per_unit},${s.total_amount}`;
          }
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight flex items-center gap-3">
             Other Crops <span className="text-amber-600">Sales Hub</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 pl-1 mt-1 uppercase tracking-widest text-[10px]">
             <TrendingUp size={14} className="text-amber-600" />
             Consolidated Revenue Intelligence
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm self-stretch md:self-auto">
          <button 
            onClick={() => setActiveTab('cinnamon')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cinnamon' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Banknote size={14} /> Cinnamon
          </button>
          <button 
            onClick={() => setActiveTab('coconut')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'coconut' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <CircleDot size={14} /> Coconut
          </button>
          <button 
            onClick={() => setActiveTab('pepper')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pepper' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Package size={14} /> Pepper
          </button>
        </div>
      </div>

      {/* Analytics Mini-Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sales", val: filteredSales.length, unit: "Entries", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Current Period", val: "MAY", unit: "2026", icon: Calendar, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Revenue Share", val: activeTab === 'cinnamon' ? "64" : "36", unit: "%", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Ledger Status", val: "SYNC", unit: "OK", icon: CheckCircle2, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-4 border-none shadow-xl shadow-black/5 flex items-center gap-4 group">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
               <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white font-outfit tracking-tighter">
                {stat.val}<span className="text-[9px] font-bold text-slate-400 ml-1 uppercase">{stat.unit}</span>
              </h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Sales List Table Area */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
               {activeTab === 'cinnamon' ? <Banknote className="text-amber-600" /> : activeTab === 'coconut' ? <CircleDot className="text-cyan-600" /> : <Package className="text-emerald-600" />}
               {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Sales Registry
            </h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-600 dark:text-slate-300 transition-all"
                />
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <Download size={14} /> Export
              </button>
              <button 
                onClick={() => setShowForm(true)}
                className={`flex items-center gap-2 px-4 py-2 text-white border-none rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${activeTab === 'cinnamon' ? 'bg-amber-600 shadow-amber-500/30' : activeTab === 'coconut' ? 'bg-cyan-600 shadow-cyan-500/30' : 'bg-emerald-600 shadow-emerald-500/30'}`}
              >
                <Plus size={14} /> New Sale
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 animate-pulse">
               <div className={`w-12 h-12 border-4 ${activeTab === 'cinnamon' ? 'border-amber-500/20 border-t-amber-600' : activeTab === 'coconut' ? 'border-cyan-500/20 border-t-cyan-600' : 'border-emerald-500/20 border-t-emerald-600'} rounded-full animate-spin mx-auto`}></div>
               <p className="mt-4 text-slate-500 font-medium tracking-wide italic">Fetching consolidated sales intelligence...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 text-slate-400">
               <Package size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-bold">No sales detected for the current filters.</p>
               <p className="text-sm italic">Initiate a new transaction to populate the ledger.</p>
            </div>
          ) : (
            <div className="premium-card overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 font-outfit uppercase tracking-widest">
                        <th className="py-4 px-6 text-[9px] font-black text-slate-400">Transaction Date</th>
                        <th className="py-4 px-6 text-[9px] font-black text-slate-400">Buyer Entity</th>
                        <th className="py-4 px-6 text-[9px] font-black text-slate-400">Inventory Type / Quantity</th>
                        <th className="py-4 px-6 text-[9px] font-black text-slate-400">Unit Valuation</th>
                        <th className="py-4 px-6 text-[9px] font-black text-slate-400 text-right">Settlement Total</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {paginatedSales.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default">
                           <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'cinnamon' ? 'bg-amber-500' : activeTab === 'coconut' ? 'bg-cyan-500' : 'bg-emerald-500'}`}></div>
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{new Date(s.sale_date).toLocaleDateString()}</span>
                              </div>
                           </td>
                           <td className="py-4 px-6">
                              <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">{s.buyer_name}</p>
                              <p className="text-[9px] font-medium text-slate-400 italic">Ledger Ref: #{s.id.toString().padStart(4, '0')}</p>
                           </td>
                           <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${activeTab === 'cinnamon' ? 'bg-amber-100 text-amber-700' : activeTab === 'coconut' ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                   {activeTab === 'cinnamon' || activeTab === 'pepper' ? s.grade : s.category}
                                 </span>
                                 <span className="text-sm font-bold text-slate-900 dark:text-white">
                                   {activeTab === 'cinnamon' || activeTab === 'pepper' ? `${s.quantity_kg} kg` : `${s.quantity} ${s.unit}`}
                                 </span>
                              </div>
                           </td>
                           <td className="py-4 px-6">
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                {activeTab === 'cinnamon' || activeTab === 'pepper' ? `Rs. ${s.rate_per_kg}` : `Rs. ${s.rate_per_unit}`}
                                <span className="text-[9px] ml-1 uppercase text-slate-400">/ {activeTab === 'cinnamon' || activeTab === 'pepper' ? 'kg' : s.unit}</span>
                              </p>
                           </td>
                           <td className="py-4 px-6 text-right">
                              <span className={`text-lg font-black ${activeTab === 'cinnamon' ? 'text-amber-600 dark:text-amber-400' : activeTab === 'coconut' ? 'text-cyan-600 dark:text-cyan-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                 Rs. {Number(s.total_amount).toLocaleString()}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {totalPages > 1 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <span>Records {Math.min(filteredSales.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length}</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-2">Page {currentPage} of {totalPages}</span>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Unified Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
              <div className={`p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center ${activeTab === 'cinnamon' ? 'bg-amber-50/50' : activeTab === 'coconut' ? 'bg-cyan-50/50' : 'bg-emerald-50/50'} dark:bg-slate-900/50`}>
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${activeTab === 'cinnamon' ? 'bg-amber-500' : activeTab === 'coconut' ? 'bg-cyan-500' : 'bg-emerald-500'} text-white flex items-center justify-center shadow-lg`}>
                       <Plus size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Sale</h3>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">New Revenue Ledger Entry</p>
                    </div>
                 </div>
                 <button onClick={() => { setShowForm(false); resetForm(); }} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">✕</button>
              </div>

              <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date of Transaction</label>
                       <div className="relative">
                          <Calendar size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${activeTab === 'cinnamon' ? 'text-amber-500' : 'text-cyan-500'}`} />
                          <input 
                            type="date"
                            value={form.sale_date}
                            onChange={(e) => setForm({...form, sale_date: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 transition-all outline-none"
                          />
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                         {activeTab === 'cinnamon' ? 'Cinnamon Grade' : activeTab === 'coconut' ? 'Coconut Category' : 'Pepper Grade'}
                       </label>
                       <div className="relative">
                          {activeTab === 'cinnamon' ? <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" /> : activeTab === 'coconut' ? <CircleDot size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" /> : <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
                          <select 
                            value={activeTab === 'cinnamon' ? form.grade : activeTab === 'coconut' ? form.category : form.grade}
                            onChange={(e) => setForm({
                              ...form, 
                              [activeTab === 'cinnamon' || activeTab === 'pepper' ? 'grade' : 'category']: e.target.value,
                              unit: activeTab === 'coconut' && e.target.value === 'Copra' ? 'kg' : 'nuts'
                            })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 transition-all outline-none"
                          >
                            {activeTab === 'cinnamon' 
                              ? CINNAMON_GRADES.map(g => <option key={g} value={g}>{g}</option>)
                              : activeTab === 'coconut'
                                ? COCONUT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                                : PEPPER_GRADES.map(p => <option key={p} value={p}>{p}</option>)
                            }
                          </select>
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Buyer Entity Name</label>
                       <div className="relative">
                          <Building size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${activeTab === 'cinnamon' ? 'text-amber-500' : activeTab === 'coconut' ? 'text-cyan-500' : 'text-emerald-500'}`} />
                          <input 
                            placeholder="e.g. Export House, Dealer, Factory"
                            value={form.buyer_name}
                            onChange={(e) => setForm({...form, buyer_name: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 transition-all outline-none uppercase tracking-tight"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                         Quantity {activeTab === 'cinnamon' || activeTab === 'pepper' ? '(kg)' : `(${form.unit})`}
                       </label>
                       <div className="relative">
                          <Scale size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${activeTab === 'cinnamon' ? 'text-amber-500' : activeTab === 'coconut' ? 'text-cyan-500' : 'text-emerald-500'}`} />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={activeTab === 'cinnamon' || activeTab === 'pepper' ? form.quantity_kg : form.quantity}
                            onChange={(e) => setForm({...form, [activeTab === 'cinnamon' || activeTab === 'pepper' ? 'quantity_kg' : 'quantity']: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 transition-all outline-none"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                         Rate per {activeTab === 'cinnamon' || activeTab === 'pepper' ? 'kg' : form.unit} (LKR)
                       </label>
                       <div className="relative">
                          <Wallet size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${activeTab === 'cinnamon' ? 'text-amber-500' : activeTab === 'coconut' ? 'text-cyan-500' : 'text-emerald-500'}`} />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={activeTab === 'cinnamon' || activeTab === 'pepper' ? form.rate_per_kg : form.rate_per_unit}
                            onChange={(e) => setForm({...form, [activeTab === 'cinnamon' || activeTab === 'pepper' ? 'rate_per_kg' : 'rate_per_unit']: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 transition-all outline-none"
                          />
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Income GL Account</label>
                       <select 
                         value={form.incomeAccountId}
                         onChange={(e) => setForm({...form, incomeAccountId: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 transition-all outline-none shadow-inner"
                       >
                         <option value="">Select Target Account</option>
                         {accounts.map(a => <option key={a.id} value={a.id}>{a.code} • {a.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className={`p-6 rounded-[2rem] ${activeTab === 'cinnamon' ? 'bg-amber-600 shadow-amber-500/20' : activeTab === 'coconut' ? 'bg-cyan-600 shadow-cyan-500/20' : 'bg-emerald-600 shadow-emerald-500/20'} text-white shadow-xl group relative overflow-hidden transition-all duration-500`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center justify-between relative z-10">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Calculated Settlement Value</p>
                          <p className="text-3xl font-black mt-1 font-outfit italic tracking-tighter">
                            Rs. {(Number(activeTab === 'cinnamon' || activeTab === 'pepper' ? form.quantity_kg : form.quantity) * Number(activeTab === 'cinnamon' || activeTab === 'pepper' ? form.rate_per_kg : form.rate_per_unit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                       </div>
                       <TrendingUp size={40} className="opacity-20 rotate-12" />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                 <button 
                   onClick={handleSave}
                   disabled={isSaving || !form.buyer_name || (activeTab === 'cinnamon' || activeTab === 'pepper' ? !form.quantity_kg : !form.quantity) || !form.incomeAccountId}
                   className={`w-full py-5 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 ${activeTab === 'cinnamon' ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-500/30' : activeTab === 'coconut' ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 shadow-cyan-500/30' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/30'}`}
                 >
                    {isSaving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Wallet size={20} />}
                    Authorize Transaction & Post GL
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
