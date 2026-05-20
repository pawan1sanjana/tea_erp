import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, BarChart3, TrendingUp, Target, 
  Award, Calendar, ChevronLeft, ChevronRight, Download, 
  FileText, FileSpreadsheet, Activity, Star, RefreshCcw, Clock
} from 'lucide-react';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PluckerPerformance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to current month
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [expandedWorker, setExpandedWorker] = useState(null); // workerId
  const [workerDetails, setWorkerDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  useEffect(() => {
    fetchPerformance();
  }, [selectedDate]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth() + 1;
      const url = `/crop/plucker-performance?year=${y}&month=${m}`;
      const res = await apiClient.get(url);
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Fetch performance failed', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerDetails = async (workerId) => {
    if (expandedWorker === workerId) {
      setExpandedWorker(null);
      return;
    }
    setExpandedWorker(workerId);
    setLoadingDetails(true);
    try {
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth() + 1;
      const res = await apiClient.get(`/crop/plucker-performance/${workerId}?year=${y}&month=${m}`);
      if (res.success) {
        setWorkerDetails(res.data);
      }
    } catch (error) {
      console.error('Fetch worker details failed', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const changeMonth = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const filteredData = data.filter(w =>
    `${w.first_name} ${w.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.worker_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const exportToExcel = () => {
    const dataToExport = filteredData.map(w => ({
      'Worker Name': `${w.first_name} ${w.last_name}`,
      'Worker Code': w.worker_code,
      'Total Leaf (kg)': w.total_kg,
      'Days Worked': w.days_worked,
      'Avg Daily (kg)': Number(w.avg_daily_kg).toFixed(2),
      'Best Entry (kg)': w.best_entry
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance_Report");
    XLSX.writeFile(workbook, `Plucker_Performance_${selectedDate.toISOString().split('T')[0]}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('portrait');
    doc.setFontSize(18);
    doc.text(`TeaERP Pro - Plucker Performance Registry`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Report Period: ${selectedDate.toLocaleDateString(undefined, {month:'long', year:'numeric'})}`, 14, 22);
    
    const tableData = filteredData.map(w => [
      `${w.first_name} ${w.last_name}`,
      w.worker_code,
      `${Number(w.total_kg).toFixed(1)} kg`,
      w.days_worked,
      Number(w.avg_daily_kg).toFixed(2),
      w.best_entry
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Worker Name', 'Code', 'Total Yield', 'Days', 'Avg Daily', 'Best']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [56, 173, 108] }
    });

    doc.save(`Plucker_Performance_${selectedDate.toISOString().split('T')[0]}.pdf`);
    setShowExportOptions(false);
  };

  const topPerformer = data.length > 0 ? data[0] : null;
  const totalMonthLeaf = data.reduce((s, w) => s + Number(w.total_kg), 0);
  const activeWorkers = data.length;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Plucker Performance Registry</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Activity size={14} className="text-tea-500" /> Individual plucking audit and workforce analytics
          </p>
        </div>
        <div className="flex gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit shadow-sm bg-white dark:bg-slate-900"
            >
              <Download size={16} /> Export
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in slide-in-from-top-2">
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                  <FileSpreadsheet size={16} /> Excel Spreadsheet
                </button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                  <FileText size={16} /> PDF Document
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500"><ChevronLeft size={20} /></button>
            <span className="text-sm font-black uppercase tracking-widest min-w-[120px] text-center text-slate-900 dark:text-white">
              {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500"><ChevronRight size={20} /></button>
          </div>
          <button onClick={fetchPerformance} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            <RefreshCcw size={18} className={loading ? 'animate-spin text-tea-500' : 'text-slate-400'} />
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card relative overflow-hidden group col-span-1 md:col-span-2">
           <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-tea-500/20 to-transparent -mr-8 -mt-8 rounded-full blur-2xl"></div>
           <div className="relative flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-tea-500/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden shrink-0">
                {topPerformer?.photo ? (
                  <img 
                    src={topPerformer.photo.startsWith('data:') ? topPerformer.photo : `/api/uploads/${topPerformer.photo}`} 
                    alt={topPerformer.first_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Award size={32} className="text-tea-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Top Performer (Monthly)</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight truncate">
                  {topPerformer ? `${topPerformer.first_name} ${topPerformer.last_name}` : 'N/A'}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black text-tea-600">{topPerformer ? Number(topPerformer.total_kg).toFixed(1) : '0'} kg</span>
                  </div>
                 <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-500">{topPerformer ? Number(topPerformer.avg_daily_kg).toFixed(1) : '0'} kg/day avg</span>
                 </div>
                </div>
              </div>
           </div>
        </div>

        <div className="premium-card relative overflow-hidden group">
          <div className="relative">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Month Leaf</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">
              {totalMonthLeaf.toLocaleString()} <span className="text-[10px] not-italic text-slate-400 uppercase">kg</span>
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Activity size={12} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">System Aggregate</span>
            </div>
          </div>
        </div>

        <div className="premium-card relative overflow-hidden group">
          <div className="relative">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Active Workforce</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">
              {activeWorkers} <span className="text-[10px] not-italic text-slate-400 uppercase">PAX</span>
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Users size={12} className="text-blue-500" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Unique Pluckers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="premium-card bg-slate-50/50 dark:bg-slate-900/50 border-dashed py-5">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Search Pluckers</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by worker name or employee ID..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-tea-600 hover:border-tea-200 transition-all shadow-sm">
                <Filter size={14} /> Criteria
             </button>
             <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-tea-600 hover:border-tea-200 transition-all shadow-sm">
                <BarChart3 size={14} /> Full Audit
             </button>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="premium-card overflow-hidden p-0 border-none shadow-2xl">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-tea-600">
            <RefreshCcw size={40} className="animate-spin mb-4 opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Synchronizing Workforce Data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic">
            <Search size={40} className="opacity-20 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">No worker records found matching your query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Worker Profile</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Days Worked</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Entries</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total Yield</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Avg Daily</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Peak</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                {currentEntries.map((w, i) => {
                  const actualIndex = indexOfFirstEntry + i;
                  const rankIcon = actualIndex === 0 ? '🏆' : actualIndex === 1 ? '🥈' : actualIndex === 2 ? '🥉' : null;
                  const isExpanded = expandedWorker === w.id;
                  return (
                    <React.Fragment key={w.id}>
                      <tr 
                        onClick={() => fetchWorkerDetails(w.id)}
                        className={`cursor-pointer transition-all group ${isExpanded ? 'bg-tea-50 dark:bg-tea-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-tea-500/10 flex items-center justify-center border border-tea-500/20 shadow-sm group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                              {w.photo ? (
                                <img 
                                  src={w.photo.startsWith('data:') ? w.photo : `/api/uploads/${w.photo}`} 
                                  alt={w.first_name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <span className="text-[10px] font-black text-tea-600 uppercase">
                                  {w.first_name[0]}{w.last_name[0]}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 dark:text-white block uppercase tracking-tight truncate">{w.first_name} {w.last_name}</span>
                              <span className="text-[8px] uppercase tracking-widest font-black text-slate-400">ID: {w.worker_code}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {w.days_worked} d
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-xs text-slate-500 dark:text-slate-400">
                          {w.total_entries}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-outfit italic tracking-tight">
                            {Number(w.total_kg).toFixed(1)} <span className="text-[9px] text-slate-400 italic uppercase">kg</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-xs text-slate-900 dark:text-white font-outfit italic">
                          {Number(w.avg_daily_kg).toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right">
                           <span className="text-xs font-black text-tea-600 font-outfit">{Number(w.best_entry).toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-base">{rankIcon || <span className="text-[10px] font-black text-slate-300">#{actualIndex + 1}</span>}</span>
                            <ChevronRight size={14} className={`text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-tea-500' : ''}`} />
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-8 py-0 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="py-6 border-l-2 border-dashed border-tea-200 dark:border-tea-900/50 ml-5 pl-10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Clock size={12} className="text-tea-500" /> Daily Performance Breakdown
                              </h5>
                              {loadingDetails ? (
                                <div className="flex items-center gap-3 py-4 text-tea-600">
                                  <RefreshCcw size={16} className="animate-spin opacity-50" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Aggregating timeline...</span>
                                </div>
                              ) : workerDetails.length === 0 ? (
                                <p className="text-[10px] font-black text-slate-400 uppercase italic py-4">No detailed logs found for this period</p>
                              ) : (
                                <div className="space-y-2">
                                  {/* Table Header */}
                                  <div className="grid grid-cols-7 gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-200/50 dark:border-slate-700/50">
                                    <div className="col-span-1">Date</div>
                                    <div className="col-span-1">Block(s)</div>
                                    <div className="col-span-1 text-center">Morning</div>
                                    <div className="col-span-1 text-center">Midday</div>
                                    <div className="col-span-1 text-center">Afternoon</div>
                                    <div className="col-span-1 text-center">Evening</div>
                                    <div className="col-span-1 text-right text-tea-600">Daily Total</div>
                                  </div>

                                  {/* Grouped Data Rows */}
                                  {(() => {
                                    const grouped = {};
                                    workerDetails.forEach(log => {
                                      const d = new Date(log.log_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                                      if (!grouped[d]) grouped[d] = { Morning: 0, Midday: 0, Afternoon: 0, Evening: 0, blocks: [] };
                                      grouped[d][log.interval_label] = Number(log.kg);
                                      if (!grouped[d].blocks.includes(log.block_name)) grouped[d].blocks.push(log.block_name);
                                    });

                                    return Object.entries(grouped).map(([date, sessions]) => {
                                      const dailyTotal = sessions.Morning + sessions.Midday + sessions.Afternoon + sessions.Evening;
                                      return (
                                        <div key={date} className="grid grid-cols-7 gap-2 items-center px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-tea-500/30 transition-all group/row shadow-sm">
                                          <div className="col-span-1">
                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{date}</p>
                                          </div>
                                          <div className="col-span-1">
                                            <div className="flex flex-wrap gap-1">
                                              {sessions.blocks.map(b => (
                                                <span key={b} className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-500 border border-slate-100 dark:border-slate-700">{b}</span>
                                              ))}
                                            </div>
                                          </div>
                                          {[ 'Morning', 'Midday', 'Afternoon', 'Evening' ].map(iv => (
                                            <div key={iv} className="col-span-1 text-center">
                                              <p className="text-[11px] font-black text-slate-900 dark:text-white font-outfit">
                                                {sessions[iv] > 0 ? `${sessions[iv].toFixed(1)}` : <span className="text-slate-300 dark:text-slate-700">—</span>} 
                                                {sessions[iv] > 0 && <span className="text-[8px] text-slate-400 ml-0.5 uppercase tracking-tighter">kg</span>}
                                              </p>
                                            </div>
                                          ))}
                                          <div className="col-span-1 text-right">
                                            <p className="text-sm font-black text-tea-600 dark:text-tea-400 font-outfit italic tracking-tighter">
                                              {dailyTotal.toFixed(1)} <span className="text-[9px] text-slate-400 not-italic uppercase tracking-tighter">kg</span>
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
             <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
               Showing <span className="text-slate-900 dark:text-white">{indexOfFirstEntry + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(indexOfLastEntry, filteredData.length)}</span> OF <span className="text-slate-900 dark:text-white">{filteredData.length}</span> Records
             </p>
             <div className="flex gap-2">
               <button 
                 onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-tea-500 dark:hover:border-tea-400 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronLeft size={16} />
               </button>
               {[...Array(totalPages)].map((_, i) => (
                 <button 
                   key={i} onClick={() => paginate(i+1)}
                   className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === i+1 ? 'bg-tea-600 dark:bg-tea-500 text-white shadow-lg shadow-tea-600/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-tea-500 dark:hover:border-tea-400 shadow-sm'}`}
                 >
                   {i+1}
                 </button>
               ))}
               <button 
                 onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-tea-500 dark:hover:border-tea-400 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
