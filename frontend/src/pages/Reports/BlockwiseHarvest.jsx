import React, { useState, useEffect } from 'react';
import {
  Sprout, Search, Filter, BarChart3, Map, Layers, Target, Users,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity,
  TrendingUp, RefreshCcw, Download, FileText, FileSpreadsheet, ChevronDown
} from 'lucide-react';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BlockwiseHarvest() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to Current Month
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState({}); // { blockId: boolean }
  const [blockWorkers, setBlockWorkers] = useState({}); // { blockId: workers[] }
  const [loadingDetails, setLoadingDetails] = useState({}); // { blockId: boolean }

  useEffect(() => {
    fetchSummary();
  }, [selectedDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth() + 1;
      const res = await apiClient.get(`/crop/plucking-logs/summary?year=${y}&month=${m}`);
      if (res.success) {
        setSummary(res.data);
      }
    } catch (error) {
      console.error('Fetch summary failed', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const toggleBlockDetails = async (blockId) => {
    if (expandedBlocks[blockId]) {
      setExpandedBlocks(prev => ({ ...prev, [blockId]: false }));
      return;
    }

    setExpandedBlocks(prev => ({ ...prev, [blockId]: true }));

    if (!blockWorkers[blockId]) {
      setLoadingDetails(prev => ({ ...prev, [blockId]: true }));
      try {
        const y = selectedDate.getFullYear();
        const m = selectedDate.getMonth() + 1;
        const res = await apiClient.get(`/crop/plucking-logs/block-details?block_id=${blockId}&year=${y}&month=${m}`);
        if (res.success) {
          setBlockWorkers(prev => ({ ...prev, [blockId]: res.data }));
        }
      } catch (error) {
        console.error('Fetch block workers failed', error);
      } finally {
        setLoadingDetails(prev => ({ ...prev, [blockId]: false }));
      }
    }
  };

  const filteredData = (summary?.byBlock || []).filter(b =>
    b.block_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // EXPORT FUNCTIONS
  const exportToExcel = () => {
    const dataToExport = filteredData.map(item => ({
      'Block Name': item.block_name,
      'Entries': item.entries,
      'Total Leaf (kg)': item.total_leaf,
      'Area (Ac)': item.area_acres,
      'Yield/Acre (YPA)': item.area_acres > 0 ? (item.total_leaf / item.area_acres).toFixed(2) : '0.00',
      'Labor (Pax)': item.total_workers,
      'Efficiency (kg/Pax)': item.total_workers > 0 ? (item.total_leaf / item.total_workers).toFixed(2) : '0.00'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Harvest_Report");
    XLSX.writeFile(workbook, `Harvest_Registry_${selectedDate.toISOString().split('T')[0]}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text(`TeaERP Pro - Blockwise Harvest Registry`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Report Period: ${selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`, 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);

    const tableData = filteredData.map(b => [
      b.block_name,
      b.entries,
      `${Number(b.total_leaf).toFixed(1)} kg`,
      `${Number(b.area_acres).toFixed(2)} ac`,
      (b.area_acres > 0 ? (b.total_leaf / b.area_acres).toFixed(2) : '0.00'),
      b.total_workers,
      (b.total_workers > 0 ? (b.total_leaf / b.total_workers).toFixed(2) : '0.00')
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Block Name', 'Entries', 'Total Leaf', 'Area', 'YPA', 'Labor', 'Efficiency']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });

    doc.save(`Harvest_Registry_${selectedDate.toISOString().split('T')[0]}.pdf`);
    setShowExportOptions(false);
  };

  const grandTotalLeaf = summary?.grandLeaf || 0;
  const grandTotalPluckers = summary?.grandWorkers || 0;
  const activeDays = summary?.activeDays || 0;

  const monthName = selectedDate.toLocaleString('default', { month: 'long' });
  const yearName = selectedDate.getFullYear();

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">

      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Blockwise Harvest Registry</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Sprout size={14} className="text-emerald-500" /> Granular plucking performance and yield intelligence
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-emerald-600"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex flex-col items-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white font-outfit text-center">
                {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-emerald-600"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={13} /> Export
            </button>

            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-[100] p-1.5 animate-in slide-in-from-top-2">
                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-left"
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                >
                  <FileText size={14} /> PDF
                </button>
              </div>
            )}
          </div>

          <button onClick={fetchSummary} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            <RefreshCcw size={14} className={loading ? 'animate-spin text-emerald-500' : 'text-slate-400'} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-emerald-600 border-2 border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 border-dashed shadow-sm">
          <Activity className="animate-pulse mb-4" size={40} />
          <span className="text-xs font-black uppercase tracking-widest opacity-70">Aggregating Block Data...</span>
        </div>
      ) : (
        <>
          {/* Analytics Summary - Bio Assets Style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Estate Harvest", value: grandTotalLeaf, unit: "kg", color: "text-emerald-500", icon: Layers, gradient: "from-emerald-500/20 to-emerald-500/5" },
              { label: "Daily Avg Yield", value: activeDays ? (grandTotalLeaf / activeDays).toFixed(1) : '0', unit: "kg/day", color: "text-amber-500", icon: Target, gradient: "from-amber-500/20 to-amber-500/5" },
              { label: "Active Harvest Days", value: activeDays, unit: "Days", color: "text-blue-500", icon: Map, gradient: "from-blue-500/20 to-blue-500/5" },
              { label: "Total Pluckers", value: grandTotalPluckers, unit: "PAX", color: "text-indigo-500", icon: Users, gradient: "from-indigo-500/20 to-indigo-500/5" },
            ].map((stat, idx) => (
              <div key={idx} className="premium-card relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} -mr-8 -mt-8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 opacity-50`}></div>
                <div className="relative flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={stat.color} size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{stat.unit}</span>
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Blockwise Registry Table */}
          <div className="premium-card overflow-hidden p-0 border-none shadow-2xl relative mt-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>

            <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic flex items-center gap-3">
                  <Map size={20} className="text-emerald-500" /> Monthly Crop Distribution
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-2.5">Block Name</th>
                    <th className="px-4 py-2.5 text-center">Pluckers</th>
                    <th className="px-4 py-2.5 text-center">Days</th>
                    <th className="px-4 py-2.5 text-right">Total Leaf (kg)</th>
                    <th className="px-4 py-2.5 text-right">Block Area</th>
                    <th className="px-2 py-2.5 text-right">Yield (YPA)</th>
                    <th className="px-4 py-2.5 text-right min-w-[160px]">Avg (kg/Pax)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredData.length > 0 ? filteredData.map((b, i) => {
                    const avgPerPax = b.total_workers > 0 ? (b.total_leaf / b.total_workers).toFixed(2) : '0.00';
                    const ypa = b.area_acres > 0 ? (b.total_leaf / b.area_acres).toFixed(2) : '0.00';
                    return (
                      <React.Fragment key={i}>
                        <tr
                          onClick={() => toggleBlockDetails(b.block_id)}
                          className={`cursor-pointer transition-colors group ${expandedBlocks[b.block_id] ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'hover:bg-white dark:hover:bg-slate-800'}`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white block uppercase tracking-tight">{b.block_name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-tighter">
                              {b.total_workers} PAX
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white font-outfit italic">
                              {b.plucking_days} <span className="text-[9px] text-slate-400 not-italic uppercase">Days</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-black text-sm text-emerald-600 dark:text-emerald-400 text-right font-outfit italic tracking-tight">
                            {Number(b.total_leaf).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-[10px] text-slate-400 italic uppercase">kg</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-xs text-slate-600 dark:text-slate-400">
                            {Number(b.area_acres).toFixed(2)} <span className="text-[9px] font-black text-slate-400 uppercase opacity-70 tracking-widest ml-0.5">ac</span>
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {ypa > 100 ? <TrendingUp size={14} className="text-emerald-500" /> : null}
                              <span className={`font-black text-xs font-mono ${ypa > 100 ? 'text-emerald-500' : 'text-slate-500'}`}>
                                {ypa}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right min-w-[160px]">
                            <div className="flex items-center justify-end gap-3">
                              <span className={`font-black text-[10px] px-3 py-1 rounded-full border ${avgPerPax >= 25 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : avgPerPax < 18 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                                {avgPerPax} kg/PAX
                              </span>
                              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${expandedBlocks[b.block_id] ? 'rotate-180 text-emerald-500' : ''}`} />
                            </div>
                          </td>
                        </tr>
                        {expandedBlocks[b.block_id] && (
                          <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                            <td colSpan={7} className="px-8 py-6">
                              <div className="animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                      <Users size={16} />
                                    </div>
                                    <div>
                                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">Labour Performance Matrix</h4>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Top performing pluckers for {b.block_name}</p>
                                    </div>
                                  </div>
                                </div>

                                {loadingDetails[b.block_id] ? (
                                  <div className="flex items-center gap-3 py-8 text-emerald-600 justify-center">
                                    <Activity className="animate-spin" size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Synchronizing Performance Data...</span>
                                  </div>
                                ) : blockWorkers[b.block_id] && blockWorkers[b.block_id].length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {[...blockWorkers[b.block_id]].sort((a, b) => b.total_kg - a.total_kg).map((w, idx) => {
                                      const maxKg = Math.max(...blockWorkers[b.block_id].map(x => Number(x.total_kg)), 1);
                                      const weightPct = (Number(w.total_kg) / maxKg) * 100;
                                      return (
                                        <div key={idx} className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-sm group/w transition-all hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5">
                                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200/50 group-hover/w:scale-105 transition-transform">
                                            {w.photo ? (
                                              <img src={w.photo.startsWith('data:') ? w.photo : `/api/uploads/${w.photo}`} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="text-emerald-500 font-black text-[10px]">{w.first_name[0]}{w.last_name[0]}</div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter">{w.first_name} {w.last_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ID: {w.worker_id}</span>
                                              <span className="w-0.5 h-0.5 rounded-full bg-slate-200"></span>
                                              <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest">{w.days_worked}D</span>
                                            </div>
                                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                              <div className="h-full bg-emerald-500/40" style={{ width: `${weightPct}%` }}></div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-outfit italic tracking-tighter leading-none mb-1">
                                              {Number(w.total_kg).toFixed(1)}<span className="text-[8px] not-italic text-slate-400 uppercase ml-0.5">kg</span>
                                            </p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Avg: {w.days_worked > 0 ? (w.total_kg / w.days_worked).toFixed(1) : '0.0'}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="py-12 text-center bg-white/50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <Users size={40} className="mx-auto text-slate-300 mb-4 opacity-20" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">No individual performance metrics identified for this block</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Map size={48} className="opacity-20 mb-4" />
                          <p className="font-bold uppercase text-xs tracking-widest italic opacity-60">No harvest records available for this period</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredData.length > 0 && (() => {
                    const totalArea = filteredData.reduce((s, b) => s + Number(b.area_acres || 0), 0);
                    const aggregateYPA = totalArea > 0 ? (grandTotalLeaf / totalArea).toFixed(2) : '0.00';
                    return (
                      <tr className="bg-emerald-50 dark:bg-emerald-900/10 font-black border-t-2 border-emerald-500/20">
                        <td className="px-4 py-4 text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Monthly Aggregation</td>
                        <td className="px-4 py-4 text-center text-emerald-600/80 font-bold text-xs">{grandTotalPluckers} PAX</td>
                        <td className="px-4 py-4 text-center text-emerald-600/80 font-bold text-xs">{activeDays} Days</td>
                        <td className="px-4 py-4 text-right text-emerald-600 dark:text-emerald-400 text-base font-outfit italic tracking-tighter">{grandTotalLeaf.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg</td>
                        <td className="px-4 py-4 text-right text-emerald-600/80 font-bold text-xs">{totalArea.toFixed(2)} ac</td>
                        <td className="px-2 py-4 text-right text-emerald-600/80 font-mono text-[10px]">{aggregateYPA}</td>
                        <td className="px-4 py-4 text-right text-emerald-600/80 font-bold text-xs">{(grandTotalLeaf / (grandTotalPluckers || 1)).toFixed(2)} avg</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Timeline & Performance Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Daily Timeline */}
            <div className="premium-card p-0 overflow-hidden shadow-xl border-none">
              <div className="px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 font-outfit uppercase tracking-tight italic">Daily Yield Timeline</h4>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Blocks</th>
                      <th className="px-4 py-2.5 text-right">Yield</th>
                      <th className="px-4 py-2.5 text-right">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {(() => {
                      let cum = 0;
                      return (summary?.daily || []).map(d => {
                        cum += Number(d.total_leaf);
                        return (
                          <tr key={d.log_date} className="hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                            <td className="px-4 py-2.5 font-bold text-xs text-slate-700 dark:text-slate-300">
                              {new Date(d.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.active_blocks} Units</td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-900 dark:text-white font-outfit italic text-sm">
                              {Number(d.total_leaf).toFixed(1)} <span className="text-[9px] text-slate-400 not-italic">kg</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-emerald-600 dark:text-emerald-400 font-outfit text-sm">
                              {cum.toFixed(1)}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                    {(!summary || summary.daily.length === 0) && (
                      <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic opacity-60">No records this month</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Block Performance Bars */}
            <div className="premium-card p-0 overflow-hidden shadow-xl border-none">
              <div className="px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 font-outfit uppercase tracking-tight italic">Block Performance Breakdown</h4>
                <BarChart3 size={16} className="text-emerald-500" />
              </div>
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {(summary?.byBlock || []).map((b, idx) => {
                  const maxLeaf = Math.max(...summary.byBlock.map(x => Number(x.total_leaf)), 1);
                  const pct = Math.round((Number(b.total_leaf) / maxLeaf) * 100);
                  const avg = b.total_workers > 0 ? (Number(b.total_leaf) / Number(b.total_workers)).toFixed(1) : '-';
                  return (
                    <div key={b.block_id} className="space-y-2 group">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter w-4">{idx + 1}</span>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-outfit uppercase tracking-tight">{b.block_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">{Number(b.total_leaf).toFixed(1)} <span className="text-[10px] font-bold text-slate-400 not-italic uppercase">kg</span></span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Efficiency: {avg} kg/pl</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-1000 ${pct > 80 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                            pct > 50 ? 'bg-gradient-to-r from-teal-500 to-teal-300' :
                              'bg-gradient-to-r from-slate-400 to-slate-300'
                            }`}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!summary || summary.byBlock.length === 0) && (
                  <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic py-20 opacity-60">No block data available</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
