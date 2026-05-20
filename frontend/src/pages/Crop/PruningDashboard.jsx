import React, { useState, useMemo, useEffect } from "react";
import {
  Scissors, Search, Filter, Layers, Target, Clock, AlertTriangle,
  CheckCircle2, X, Sprout, Loader2, CalendarClock, Edit2,
  Download, FileSpreadsheet, FileText, ChevronDown, Users,
  Leaf, User, Save, Map, Activity, TrendingUp, Calendar,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBlockArea = (block) => {
  const dbArea = Number(block.area_acres) || 0;
  return dbArea;
};

function getPruneStatus(field) {
  if (field.age < 5) return { label: "Immature", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", priority: 0 };
  if (!field.lastPrune) {
    if (field.age >= 15) return { label: "Overdue", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", priority: 3 };
    if (field.age >= 10) return { label: "Due Soon", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", priority: 2 };
    return { label: "Pending", color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20", priority: 1 };
  }
  return { label: "Pruned", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", priority: 0 };
}

function getNextPruning(field) {
  const PRUNE_CYCLE = 5;
  const currentYear = new Date().getFullYear();
  if (field.age < 5) return { year: field.yop + 5, month: "Jan" };
  if (field.lastPrune) {
    const parsed = new Date(field.lastPrune);
    const lastYear = isNaN(parsed) ? parseInt(field.lastPrune) : parsed.getFullYear();
    const lastMonth = isNaN(parsed) ? 0 : parsed.getMonth();
    const nextYear = lastYear + PRUNE_CYCLE;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return { year: nextYear, month: months[lastMonth] };
  }
  if (field.age >= 15) return { year: currentYear, month: "ASAP" };
  if (field.age >= 10) return { year: currentYear + 1, month: "—" };
  return { year: field.yop + 10, month: "—" };
}

function getPruningStage(age) {
  if (age <= 1) return { stage: "Decentering", action: "15-20 cm cut" };
  if (age === 2) return { stage: "Tipping", action: "40 cm cut" };
  if (age === 3 || age === 4) return { stage: "Light Skiffing", action: "Leveling table" };
  if (age === 5) return { stage: "Formative Prune", action: "45-50 cm cut" };
  if (age >= 20) return { stage: "Collar Prune", action: "30-40 cm cut" };
  return { stage: "Mature Cycle", action: "+5 cm cut" };
}

export default function PruningDashboard() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = selectedDate.toLocaleDateString('sv-SE');
  const dayLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchData();
  }, [dateStr]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/crop/blocks');
      if (res.success) {
        const currentYear = new Date().getFullYear();
        const mapped = (res.data || []).map(b => {
          const plantingYear = parseInt(b.planting_year) || currentYear;
          return {
            id: b.id,
            field: b.name,
            name: b.name,
            extent: (Number(b.area_acres) || 0).toFixed(2),
            yop: plantingYear,
            age: currentYear - plantingYear,
            lastPrune: b.last_pruned_date,
            prunedBy: b.pruned_by,
            status: b.status,
            assignedPax: b.assigned_workers_today || 0
          };
        });
        setFields(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch pruning data:", err);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const stats = useMemo(() => {
    const totalExtent = fields.reduce((s, f) => s + (parseFloat(f.extent) || 0), 0);
    const pruned = fields.filter(f => f.lastPrune).length;
    const overdue = fields.filter(f => !f.lastPrune && f.age >= 15).length;
    const activePax = fields.reduce((s, f) => s + (f.assignedPax || 0), 0);
    return { totalExtent, pruned, overdue, activePax, total: fields.length };
  }, [fields]);

  const filtered = useMemo(() => {
    let result = fields.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a, b) => {
      if (sortBy === "age") return b.age - a.age;
      if (sortBy === "extent") return parseFloat(b.extent) - parseFloat(a.extent);
      return a.id - b.id;
    });
    return result;
  }, [fields, search, sortBy]);

  const exportToExcel = () => {
    const dataToExport = filtered.map(f => {
      const next = getNextPruning(f);
      return {
        'Block Name': f.name,
        'Extent (Ac)': f.extent,
        'YOP': f.yop,
        'Age': f.age,
        'Last Pruned': f.lastPrune || 'Never',
        'Next Pruning Cycle': `${next.month} ${next.year}`
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pruning_Management");
    XLSX.writeFile(workbook, `Tea_Pruning_Schedule_${dateStr}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("TeaERP Pro - Tea Pruning Management Dashboard", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${dayLabel}`, 14, 22);

    const tableData = filtered.map(f => {
      const next = getNextPruning(f);
      return [f.name, f.extent, f.yop, f.age, f.lastPrune || 'Never', `${next.month} ${next.year}`];
    });

    autoTable(doc, {
      startY: 30,
      head: [['Block', 'Extent (Ac)', 'YOP', 'Age', 'Last Pruned', 'Next Cycle']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] }
    });

    doc.save(`Pruning_Schedule_${dateStr}.pdf`);
    setShowExportOptions(false);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header (Strict Plucking Intel Style) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Pruning Management</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Activity size={14} className="text-rose-500" /> Advanced field pruning and forestry cycle tracking
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
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                  <FileText size={16} /> PDF Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Navigator + Stats Bar (Strict Plucking Intel Style) */}
      <div className="premium-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-rose-200 dark:hover:border-rose-900/50 transition-all">
              <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-rose-600">
                <ChevronLeft size={22} />
              </button>

              <div className="flex flex-col items-center min-w-[180px]">
                <div className="relative">
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="bg-transparent text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white outline-none cursor-pointer font-outfit"
                  />
                </div>
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mt-0.5 opacity-80">{dayLabel.split(',')[0]}</p>
              </div>

              <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-rose-600">
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          <div className="flex gap-8 items-center pr-4">
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Force</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-outfit text-rose-600">{stats.activePax}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">PAX</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Compliance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-outfit text-slate-900 dark:text-white">{Math.round((stats.pruned / stats.total) * 100) || 0}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">%</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Overdue</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-outfit text-rose-600">{stats.overdue}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">Blocks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Registry Section (Premium Card List Style) */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 w-full pl-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by block name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-3 pl-12 pr-4 text-xs font-bold outline-none"
            />
          </div>
          <div className="flex items-center gap-2 pr-2">
            <Filter size={14} className="text-slate-400 ml-2" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 outline-none cursor-pointer p-2"
            >
              <option value="id">Sort: Block ID</option>
              <option value="age">Sort: Age</option>
              <option value="extent">Sort: Extent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filtered.length === 0 ? (
            <div className="premium-card h-64 flex flex-col items-center justify-center text-slate-400 border-dashed border-2 bg-slate-50 dark:bg-slate-900/50">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Scissors size={32} className="opacity-20" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] italic">No Blocks Found</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Try adjusting your search criteria</p>
            </div>
          ) : filtered.map((f, idx) => {
            const status = getPruneStatus(f);
            const nextPruning = getNextPruning(f);
            const pruningStage = getPruningStage(f.age);

            return (
              <div key={f.id || `block-${idx}`} className="premium-card p-0 overflow-hidden group hover:border-rose-200 transition-all duration-300">
                <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Scissors size={20} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-white text-lg font-outfit tracking-tight leading-none mb-1.5">{f.name}</h5>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YOP: {f.yop}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${f.age >= 15 ? 'text-rose-500' : 'text-slate-500'}`}>{f.age} Years Old</span>
                         <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{pruningStage.stage}</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic hidden sm:inline-block">({pruningStage.action})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Extent / Muster</p>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{f.extent} Ac</span>
                        {f.assignedPax > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 italic">
                            <Users size={10} /> {f.assignedPax}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic opacity-40">Zero Deployed</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Last Pruned</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                        {f.lastPrune ? new Date(f.lastPrune).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "N/A"}
                      </p>
                    </div>

                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Next Prune</p>
                      <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                        {nextPruning.month} {nextPruning.year}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center px-4 py-2 rounded-xl border ${status.bg}`}>
                        <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}