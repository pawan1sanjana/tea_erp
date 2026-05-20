import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Wallet,
  Building,
  Scale,
  ChevronRight,
  ChevronLeft,
  Package,
  CircleDot
} from 'lucide-react';
import { apiClient } from '../../api/client';

const COCONUT_CATEGORIES = ['Fresh Nuts', 'Copra', 'Husks', 'Charcoal', 'Seedlings', 'Other'];

export default function CoconutSales() {
  const [sales, setSales] = useState([]);
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
    category: 'Fresh Nuts',
    quantity: '',
    unit: 'nuts',
    rate_per_unit: '',
    incomeAccountId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        apiClient.get('/coconut/sales'),
        apiClient.get('/finance/accounts')
      ]);
      if (sRes.success) setSales(sRes.data);
      if (aRes.success) {
        const incomeAccs = aRes.data.filter(a => a.type === 'income');
        setAccounts(incomeAccs);
        // Pre-select Coconut Sales account if found
        const cocAcc = incomeAccs.find(a => a.name.toLowerCase().includes('coconut'));
        if (cocAcc) setForm(prev => ({ ...prev, incomeAccountId: cocAcc.id }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.post('/coconut/sales', form);
      if (response.success) {
        setShowForm(false);
        fetchData();
        setForm(prev => ({
          ...prev,
          buyer_name: '',
          quantity: '',
          rate_per_unit: ''
        }));
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSales = React.useMemo(() => {
    let result = sales;
    if (filterDate) {
      result = result.filter(s => new Date(s.sale_date).toISOString().split('T')[0] === filterDate);
    }
    return result;
  }, [sales, filterDate]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filterDate]);

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight flex items-center gap-3">
            Coconut <span className="text-cyan-600">Sales</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1 uppercase tracking-widest text-[10px]">
            <Package size={14} className="text-cyan-600" />
            Operational Revenue Ledger
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/30"
          >
            <Plus size={16} /> Record New Sale
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main List */}
        <div className="lg:col-span-12 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
               <TrendingUp className="text-cyan-600" /> Coconut Sales Registry
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-600 dark:text-slate-300"
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
               <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-600 rounded-full animate-spin mx-auto"></div>
               <p className="mt-4 text-slate-500 font-medium tracking-wide">Retrieving records...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 text-slate-400">
               <Package size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-bold">No sales records.</p>
               <p className="text-sm">Start by recording a fresh nut or copra shipment.</p>
            </div>
          ) : (
            <div className="premium-card overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Buyer</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Type / Quantity</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Rate</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Revenue</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {paginatedSales.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                           <td className="py-4 px-6 text-sm font-bold text-slate-600 dark:text-slate-400">
                              {new Date(s.sale_date).toLocaleDateString()}
                           </td>
                           <td className="py-4 px-6">
                              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.buyer_name}</p>
                           </td>
                           <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                 <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-700 text-[10px] font-black uppercase tracking-wider">{s.category}</span>
                                 <span className="text-sm font-bold text-slate-900 dark:text-white">{s.quantity} {s.unit}</span>
                              </div>
                           </td>
                           <td className="py-4 px-6 text-sm font-bold text-slate-600 dark:text-slate-400">
                              Rs. {s.rate_per_unit} / {s.unit}
                           </td>
                           <td className="py-4 px-6 text-right">
                              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">
                                 Rs. {Number(s.total_amount).toLocaleString()}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {totalPages > 1 && (
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                   <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} records</span>
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
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-cyan-50/50 dark:bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
                       <Plus size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Coconut Sale</h3>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Income Transaction</p>
                    </div>
                 </div>
                 <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">✕</button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sale Date</label>
                       <div className="relative">
                          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                          <input 
                            type="date"
                            value={form.sale_date}
                            onChange={(e) => setForm({...form, sale_date: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sale Category</label>
                       <div className="relative">
                          <CircleDot size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                          <select 
                            value={form.category}
                            onChange={(e) => setForm({...form, category: e.target.value, unit: e.target.value === 'Copra' ? 'kg' : 'nuts'})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 transition-all"
                          >
                            {COCONUT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Buyer Information</label>
                       <div className="relative">
                          <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                          <input 
                            placeholder="e.g. Local Dealer, Factory Name"
                            value={form.buyer_name}
                            onChange={(e) => setForm({...form, buyer_name: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quantity ({form.unit})</label>
                       <div className="relative">
                          <Scale size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={form.quantity}
                            onChange={(e) => setForm({...form, quantity: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rate per {form.unit} (LKR)</label>
                       <input 
                         type="number"
                         placeholder="0.00"
                         value={form.rate_per_unit}
                         onChange={(e) => setForm({...form, rate_per_unit: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 transition-all"
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Finance Account</label>
                       <select 
                         value={form.incomeAccountId}
                         onChange={(e) => setForm({...form, incomeAccountId: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 transition-all"
                       >
                         <option value="">Select Account</option>
                         {accounts.map(a => <option key={a.id} value={a.id}>{a.code} • {a.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="p-6 rounded-[2rem] bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/20">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em]">Total Transaction Value</p>
                          <p className="text-3xl font-black text-cyan-700 dark:text-cyan-300 mt-1">Rs. {(Number(form.quantity || 0) * Number(form.rate_per_unit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                       </div>
                       <Wallet size={32} className="text-cyan-500/40" />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                 <button 
                   onClick={handleSave}
                   disabled={isSaving || !form.buyer_name || !form.quantity || !form.incomeAccountId}
                   className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-cyan-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSaving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={20} />}
                    Post Coconut Revenue
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
