import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, ArrowLeft, Download, 
  RefreshCcw, Calendar, User, FileText, Loader2, 
  ChevronLeft, ChevronRight, Package, Truck, Layers, Building2,
  Box, TrendingUp, AlertCircle, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';

export default function IssueHistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/inventory/goods/issue-history');
      if (response.success) setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch issue history:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const tableData = filteredHistory.map(h => ({
      'Date': new Date(h.issued_at).toLocaleString(),
      'Item Name': h.item_name,
      'SKU': h.sku,
      'Quantity': `${h.quantity} ${h.unit}`,
      'Issued To': h.issued_to,
      'Notes': h.notes || '—'
    }));
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IssueHistory');
    XLSX.writeFile(wb, `Stock_Issue_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredHistory = history.filter(h => 
    h.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.issued_to.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalIssuance: history.length,
    recentIssuance: history.filter(h => new Date(h.issued_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    majorRecipients: new Set(history.map(h => h.issued_to)).size
  };

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredHistory.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredHistory.length / entriesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-5">
           <button 
             onClick={() => navigate('/inventory/goods')}
             className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 hover:text-tea-500 shadow-sm transition-all"
           >
             <ArrowLeft size={20} />
           </button>
           <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-outfit">Logistical Audit</h1>
              <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1 italic">
                 <History size={14} className="text-tea-500" /> Authorized historical tracking of asset deployment records
              </p>
           </div>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-6 py-3.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit shadow-sm"
        >
          <Download size={16} /> Export Audit Log
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-tea-100 dark:bg-tea-900/30">
            <RefreshCcw size={22} className="text-tea-600 dark:text-tea-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 leading-none">Global Issues</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{stats.totalIssuance}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <TrendingUp size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 leading-none">Last 7 Days</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{stats.recentIssuance}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900/30">
            <Building2 size={22} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 leading-none">Active Sectors</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{stats.majorRecipients}</h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search SKU, item, or sector..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-tea-500/10 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/40 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
             Authorized Ledger Active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left font-bold">Event Timeline</th>
                <th className="px-6 py-4 text-left font-bold">Asset nomenclature</th>
                <th className="px-6 py-4 text-left font-bold">Deployment sector</th>
                <th className="px-6 py-4 text-center font-bold">Quantity</th>
                <th className="px-6 py-4 text-left font-bold">Engagement Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                   <td colSpan="5" className="py-24 text-center">
                      <Loader2 className="w-8 h-8 text-tea-500 animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing audit logs...</p>
                   </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                   <td colSpan="5" className="py-24 text-center text-slate-400 italic font-medium uppercase text-[10px] tracking-widest opacity-60">
                      No issuance records matching query
                   </td>
                </tr>
              ) : (
                currentEntries.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-400/5 transition-all group">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 border border-slate-200 dark:border-slate-700">
                            <Calendar size={14} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">{new Date(log.issued_at).toLocaleDateString()}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{new Date(log.issued_at).toLocaleTimeString()}</p>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-tea-50 dark:bg-tea-900/20 text-tea-600 flex items-center justify-center border border-tea-100 dark:border-tea-800/50">
                            <Package size={14} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.item_name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{log.sku}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800/30 font-black text-[10px] uppercase tracking-tight">
                          <MapPin size={10} /> {log.issued_to}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white uppercase">
                          {log.quantity} <span className="text-[10px] text-slate-400 font-bold opacity-70 italic lowercase">/{log.unit}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic font-medium max-w-sm">{log.notes || '—'}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredHistory.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
             <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
               Showing <span className="text-slate-900 dark:text-white">{indexOfFirstEntry + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(indexOfLastEntry, filteredHistory.length)}</span> OF <span className="text-slate-900 dark:text-white">{filteredHistory.length}</span> Records
             </p>
             <div className="flex gap-2">
               <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:border-tea-500 transition-all shadow-sm">
                 <ChevronLeft size={16} />
               </button>
               {[...Array(totalPages)].map((_, i) => (
                 <button key={i} onClick={() => paginate(i+1)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === i+1 ? 'bg-tea-600 text-white shadow-lg shadow-tea-500/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-tea-500'}`}>
                   {i+1}
                 </button>
               ))}
               <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:border-tea-500 transition-all shadow-sm">
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
